import { useState, useEffect } from 'react';
import { auditService, AuditLog } from '../services/auditService';
import { 
  ShieldAlert, 
  Search, 
  UserCheck, 
  UserCog, 
  FileCheck, 
  FileX, 
  Calendar, 
  Activity, 
  Download,
  Database,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function SystemLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    employeeAdded: 0,
    roleChanged: 0,
    leaveApproved: 0,
    leaveRejected: 0
  });

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auditService.subscribeToLogs((allLogs) => {
      setLogs(allLogs);
      setLoading(false);

      // Compute statistics
      const computedStats = allLogs.reduce((acc, log) => {
        acc.total += 1;
        if (log.action === 'User Added') acc.employeeAdded += 1;
        if (log.action === 'Role Changed') acc.roleChanged += 1;
        if (log.action === 'Leave Request Approved') acc.leaveApproved += 1;
        if (log.action === 'Leave Request Rejected') acc.leaveRejected += 1;
        return acc;
      }, {
        total: 0,
        employeeAdded: 0,
        roleChanged: 0,
        leaveApproved: 0,
        leaveRejected: 0
      });
      setStats(computedStats);
    });

    return () => unsubscribe();
  }, []);

  // Filter actions options
  const actionOptions = [
    'All',
    'User Added',
    'Leave Request Approved',
    'Leave Request Rejected',
    'Role Changed'
  ];

  // Filtering logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetName && log.targetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'All' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'User Added':
        return <UserCheck className="w-4 h-4 text-brand-emerald" />;
      case 'Role Changed':
        return <UserCog className="w-4 h-4 text-amber-500" />;
      case 'Leave Request Approved':
        return <FileCheck className="w-4 h-4 text-primary" />;
      case 'Leave Request Rejected':
        return <FileX className="w-4 h-4 text-rose-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'User Added':
        return 'bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20';
      case 'Role Changed':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Leave Request Approved':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'Leave Request Rejected':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  const exportLogsAsCSV = () => {
    try {
      const headers = ['Timestamp', 'Action', 'Performed By', 'Target User', 'Details'];
      const rows = filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.performedBy,
        log.targetName || 'N/A',
        log.details || 'N/A'
      ]);

      const csvContent = 
        'data:text/csv;charset=utf-8,' + 
        [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Title and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            System Audit Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time tracking of administrators and critical operations
          </p>
        </div>
        <button
          onClick={exportLogsAsCSV}
          disabled={filteredLogs.length === 0}
          className="bg-card hover:bg-accent disabled:opacity-50 text-foreground font-medium text-xs py-2 px-4 rounded-lg flex items-center gap-2 border border-border transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV ({filteredLogs.length})
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Total Recorded</span>
            <Database className="w-4 h-4 opacity-50" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Emp Added</span>
            <UserCheck className="w-4 h-4 text-brand-emerald opacity-50" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{stats.employeeAdded}</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Roles Changed</span>
            <UserCog className="w-4 h-4 text-amber-500 opacity-50" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{stats.roleChanged}</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Leave Approved</span>
            <FileCheck className="w-4 h-4 text-primary opacity-50" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{stats.leaveApproved}</p>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border col-span-2 md:col-span-1">
          <div className="flex justify-between items-center text-muted-foreground mb-1">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Leave Rejected</span>
            <FileX className="w-4 h-4 text-rose-500 opacity-50" />
          </div>
          <p className="text-2xl font-semibold text-foreground">{stats.leaveRejected}</p>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-card p-4 rounded-xl border border-border flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by action, administrator, recipient, or detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-zinc-650 focus:outline-none focus:border-border font-sans"
          />
        </div>

        {/* Action filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-card border border-border rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-border font-sans"
          >
            {actionOptions.map(option => (
              <option key={option} value={option}>
                {option === 'All' ? 'All Activities' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table Interface */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-zinc-400 border-r-transparent border-b-zinc-800 border-l-transparent animate-spin" />
            <p className="text-sm">Fetching real-time audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
            <div className="p-3 bg-card rounded-full border border-border text-muted-foreground">
              <Database className="w-6 h-6" />
            </div>
            <p className="font-semibold text-muted-foreground text-sm">No Audit Logs Found</p>
            <p className="text-xs text-zinc-650 max-w-sm text-center">
              {searchTerm || actionFilter !== 'All' 
                ? 'Try adjusting your search terms or filters' 
                : 'No operations have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-muted-foreground">
              <thead>
                <tr className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 w-[160px]">Timestamp</th>
                  <th className="py-3 px-4 w-[180px]">Action</th>
                  <th className="py-3 px-4 w-[150px]">Performed By</th>
                  <th className="py-3 px-4 w-[150px]">Target Name</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredLogs.map((log) => {
                  const stamp = formatTimestamp(log.timestamp);
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-accent transition-colors group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 vertical-top">
                        <div className="flex flex-col text-xs font-mono text-muted-foreground whitespace-nowrap">
                          <span className="text-muted-foreground">{stamp.date}</span>
                          <span>{stamp.time}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 vertical-top">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-semibold tracking-wide uppercase",
                          getActionBadgeClass(log.action)
                        )}>
                          {getActionIcon(log.action)}
                          {log.action}
                        </span>
                      </td>

                      {/* Performed By */}
                      <td className="py-3.5 px-4 vertical-top">
                        <div className="font-medium text-foreground truncate max-w-[140px]" title={log.performedBy}>
                          {log.performedBy}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]" title={log.performedById}>
                          ID: {log.performedById}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-4 vertical-top">
                        {log.targetName ? (
                          <div className="font-medium text-foreground truncate max-w-[140px]" title={log.targetName}>
                            {log.targetName}
                          </div>
                        ) : (
                          <span className="text-zinc-650">—</span>
                        )}
                        {log.targetId && (
                          <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]" title={log.targetId}>
                            ID: {log.targetId}
                          </div>
                        )}
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 vertical-top text-muted-foreground text-xs">
                        <div className="line-clamp-2 hover:line-clamp-none transition-all pr-2 max-w-lg leading-relaxed">
                          {log.details || 'No additional information recorded.'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
