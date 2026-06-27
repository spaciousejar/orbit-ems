import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Users, 
  FolderLock, 
  Building2, 
  FileText, 
  X,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';
import { userService } from '../../services/userService';
import { documentService } from '../../services/documentService';
import { User, EmployeeDocument } from '../../types';

interface GlobalSearchBarProps {
  activeTab: string;
  onNavigateToTab: (tabId: string, searchFilter?: string, deptFilter?: string) => void;
}

interface PolicyMatch {
  id: string;
  title: string;
  category: string;
  excerpt: string;
}

const STATIC_POLICIES: PolicyMatch[] = [
  { id: 'code-of-conduct', title: 'Workplace Code of Conduct', category: 'Ethics', excerpt: 'Standard guidelines on professional integrity, respect, and code of ethics.' },
  { id: 'remote-work', title: 'Hybrid & Remote Work Policy', category: 'Work Environment', excerpt: 'Official guidelines on core office hours, internet subsidies, and VPN usage.' },
  { id: 'benefits-wellness', title: 'Comprehensive Benefits & Perks', category: 'Benefits', excerpt: 'Medical, vision coverage details, mental health sessions, and gym budgets.' },
  { id: 'expense-reimbursement', title: 'Expense & Travel Reimbursement', category: 'Compensation', excerpt: 'Travel limits, allowable meal budgets, and submission deadlines.' },
  { id: 'leave-holidays', title: 'Leave of Absence & Holidays', category: 'Benefits', excerpt: 'Framework for Paid Time Off (PTO), sick leaves, and parental caretaking.' },
  { id: 'performance-targets', title: 'Performance & Professional Growth', category: 'Operations', excerpt: 'Quarterly feedback cycles, continuous learning budgets, and promotion tracks.' }
];

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Legal'];

