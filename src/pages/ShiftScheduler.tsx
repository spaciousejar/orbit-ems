import { useState, useEffect } from 'react';
import { shiftService } from '../services/shiftService';
import { userService } from '../services/userService';
import { User, ShiftSchedule, ShiftSwapRequest } from '../types';
import { 
  Calendar, 
  Clock, 
  RefreshCcw, 
  Plus, 
  Check, 
  X, 
  MapPin, 
  UserPlus, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { auditService } from '../services/auditService';
import { toast } from 'sonner';

export function ShiftScheduler() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'swaps'>('roster');

  // Assign Shift Form State
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [shiftDate, setShiftDate] = useState('2026-06-22');
  const [shiftType, setShiftType] = useState<ShiftSchedule['shiftType']>('Morning');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [notes, setNotes] = useState('');

  // Swap Request Form State
  const [swapRequester, setSwapRequester] = useState<User | null>(null);
  const [swapTarget, setSwapTarget] = useState<User | null>(null);
  const [requesterShiftId, setRequesterShiftId] = useState('');
  const [targetShiftId, setTargetShiftId] = useState('');
  const [swapReason, setSwapReason] = useState('');

  useEffect(() => {
    userService.getAllUsers().then(e => {
      setEmployees(e);
      if (e.length > 0) {
        setSelectedEmp(e[0]);
        setSwapRequester(e[0]);
        if (e.length > 1) setSwapTarget(e[1]);
      }
    });

    const unsubShifts = shiftService.subscribeToShifts(null, setShifts);
    const unsubSwaps = shiftService.subscribeToSwaps(null, setSwaps);

    return () => {
      unsubShifts();
      unsubSwaps();
    };
  }, []);

  useEffect(() => {
    if (shiftType === 'Morning') {
      setStartTime('08:00');
      setEndTime('16:00');
    } else if (shiftType === 'Afternoon') {
      setStartTime('16:00');
      setEndTime('00:00');
    } else if (shiftType === 'Night') {
      setStartTime('00:00');
      setEndTime('08:00');
    } else {
      setStartTime('00:00');
      setEndTime('00:00');
    }
  }, [shiftType]);

  const handleAssignShift = async () => {
    if (!selectedEmp) return;

    try {
      await shiftService.assignShift({
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        date: shiftDate,
        shiftType,
        startTime,
        endTime,
        notes,
        createdAt: new Date().toISOString()
      });

      toast.success('Shift Schedule Assigned Successfully');
      setNotes('');

      await auditService.logAction(
        'Shift Assigned',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Type: ${shiftType}, Shift Day: ${shiftDate} (${startTime} to ${endTime})`
      );
    } catch {
      toast.error('Failed to schedule shift');
    }
  };

  const handleCancelShift = async (id: string, name: string, date: string) => {
    try {
      await shiftService.deleteShift(id);
      toast.success('Roster slot cleared');
      await auditService.logAction('Shift Cancelled', undefined, name, `Cancelled roster allocation on ${date}`);
    } catch {
      toast.error('Failed to clear shift');
    }
  };

  const handleRequestSwap = async () => {
    if (!swapRequester || !swapTarget || !requesterShiftId || !targetShiftId) {
      toast.error('All fields and active roster selections are mandatory for swaps');
      return;
    }

    try {
      await shiftService.requestSwap({
        requesterId: swapRequester.uid,
        requesterName: `${swapRequester.firstName} ${swapRequester.lastName}`,
        targetEmployeeId: swapTarget.uid,
        targetEmployeeName: `${swapTarget.firstName} ${swapTarget.lastName}`,
        requesterShiftId,
        targetShiftId,
        status: 'Pending',
        reason: swapReason,
        createdAt: new Date().toISOString()
      });

      toast.success('Shift swap trade request published!');
      setSwapReason('');
      
      await auditService.logAction(
        'Shift Swap Requested',
        swapRequester.uid,
        swapRequester.name || `${swapRequester.firstName} ${swapRequester.lastName}`,
        `Requested roster trading with ${swapTarget.firstName} ${swapTarget.lastName}. Reason: ${swapReason}`
      );
    } catch {
      toast.error('Failed to initiate shift swap request');
    }
  };

  const handleResolveSwap = async (swap: ShiftSwapRequest, approve: boolean) => {
    try {
      if (approve) {
        await shiftService.approveSwap(
          swap.id!,
          swap.requesterShiftId,
          swap.targetShiftId,
          swap.requesterId,
          swap.targetEmployeeId,
          swap.requesterName,
          swap.targetEmployeeName
        );
        toast.success('Shift trade approved and updated on main roster!');
        await auditService.logAction(
          'Shift Swap Approved',
          swap.targetEmployeeId,
          swap.targetEmployeeName,
          `Traded duty with ${swap.requesterName}`
        );
      } else {
        await shiftService.rejectSwap(swap.id!);
        toast.success('Shift trade rejected');
        await auditService.logAction(
          'Shift Swap Rejected',
          swap.targetEmployeeId,
          swap.targetEmployeeName,
          `Denied trade application with ${swap.requesterName}`
        );
      }
    } catch {
      toast.error('Problem completing the trade resolution');
    }
  };

  const getShiftBadge = (type: ShiftSchedule['shiftType']) => {
    switch (type) {
      case 'Morning':
        return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
      case 'Afternoon':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Night':
        return 'bg-purple-400/10 text-purple-400 border border-purple-400/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Shift Scheduling & Rostered Trading
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Coordinate shifts, allocate weekly duty timelines, and approve swapping requests from employees.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeTab === 'roster' ? 'border-indigo-505 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Daily Roster List ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab('swaps')}
          className={`py-2 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${activeTab === 'swaps' ? 'border-indigo-505 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Swap Requests & Trades ({swaps.length})
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Create shift panel */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-500" />
              Assign Duty Shift
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Employee</label>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Duty Day</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={e => setShiftDate(e.target.value)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Shift Type</label>
                  <select
                    value={shiftType}
                    onChange={e => setShiftType(e.target.value as any)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  >
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Night</option>
                    <option>Off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Task Notes / Locations</label>
                <input
                  type="text"
                  placeholder="e.g. Office Floor A, Server Room duties"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAssignShift}
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-foreground font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                Commit Allocation
              </button>
            </div>
          </div>

          {/* Roster list */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border p-5 rounded-xl">
              <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                Core Operations Roster Directory
              </h3>

              {shifts.length === 0 ? (
                <div className="text-center py-10 text-zinc-650 text-sm">
                  No active custom shift assignments scheduled. Assign employee duties above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-muted-foreground">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Employee</th>
                        <th className="py-2.5">Shift Classification</th>
                        <th className="py-2.5">Duty Window</th>
                        <th className="py-2.5">Notes</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850">
                      {shifts.map(shift => (
                        <tr key={shift.id} className="hover:bg-accent">
                          <td className="py-3 font-semibold text-foreground">{shift.date}</td>
                          <td className="py-3 text-xs">{shift.employeeName}</td>
                          <td className="py-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getShiftBadge(shift.shiftType)}`}>
                              {shift.shiftType}
                            </span>
                          </td>
                          <td className="py-3 text-xs">{shift.startTime} – {shift.endTime}</td>
                          <td className="py-3 text-xs italic text-zinc-450">{shift.notes || '—'}</td>
                          <td className="py-3 text-right">
                            {shift.shiftType !== 'Off' && (
                              <button
                                onClick={() => handleCancelShift(shift.id!, shift.employeeName, shift.date)}
                                className="bg-card hover:bg-accent hover:text-rose-500 border border-border px-2 py-1 rounded text-[10px] transition cursor-pointer"
                              >
                                Stop Allocation
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'swaps' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Swap Marketplace Form */}
          <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
            <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
              <RefreshCcw className="w-4 h-4 text-indigo-400" />
              Propose Shift Trade
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1 font-mono">YOUR PROFILE (REQUESTER)</label>
                <select
                  value={swapRequester?.uid || ''}
                  onChange={e => {
                    const emp = employees.find(emp => emp.uid === e.target.value);
                    if (emp) setSwapRequester(emp);
                  }}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.uid} value={emp.uid}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1 font-mono">SELECT RECIPIENT TRADER</label>
                <select
                  value={swapTarget?.uid || ''}
                  onChange={e => {
                    const emp = employees.find(emp => emp.uid === e.target.value);
                    if (emp) setSwapTarget(emp);
                  }}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.uid} value={emp.uid}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">YOUR SHIFT (KINDLY SPECIFY DATE)</label>
                <select
                  value={requesterShiftId}
                  onChange={e => setRequesterShiftId(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  <option value="">-- Choose Roster Date --</option>
                  {shifts
                    .filter(s => s.employeeId === swapRequester?.uid)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.date} ({s.shiftType})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">TARGET SHIFT TO DISPLACE</label>
                <select
                  value={targetShiftId}
                  onChange={e => setTargetShiftId(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  <option value="">-- Choose Target Date --</option>
                  {shifts
                    .filter(s => s.employeeId === swapTarget?.uid)
                    .map(s => (
                      <option key={s.id} value={s.id}>{s.date} ({s.shiftType})</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Swap Proposal Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Flight travel commitments, Doctor appointment"
                  value={swapReason}
                  onChange={e => setSwapReason(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>

              <button
                onClick={handleRequestSwap}
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-foreground font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Publish Proposal
              </button>
            </div>
          </div>

          {/* Active Proposals Log */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-card border border-border p-5 rounded-xl">
              <h3 className="font-semibold text-foreground text-base mb-4 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Active Shift Trading Board
              </h3>

              {swaps.length === 0 ? (
                <div className="text-center py-10 text-zinc-650 text-sm">
                  No trade/swap proposals currently cataloged on the trading board.
                </div>
              ) : (
                <div className="space-y-4">
                  {swaps.map(swap => (
                    <div key={swap.id} className="bg-zinc-950 border border-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition hover:border-border animate-fade-in">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-indigo-500/10 text-indigo-400 font-semibold text-[10px] px-2 py-0.5 rounded border border-indigo-505/20 uppercase tracking-widest">
                            Trade Offer
                          </span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${swap.status === 'Approved' ? 'bg-brand-emerald/15 text-brand-emerald' : swap.status === 'Rejected' ? 'bg-rose-500/15 text-rose-450' : 'bg-amber-500/15 text-amber-500'}`}>
                            {swap.status}
                          </span>
                        </div>
                        <h4 className="text-foreground text-sm font-semibold flex items-center gap-1">
                          {swap.requesterName}
                          <ChevronRight className="w-3 h-3 text-zinc-550" />
                          {swap.targetEmployeeName}
                        </h4>
                        <p className="text-muted-foreground text-xs italic">"Reason: {swap.reason || 'Not specified.'}"</p>
                        <p className="text-[10px] text-muted-foreground font-mono">Posted: {new Date(swap.createdAt).toLocaleDateString()}</p>
                      </div>

                      {swap.status === 'Pending' && (
                        <div className="flex gap-2 w-full md:w-auto border-t border-zinc-900 md:border-0 pt-3 md:pt-0">
                          <button
                            onClick={() => handleResolveSwap(swap, true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-foreground font-medium text-[11px] py-1.5 px-3 rounded flex items-center gap-1 transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Offer Trade
                          </button>
                          <button
                            onClick={() => handleResolveSwap(swap, false)}
                            className="bg-rose-600 hover:bg-rose-500 text-foreground font-medium text-[11px] py-1.5 px-3 rounded flex items-center gap-1 transition cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
