import { useState, useEffect } from 'react';
import { expenseService } from '../services/expenseService';
import { userService } from '../services/userService';
import { auditService } from '../services/auditService';
import { User, ExpenseClaim } from '../types';
import { 
  Receipt, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseManager() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseClaim['category']>('Travel');
  const [amount, setAmount] = useState<number>(120);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [receiptURL, setReceiptURL] = useState('');

  // Total sums state
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    userService.getAllUsers().then(e => {
      setEmployees(e);
      if (e.length > 0) setSelectedEmp(e[0]);
    });

    const unsubExpenses = expenseService.subscribeToExpenses(null, (claims) => {
      setExpenses(claims);

      // Compute statistics sum
      const computedStats = claims.reduce((acc, c) => {
        if (c.status === 'Pending') acc.pending += c.amount;
        if (c.status === 'Approved') acc.approved += c.amount;
        if (c.status === 'Rejected') acc.rejected += c.amount;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0 });

      setStats(computedStats);
    });

    return () => unsubExpenses();
  }, []);

  const handleSubmitExpense = async () => {
    if (!selectedEmp || !title.trim()) {
      toast.error('Title and selected employee are required');
      return;
    }

    try {
      await expenseService.submitExpense({
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        title,
        category,
        amount,
        currency,
        description,
        receiptURL: receiptURL.trim() || '',
        status: 'Pending',
        createdAt: new Date().toISOString()
      });

      toast.success('Expense claim forwarded successfully');
      setTitle('');
      setDescription('');
      setReceiptURL('');

      await auditService.logAction(
        'Expense Claimed',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Claim: ${title}, Category: ${category}, Amount: $${amount}`
      );
    } catch {
      toast.error('Failed to submit expense claim');
    }
  };

  const handleApprove = async (claim: ExpenseClaim, approve: boolean) => {
    try {
      const status = approve ? 'Approved' : 'Rejected';
      await expenseService.updateExpenseStatus(claim.id!, status, 'admin-id', 'System Admin');
      toast.success(`Expense claim marked as ${status}`);

      await auditService.logAction(
        approve ? 'Expense Approved' : 'Expense Rejected',
        claim.employeeId,
        claim.employeeName,
        `Consolidated amount: $${claim.amount} for "${claim.title}"`
      );
    } catch {
      toast.error('Failed to update expense status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await expenseService.deleteExpense(id);
      toast.success('Expense claim discarded');
    } catch {
      toast.error('Failed to delete claim');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand-emerald" />
          Expense Reimbursements
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit claim requests, upload purchase invoices, and administer approvals for company business operations.
        </p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/70 border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Awaiting Audits</span>
            <p className="text-2xl font-bold text-warning mt-0.5">${stats.pending.toLocaleString()}</p>
          </div>
          <Receipt className="w-8 h-8 text-warning opacity-20" />
        </div>

        <div className="bg-card/70 border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Approved Payments</span>
            <p className="text-2xl font-bold text-brand-emerald mt-0.5">${stats.approved.toLocaleString()}</p>
          </div>
          <Receipt className="w-8 h-8 text-brand-emerald opacity-20" />
        </div>

        <div className="bg-card/70 border border-border p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Rejected / Denied Claims</span>
            <p className="text-2xl font-bold text-rose-500 mt-0.5">${stats.rejected.toLocaleString()}</p>
          </div>
          <Receipt className="w-8 h-8 text-rose-500 opacity-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Claim Submission Panel */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
          <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-brand-emerald" />
            File Reimbursement Claim
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Filing Team Member</label>
              <select
                value={selectedEmp?.uid || ''}
                onChange={(e) => {
                  const emp = employees.find(emp => emp.uid === e.target.value);
                  if (emp) setSelectedEmp(emp);
                }}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
              >
                {employees.map(emp => (
                  <option key={emp.uid} value={emp.uid}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Expense Title / Item</label>
              <input
                type="text"
                placeholder="e.g. AWS Hosting, Flight to Boston"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  <option>Travel</option>
                  <option>Meals</option>
                  <option>Software</option>
                  <option>Hardware</option>
                  <option>Office Supplies</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Receipt URL (Mockup/Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={receiptURL}
                onChange={e => setReceiptURL(e.target.value)}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Expense Motivation / Details</label>
              <textarea
                placeholder="Purchased essential enterprise licenses to continue product development..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSubmitExpense}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              File Claim Request
            </button>
          </div>
        </div>

        {/* Claims Directory/Log List */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card border border-border p-5 rounded-xl">
            <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-zinc-455" />
              Recent Reimbursement Claims
            </h3>

            {expenses.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-sm">
                No active reimbursement claims found in current historical logs.
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map(claim => (
                  <div 
                    key={claim.id} 
                    className="border border-border bg-zinc-950/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-border"
                  >
                    <div className="space-y-1 max-w-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {claim.category}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${claim.status === 'Approved' ? 'bg-success/10 text-success border-success/20' : claim.status === 'Rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-warning/10 text-warning border-warning/20'}`}>
                          {claim.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-foreground text-sm">{claim.title}</h4>
                      <p className="text-xs text-muted-foreground">{claim.description}</p>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                        <span>Submitted by:</span>
                        <span className="font-bold text-muted-foreground">{claim.employeeName}</span>
                        <span>•</span>
                        <span>{new Date(claim.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-3 justify-between w-full md:w-auto border-t border-border md:border-0 pt-3 md:pt-0">
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">${claim.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground block">{claim.currency}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {claim.receiptURL && (
                          <a 
                            href={claim.receiptURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-850 hover:bg-accent text-muted-foreground p-1.5 rounded transition"
                            title="Open Receipt Statement"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {claim.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(claim, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded transition cursor-pointer"
                              title="Approve Claim"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleApprove(claim, false)}
                              className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded transition cursor-pointer"
                              title="Reject / Formally Deny Claim"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(claim.id!, claim.title)}
                          className="bg-card hover:bg-accent text-zinc-450 p-1.5 rounded transition cursor-pointer"
                          title="Delete Claim Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
