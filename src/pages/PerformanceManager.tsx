import { useState, useEffect } from 'react';
import { performanceService } from '../services/performanceService';
import { userService } from '../services/userService';
import { auditService } from '../services/auditService';
import { User, Goal, PerformanceAppraisal } from '../types';
import { 
  Award, 
  Target, 
  TrendingUp, 
  Plus, 
  CheckCircle, 
  Calendar, 
  Star, 
  FileText,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

export function PerformanceManager() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [appraisals, setAppraisals] = useState<PerformanceAppraisal[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'goals' | 'appraisals'>('goals');

  // New Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('2026-12-31');

  // New Appraisal Form State
  const [appraisalPeriod, setAppraisalPeriod] = useState('2026 Q2');
  const [selfRating, setSelfRating] = useState(3);
  const [managerRating, setManagerRating] = useState(4);
  const [feedbackSelf, setFeedbackSelf] = useState('');
  const [feedbackManager, setFeedbackManager] = useState('');
  const [overallScore, setOverallScore] = useState(4);
  const [pipRequired, setPipRequired] = useState(false);

  useEffect(() => {
    userService.getAllUsers().then(e => {
      setEmployees(e);
      if (e.length > 0) setSelectedEmp(e[0]);
    });
  }, []);

  useEffect(() => {
    if (selectedEmp) {
      const unsubGoals = performanceService.subscribeToGoals(selectedEmp.uid, setGoals);
      const unsubAppraisals = performanceService.subscribeToAppraisals(selectedEmp.uid, setAppraisals);
      return () => {
        unsubGoals();
        unsubAppraisals();
      };
    }
  }, [selectedEmp]);

  const handleAddGoal = async () => {
    if (!selectedEmp || !goalTitle.trim()) return;

    try {
      await performanceService.addGoal({
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        title: goalTitle,
        description: goalDesc,
        targetDate: goalDueDate,
        status: 'In Progress',
        progress: 0,
        createdAt: new Date().toISOString()
      });

      toast.success('Performance goal set successfully');
      setGoalTitle('');
      setGoalDesc('');

      await auditService.logAction(
        'Goal Configured',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Title: ${goalTitle}, Target Date: ${goalDueDate}`
      );
    } catch {
      toast.error('Failed to create performance goal');
    }
  };

  const handleUpdateGoalProgress = async (id: string, progress: number, title: string) => {
    try {
      const status = progress === 100 ? 'Completed' : 'In Progress';
      await performanceService.updateGoalProgress(id, progress, status);
      toast.success('Performance goal status altered');
      
      if (progress === 100) {
        await auditService.logAction(
          'Goal Completed', 
          selectedEmp?.uid, 
          selectedEmp?.name, 
          `Achieved 100% resolution on goal: ${title}`
        );
      }
    } catch {
      toast.error('Failed to alter goal progress');
    }
  };

  const handleCreateAppraisal = async () => {
    if (!selectedEmp) return;

    try {
      await performanceService.saveAppraisal({
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        period: appraisalPeriod,
        selfRating,
        managerRating,
        feedbackSelf,
        feedbackManager,
        overallScore,
        pipRequired,
        status: 'Reviewed',
        updatedAt: new Date().toISOString()
      });

      toast.success('Performance appraisal saved and reviewed successfully');
      setFeedbackSelf('');
      setFeedbackManager('');
      
      await auditService.logAction(
        'Performance Appraised',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Term: ${appraisalPeriod}, Score: ${overallScore}/5. PIP Required: ${pipRequired ? 'Yes' : 'No'}`
      );
    } catch {
      toast.error('Failed to save performance appraisal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Performance & Appraisal Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Establish performance targets, complete self/manager audits, and monitor competency goals.
          </p>
        </div>

        {/* Directory Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Reviewing:</span>
          <select
            value={selectedEmp?.uid || ''}
            onChange={(e) => {
              const emp = employees.find(emp => emp.uid === e.target.value);
              if (emp) setSelectedEmp(emp);
            }}
            className="bg-card border border-border rounded-lg py-1.5 px-3 text-xs text-foreground focus:outline-none"
          >
            {employees.map(emp => (
              <option key={emp.uid} value={emp.uid}>
                {emp.firstName} {emp.lastName} ({emp.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Sub Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveSubTab('goals')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeSubTab === 'goals' ? 'border-warning text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          KRA / OKR Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveSubTab('appraisals')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeSubTab === 'appraisals' ? 'border-warning text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Performance Appraisals ({appraisals.length})
        </button>
      </div>

      {activeSubTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create Goal Panel */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-warning" />
              Define Performance Goal
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Upgrade legacy Express system v5"
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Goal Description</label>
                <textarea
                  placeholder="Encompasses rewriting code, performing schema migrations, ensuring backward security support..."
                  value={goalDesc}
                  onChange={e => setGoalDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Target End Date</label>
                <input
                  type="date"
                  value={goalDueDate}
                  onChange={e => setGoalDueDate(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                />
              </div>

              <button
                onClick={handleAddGoal}
                className="w-full bg-warning hover:bg-warning/90 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign Goal
              </button>
            </div>
          </div>

          {/* Active Goals Log */}
          <div className="md:col-span-2 space-y-4">
            {goals.length === 0 ? (
              <div className="bg-card border border-border p-10 rounded-xl text-center text-muted-foreground text-sm">
                No active targets defined for {selectedEmp?.firstName}. Create a custom target on the left.
              </div>
            ) : (
              goals.map(goal => (
                <div key={goal.id} className="bg-card border border-border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{goal.title}</h4>
                      <p className="text-muted-foreground text-xs mt-1">{goal.description || 'No detailed instructions provided.'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${goal.status === 'Completed' ? 'bg-success/10 text-success border-success/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                      {goal.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-mono">
                        <span>Milestone Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-card h-1.5 rounded-full overflow-hidden">
                        <div className="bg-warning h-full transition-all" style={{ width: `${goal.progress}%` }} />
                      </div>
                    </div>
                    
                    {/* Controls */}
                    {goal.status !== 'Completed' && (
                      <div className="flex items-center gap-1 pt-3">
                        <button
                          onClick={() => handleUpdateGoalProgress(goal.id!, 50, goal.title)}
                          className="bg-card hover:bg-accent text-[10px] text-foreground px-2 py-1 rounded"
                        >
                          50%
                        </button>
                        <button
                          onClick={() => handleUpdateGoalProgress(goal.id!, 100, goal.title)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white px-2 py-1 rounded flex items-center gap-0.5 font-semibold"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-1 border-t border-border">
                    <Calendar className="w-3 h-3" />
                    Target Accomplishment Target: <span className="font-semibold text-zinc-450">{goal.targetDate}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Appraisals view */}
      {activeSubTab === 'appraisals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Submit Appraisal Form */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-warning" />
              Conduct Appraisal Review
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Check Period</label>
                <input
                  type="text"
                  value={appraisalPeriod}
                  onChange={e => setAppraisalPeriod(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Self-Rating (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={selfRating}
                    onChange={e => setSelfRating(Number(e.target.value))}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Manager Scale</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={managerRating}
                    onChange={e => setManagerRating(Number(e.target.value))}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Self Feedback</label>
                <textarea
                  placeholder="Excellent performance, hit all sprint delivery milestones."
                  value={feedbackSelf}
                  onChange={e => setFeedbackSelf(e.target.value)}
                  rows={2}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Manager Core Appraisal</label>
                <textarea
                  placeholder="Consistently outstanding performance, displays robust systems execution capability."
                  value={feedbackManager}
                  onChange={e => setFeedbackManager(e.target.value)}
                  rows={2}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="pip"
                  checked={pipRequired}
                  onChange={e => setPipRequired(e.target.checked)}
                  className="rounded border-border text-warning focus:ring-transparent bg-card w-4 h-4"
                />
                <label htmlFor="pip" className="text-xs text-muted-foreground font-medium cursor-pointer flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Initiate Performance Improvement Plan (PIP)
                </label>
              </div>

              <button
                onClick={handleCreateAppraisal}
                className="w-full bg-warning hover:bg-warning/90 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Commit Comprehensive Review
              </button>
            </div>
          </div>

          {/* Historical Reviews Checklist */}
          <div className="md:col-span-2 space-y-4">
            {appraisals.length === 0 ? (
              <div className="bg-card border border-border p-10 rounded-xl text-center text-muted-foreground text-sm">
                No performance appraisals logged for {selectedEmp?.firstName} yet. Create one above.
              </div>
            ) : (
              appraisals.map(app => (
                <div key={app.id} className="bg-card border border-border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{app.period} Appraisal</h4>
                      <p className="text-[10px] text-muted-foreground">Updated: {new Date(app.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-warning/10 text-warning px-2 py-0.5 rounded text-[11px] font-bold border border-warning/25">
                        Score: {app.overallScore}/5
                      </span>
                      {app.pipRequired && (
                        <span className="bg-destructive/10 text-rose-500 px-2 py-0.5 rounded text-[10px] font-semibold border border-destructive/25">
                          PIP Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Self Review (Rating: {app.selfRating})</label>
                      <p className="text-foreground text-xs bg-zinc-950 p-2.5 rounded-lg border border-border mt-1 italic">
                        "{app.feedbackSelf || 'No comment recorded.'}"
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] text-brand-emerald font-semibold uppercase tracking-wider">HR Manager Verdict (Rating: {app.managerRating})</label>
                      <p className="text-foreground text-xs bg-zinc-950 p-2.5 rounded-lg border border-border mt-1 italic">
                        "{app.feedbackManager || 'No comment recorded.'}"
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