export function GlobalSearchBar({ activeTab, onNavigateToTab }: GlobalSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load live data
  useEffect(() => {
    const unsubEmployees = userService.subscribeToUsers(setEmployees);
    const unsubDocs = documentService.subscribeToDocuments(null, setDocuments);

    return () => {
      unsubEmployees();
      unsubDocs();
    };
  }, []);

  // Keyboard shortcut (Ctrl+K or Cmd+K / Slash / Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsOpenMobile(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEmployee = (emp: User) => {
    // Navigate to employees list, pre-setting Search Filter to match their full name
    const fullName = `${emp.firstName} ${emp.lastName}`;
    onNavigateToTab('employees-directory', fullName, 'All');
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectDepartment = (dept: string) => {
    // Navigate to employees list, pre-setting Department Filter
    onNavigateToTab('employees-directory', '', dept);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectDocument = (doc: EmployeeDocument) => {
    // Navigate to documents list, pre-setting search filter to match document title
    onNavigateToTab('documents', doc.title);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectPolicy = (policy: PolicyMatch) => {
    // Navigate to local policies tab, passing search query to highlight or auto-open
    onNavigateToTab('policies', policy.title);
    setQuery('');
    setIsOpen(false);
  };

  // Searching logic
  const trimmed = query.trim().toLowerCase();
  
  const matchedEmployees = trimmed ? employees.filter(emp => {
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    return (
      name.includes(trimmed) ||
      (emp.jobTitle || '').toLowerCase().includes(trimmed) ||
      (emp.department || '').toLowerCase().includes(trimmed) ||
      (emp.email || '').toLowerCase().includes(trimmed)
    );
  }).slice(0, 4) : [];

  const matchedDepartments = trimmed ? DEPARTMENTS.filter(dept => 
    dept.toLowerCase().includes(trimmed)
  ) : [];

  const matchedDocuments = trimmed ? documents.filter(doc => 
    doc.title.toLowerCase().includes(trimmed) ||
    doc.category.toLowerCase().includes(trimmed) ||
    (doc.employeeName || '').toLowerCase().includes(trimmed)
  ).slice(0, 3) : [];

  const matchedPolicies = trimmed ? STATIC_POLICIES.filter(policy => 
    policy.title.toLowerCase().includes(trimmed) ||
    policy.excerpt.toLowerCase().includes(trimmed) ||
    policy.category.toLowerCase().includes(trimmed)
  ).slice(0, 3) : [];

  const hasResults = 
    matchedEmployees.length > 0 || 
    matchedDepartments.length > 0 || 
    matchedDocuments.length > 0 || 
    matchedPolicies.length > 0;

  return (
    <div ref={containerRef} className="relative flex items-center mx-2 md:mx-4 z-40">
      {/* Mobile search toggle */}
      {!isOpenMobile && (
        <button
          onClick={() => { setIsOpenMobile(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open search"
        >
          <Search className="w-4 h-4" />
        </button>
      )}

      {/* Search bar - always visible on md+, toggled on mobile */}
      <div className={cn(
        "md:relative md:w-full md:max-w-sm md:flex",
        isOpenMobile
          ? "fixed inset-x-4 top-3 z-50 flex"
          : "hidden md:flex"
      )}>
        {/* Backdrop for mobile */}
        {isOpenMobile && (
          <div 
            className="fixed inset-0 bg-background/80 z-40"
            onClick={() => { setIsOpenMobile(false); setIsOpen(false); setQuery(''); }}
          />
        )}
        
        <div className={cn(
          "relative flex items-center bg-card border border-border rounded-lg p-0.5 transition-all focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/80 w-full",
          isOpenMobile && "z-50"
        )}>
          <Search className="h-4 w-3 ml-3 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            className="w-full bg-transparent border-0 text-xs text-foreground placeholder:text-muted-foreground py-1.5 pl-2 pr-10 focus:outline-none focus:ring-0"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
          {query ? (
            <button 
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3.5 hover:text-foreground text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <div className="absolute right-3 hidden sm:flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border border-zinc-850 select-none text-[9px] font-bold text-muted-foreground tracking-wider">
              <span>⌘</span>
              <span>K</span>
            </div>
          )}
          {isOpenMobile && (
            <button 
              onClick={() => { setIsOpenMobile(false); setIsOpen(false); setQuery(''); }}
              className="md:hidden px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          )}
        </div>

      {/* Results Dropdown */}
      {isOpen && trimmed && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 max-h-[85vh] overflow-y-auto bg-card/90 backdrop-blur-md border border-border shadow-2xl rounded-xl p-3 space-y-4 text-xs">
          {!hasResults ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
              <BadgeAlert className="h-6 w-6 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">No matching items found</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">Try searching for full names, specific departments or core policies.</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-zinc-850/50">
              {/* SECTION: EMPLOYEES */}
              {matchedEmployees.length > 0 && (
                <div className="pt-1 first:pt-0">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <Users className="h-3 w-3 text-primary" />
                    Employees ({matchedEmployees.length})
                  </p>
                  <div className="space-y-1">
                    {matchedEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="w-full text-left p-2 rounded-lg hover:bg-zinc-805 hover:bg-white/5 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-foreground truncate">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{emp.jobTitle} • {emp.department}</p>
                        </div>
                        <span className="text-[10px] text-primary font-semibold group-hover:translate-x-0.5 transition-transform shrink-0 flex items-center gap-0.5">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: DEPARTMENTS */}
              {matchedDepartments.length > 0 && (
                <div className="pt-3">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <Building2 className="h-3 w-3 text-emerald-450" />
                    Departments ({matchedDepartments.length})
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {matchedDepartments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => handleSelectDepartment(dept)}
                        className="text-left p-2 rounded-lg bg-card border border-zinc-850 hover:bg-white/5 transition-all text-foreground font-medium flex items-center justify-between group"
                      >
                        <span className="truncate">{dept}</span>
                        <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Filter
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: POLICIES */}
              {matchedPolicies.length > 0 && (
                <div className="pt-3">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-amber-450" />
                    Company Handbooks & Policies ({matchedPolicies.length})
                  </p>
                  <div className="space-y-1">
                    {matchedPolicies.map((policy) => (
                      <button
                        key={policy.id}
                        onClick={() => handleSelectPolicy(policy)}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-all flex flex-col group"
                      >
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-foreground truncate">{policy.title}</p>
                          <span className="text-[9px] bg-card text-muted-foreground px-1.5 py-0.5 rounded-full select-none shrink-0 font-medium">
                            {policy.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{policy.excerpt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: DOCUMENTS */}
              {matchedDocuments.length > 0 && (
                <div className="pt-3">
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <FolderLock className="h-3 w-3 text-purple-400" />
                    Uploaded Document Safe ({matchedDocuments.length})
                  </p>
                  <div className="space-y-1">
                    {matchedDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSelectDocument(doc)}
                        className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-all flex flex-col group"
                      >
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-foreground truncate">{doc.title}</p>
                          <span className="text-[9px] text-violet-500 font-semibold shrink-0">
                            {doc.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">Owner: {doc.employeeName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Quick Helper hint footer */}
          <div className="border-t border-zinc-850 pt-2.5 flex items-center justify-between text-[9px] font-medium text-muted-foreground select-none px-1">
            <span className="flex items-center gap-1">
              <span>Press <b className="text-muted-foreground">Esc</b> to close</span>
            </span>
            <span>Orbit Intelligent Core Search</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
