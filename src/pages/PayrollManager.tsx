import { useState, useEffect } from 'react';
import { payrollService } from '../services/payrollService';
import { userService } from '../services/userService';
import { User, SalaryStructure, SalarySlip, PayrollRun } from '../types';
import { 
  DollarSign, 
  Settings, 
  Plus, 
  Download, 
  TrendingUp, 
  Sparkles, 
  Users, 
  Calendar, 
  Check, 
  ShieldCheck, 
  Search,
  Wallet
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';

export function PayrollManager() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [salarySlips, setSalarySlips] = useState<SalarySlip[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [activeTab, setActiveTab] = useState<'runs' | 'structures' | 'slips'>('runs');
  
  // Salary Structure Form State
  const [baseSalary, setBaseSalary] = useState(3500);
  const [housing, setHousing] = useState(500);
  const [transport, setTransport] = useState(250);
  const [meal, setMeal] = useState(150);
  const [tax, setTax] = useState(12); // percent
  const [pf, setPf] = useState(5); // percent
  const [insurance, setInsurance] = useState(80); // fixed
  
  // Run Payroll Form State
  const [payrollPeriod, setPayrollPeriod] = useState('2026-06');
  
  // Search and filter
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Sync active data
    userService.getAllUsers().then(setEmployees);
    
    const unsubSlips = payrollService.subscribeToSalarySlips(null, setSalarySlips);
    const unsubRuns = payrollService.subscribeToPayrollRuns(setPayrollRuns);
    
    return () => {
      unsubSlips();
      unsubRuns();
    };
  }, []);

  useEffect(() => {
    if (selectedEmp) {
      payrollService.getSalaryStructure(selectedEmp.uid).then(struct => {
        if (struct) {
          setSalaryStructure(struct);
          setBaseSalary(struct.baseSalary);
          setHousing(struct.allowances.housing);
          setTransport(struct.allowances.transport);
          setMeal(struct.allowances.meal);
          setTax(struct.deductions.tax);
          setPf(struct.deductions.providentFund);
          setInsurance(struct.deductions.insurance);
        } else {
          setSalaryStructure(null);
          // Set defaults
          setBaseSalary(3500);
          setHousing(500);
          setTransport(200);
          setMeal(150);
          setTax(10);
          setPf(5);
          setInsurance(60);
        }
      });
    }
  }, [selectedEmp]);

  const handleSaveStructure = async () => {
    if (!selectedEmp) return;
    try {
      const data: Omit<SalaryStructure, 'id'> & { id?: string } = {
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        baseSalary,
        allowances: { housing, transport, meal },
        deductions: { tax, providentFund: pf, insurance },
        updatedAt: new Date().toISOString()
      };
      if (salaryStructure?.id) {
        data.id = salaryStructure.id;
      }
      await payrollService.saveSalaryStructure(data);
      toast.success('Salary structure configured successfully');
      
      // Audit Log
      await auditService.logAction(
        'Payroll Configured',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Base salary set to $${baseSalary} with customized allowances and tax deductions.`
      );
      
      // Update local structures
      const updated = await payrollService.getSalaryStructure(selectedEmp.uid);
      setSalaryStructure(updated);
    } catch {
      toast.error('Failed to configure salary structure');
    }
  };

  const handleRunPayroll = async () => {
    // Guard against duplicate runs
    if (payrollRuns.some(run => run.period === payrollPeriod)) {
      toast.error(`Payroll for period ${payrollPeriod} was already executed/disbursed`);
      return;
    }

    try {
      // Find all employees that have configured salary structures
      const structuresPromises = employees.map(emp => payrollService.getSalaryStructure(emp.uid));
      const structures = await Promise.all(structuresPromises);
      
      const configuredStructures = structures.filter(s => s !== null) as SalaryStructure[];
      if (configuredStructures.length === 0) {
        toast.error('No employees have configured salary structures. Please configure at least one first!');
        return;
      }

      let totalBase = 0;
      let totalAllowances = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const slipsBatches: Omit<SalarySlip, 'id'>[] = [];

      for (const struct of configuredStructures) {
        const allowancesSum = struct.allowances.housing + struct.allowances.transport + struct.allowances.meal;
        const taxAmount = Math.round(struct.baseSalary * (struct.deductions.tax / 100));
        const pfAmount = Math.round(struct.baseSalary * (struct.deductions.providentFund / 100));
        const deductionsSum = taxAmount + pfAmount + struct.deductions.insurance;
        const netPay = struct.baseSalary + allowancesSum - deductionsSum;

        const employee = employees.find(e => e.uid === struct.employeeId);

        totalBase += struct.baseSalary;
        totalAllowances += allowancesSum;
        totalDeductions += deductionsSum;
        totalNet += netPay;

        slipsBatches.push({
          employeeId: struct.employeeId,
          employeeName: struct.employeeName,
          employeeEmail: employee?.email || 'employee@company.com',
          period: payrollPeriod,
          baseSalary: struct.baseSalary,
          allowances: allowancesSum,
          deductions: deductionsSum,
          netPay,
          taxAmount,
          status: 'Draft'
        });
      }

      // Record payroll run
      await payrollService.createPayrollRun({
        period: payrollPeriod,
        status: 'Approved',
        totalBase,
        totalAllowances,
        totalDeductions,
        totalNet,
        runDate: new Date().toISOString().split('T')[0],
        processedBy: 'HR Admin'
      });

      // Submit salary slips
      await payrollService.createSalarySlipsBatch(slipsBatches);
      
      toast.success(`Successfully executed payroll for ${payrollPeriod}! ${slipsBatches.length} slips generated.`);
      
      await auditService.logAction(
        'Payroll Executed',
        undefined,
        payrollPeriod,
        `Generated ${slipsBatches.length} salary slips for a net sum of $${totalNet.toLocaleString()}`
      );
    } catch (err) {
      console.error(err);
      toast.error('Error running payroll pipeline');
    }
  };

  const handlePaySlip = async (id: string, name: string) => {
    try {
      await payrollService.markSalarySlipPaid(id);
      toast.success(`Salary slip for ${name} disbursed!`);
      await auditService.logAction('Salary Slip Paid', undefined, name, `Disbursed funds for ${payrollPeriod}`);
    } catch {
      toast.error('Failed to disburse salary slip');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-emerald" />
          Payroll & Disbursals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage employee salary structures, execute monthly payroll pipelines, and dispatch payslips.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('runs')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'runs' ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Payroll Runs
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'structures' ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Salary Configurations
        </button>
        <button
          onClick={() => setActiveTab('slips')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${activeTab === 'slips' ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Dispatched Payslips
        </button>
      </div>

      {/* CONTENT: Payroll Runs Tab */}
      {activeTab === 'runs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Executive Controls Panel */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warning animate-pulse" />
              Run New Payroll Statement
            </h3>
            <p className="text-xs text-muted-foreground">
              Run consolidated monthly payouts. This calculates base salary, allowances, and applies progressive tax deductions for all validated employees.
            </p>
            
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                  PAYROLL WORK PERIOD
                </label>
                <input
                  type="month"
                  value={payrollPeriod}
                  onChange={(e) => setPayrollPeriod(e.target.value)}
                  className="w-full bg-card border border-border p-2.5 rounded-lg text-sm text-foreground focus:outline-none focus:border-border"
                />
              </div>

              <button
                onClick={handleRunPayroll}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                Initialize Period Run ({payrollPeriod})
              </button>
            </div>
          </div>

          {/* History Panel */}
          <div className="md:col-span-2 bg-card border border-border p-5 rounded-xl">
            <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Payroll Period Operations Logs
            </h3>
            
            {payrollRuns.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-sm">
                No payroll statements run yet. Complete a statement run above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground space-y-2">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                      <th className="py-2.5">Period</th>
                      <th className="py-2.5">Run Date</th>
                      <th className="py-2.5">Gross Pay</th>
                      <th className="py-2.5">Total Deduct</th>
                      <th className="py-2.5 text-right">Net Disbursed</th>
                      <th className="py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {payrollRuns.map(run => (
                      <tr key={run.id} className="hover:bg-card/40">
                        <td className="py-3 font-semibold text-foreground">{run.period}</td>
                        <td className="py-3 text-xs">{run.runDate}</td>
                        <td className="py-3 text-xs">${(run.totalBase + run.totalAllowances).toLocaleString()}</td>
                        <td className="py-3 text-xs text-rose-500">-${run.totalDeductions.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-success">${run.totalNet.toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <span className="bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase">
                            {run.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT: Salary configurations tab */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee Directory Column */}
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              Choose Team Member
            </h3>
            
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-1">
              {employees
                .filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()))
                .map(emp => (
                  <button
                    key={emp.uid}
                    onClick={() => setSelectedEmp(emp)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition duration-150 ${selectedEmp?.uid === emp.uid ? 'bg-card text-foreground border-l-2 border-emerald-500' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}
                  >
                    <div>{emp.firstName} {emp.lastName}</div>
                    <div className="text-[10px] text-muted-foreground">{emp.jobTitle} • {emp.department}</div>
                  </button>
                ))}
            </div>
          </div>

          {/* Configuration Form Column */}
          <div className="md:col-span-2 bg-card border border-border p-5 rounded-xl space-y-4">
            {selectedEmp ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">
                      {selectedEmp.firstName} {selectedEmp.lastName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Configure base payouts, tax brackets, and insurance deductions.
                    </p>
                  </div>
                  {salaryStructure && (
                    <span className="text-[10px] bg-success/15 border border-success/20 text-success font-semibold uppercase px-2 py-0.5 rounded">
                      Configured
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Base Salary */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
                      Base Salary (Monthly)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        value={baseSalary}
                        onChange={e => setBaseSalary(Number(e.target.value))}
                        className="w-full bg-card border border-border p-2 pl-9 rounded-lg text-sm text-foreground focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Allowances */}
                  <div className="space-y-3 bg-card p-3 rounded-xl border border-border">
                    <h4 className="text-xs font-semibold text-brand-emerald uppercase tracking-wider mb-2">Monthly Allowances</h4>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Housing Allowance ($)</label>
                      <input
                        type="number"
                        value={housing}
                        onChange={e => setHousing(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Transport Credit ($)</label>
                      <input
                        type="number"
                        value={transport}
                        onChange={e => setTransport(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Meal Allowance ($)</label>
                      <input
                        type="number"
                        value={meal}
                        onChange={e => setMeal(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-3 bg-card p-3 rounded-xl border border-border">
                    <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Deductions & Benefits</h4>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Estimated Income Tax (%)</label>
                      <input
                        type="number"
                        value={tax}
                        onChange={e => setTax(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Provident & Retirement Fund (%)</label>
                      <input
                        type="number"
                        value={pf}
                        onChange={e => setPf(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted-foreground">Premium Medical Insurance ($)</label>
                      <input
                        type="number"
                        value={insurance}
                        onChange={e => setInsurance(Number(e.target.value))}
                        className="mt-1 w-full bg-card border border-border p-2 rounded text-xs text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Net Pay Estimator */}
                <div className="bg-card border border-border p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Live Period Net Pay Simulator</span>
                    <span className="text-[10px] text-muted-foreground">Subject to progressive configurations</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Base Salary</span>
                      <span className="text-foreground font-semibold font-mono">${baseSalary.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-brand-emerald block text-[10px]">Total Allowances</span>
                      <span className="text-success font-semibold font-mono">+${(housing + transport + meal).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-rose-500 block text-[10px]">Total Deductions</span>
                      <span className="text-rose-450 font-semibold font-mono">-${(Math.round(baseSalary * (tax / 100)) + Math.round(baseSalary * (pf / 105)) + insurance).toLocaleString()}</span>
                    </div>
                    <div className="border-l border-border pl-4">
                      <span className="text-success block text-[10px] font-bold">Estimated Take-Home</span>
                      <span className="text-success text-sm font-bold font-mono">
                        ${Math.max(0, baseSalary + (housing + transport + meal) - (Math.round(baseSalary * (tax / 100)) + Math.round(baseSalary * (pf / 100)) + insurance)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <button
                    onClick={handleSaveStructure}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2 px-4 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply Salary Configuration
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-md text-muted-foreground">
                <Settings className="w-10 h-10 mb-2 animate-spin text-zinc-700" style={{ animationDuration: '6s' }} />
                Please select an employee on the left directory to configure their salary rules.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENT: Salary Slips Tab */}
      {activeTab === 'slips' && (
        <div className="bg-card border border-border p-5 rounded-xl">
          <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-2">
            <Download className="w-4 h-4 text-muted-foreground" />
            Consolidated Sent Payslips (All Employees)
          </h3>
          
          {salarySlips.length === 0 ? (
            <div className="text-center py-10 text-zinc-650 text-sm">
              No individual payslips dispatched yet. Complete a statement run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5">Employee</th>
                    <th className="py-2.5">Period</th>
                    <th className="py-2.5">Base Salary</th>
                    <th className="py-2.5">Allowances</th>
                    <th className="py-2.5">Deductions</th>
                    <th className="py-2.5">Net Payout</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {salarySlips.map(slip => (
                    <tr key={slip.id} className="hover:bg-card/40">
                      <td className="py-3">
                        <div className="font-medium text-foreground">{slip.employeeName}</div>
                        <div className="text-[10px] text-muted-foreground">{slip.employeeEmail}</div>
                      </td>
                      <td className="py-3 font-semibold">{slip.period}</td>
                      <td className="py-3 text-xs">${slip.baseSalary.toLocaleString()}</td>
                      <td className="py-3 text-xs text-brand-emerald">+${slip.allowances.toLocaleString()}</td>
                      <td className="py-3 text-xs text-rose-500">-${slip.deductions.toLocaleString()}</td>
                      <td className="py-3 text-success font-semibold">${slip.netPay.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${slip.status === 'Paid' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                          {slip.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {slip.status === 'Draft' && (
                          <button
                            onClick={() => handlePaySlip(slip.id!, slip.employeeName)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold py-1 px-2.5 rounded-md transition cursor-pointer"
                          >
                            Disburse Funds
                          </button>
                        )}
                        {slip.status === 'Paid' && (
                          <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-emerald" />
                            Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
