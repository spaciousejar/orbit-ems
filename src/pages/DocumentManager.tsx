import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { userService } from '../services/userService';
import { auditService } from '../services/auditService';
import { User, EmployeeDocument } from '../types';
import { 
  FolderLock, 
  Plus, 
  Trash2, 
  ExternalLink, 
  AlertTriangle, 
  CalendarClock, 
  Search, 
  FileText,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentManagerProps {
  initialSearchQuery?: string;
  onClearFilters?: () => void;
}

export function DocumentManager({ initialSearchQuery, onClearFilters }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);

  // Form states
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EmployeeDocument['category']>('Offer Letter');
  const [fileURL, setFileURL] = useState('');
  const [fileName, setFileName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Search filter
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery || '');

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Expiring statistics
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  useEffect(() => {
    userService.getAllUsers().then(e => {
      setEmployees(e);
      if (e.length > 0) setSelectedEmp(e[0]);
    });

    const unsubDocs = documentService.subscribeToDocuments(null, (docList) => {
      setDocuments(docList);

      // Check for expiring documents (expiry within 30 days)
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const computedSoon = docList.filter(d => {
        if (!d.expiryDate) return false;
        const exp = new Date(d.expiryDate);
        return exp > now && exp <= thirtyDaysFromNow;
      }).length;

      setExpiringSoonCount(computedSoon);
    });

    return () => unsubDocs();
  }, []);

  const handleUploadDocument = async () => {
    if (!selectedEmp || !title.trim() || !fileName.trim()) {
      toast.error('Title, file name, and employee are mandatory fields');
      return;
    }

    try {
      const url = fileURL.trim() || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80';
      
      await documentService.uploadDocument({
        employeeId: selectedEmp.uid,
        employeeName: `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        title,
        category,
        fileURL: url,
        fileName,
        expiryDate: expiryDate || undefined,
        status: 'Active',
        uploadedBy: 'HR Admin',
        createdAt: new Date().toISOString()
      });

      toast.success('Document metadata uploaded securely to repository');
      setTitle('');
      setFileName('');
      setFileURL('');
      setExpiryDate('');

      await auditService.logAction(
        'Document Vault Uploaded',
        selectedEmp.uid,
        `${selectedEmp.firstName} ${selectedEmp.lastName}`,
        `Document Title: ${title}, Type: ${category}, File: ${fileName}`
      );
    } catch {
      toast.error('Failed to commit document secure record entry');
    }
  };

  const handleDelete = async (id: string, docTitle: string) => {
    try {
      await documentService.deleteDocument(id);
      toast.success('Document deleted successfully');
      await auditService.logAction('Document Deleted', undefined, docTitle, 'Removed from electronic safe');
    } catch {
      toast.error('Failed to delete document from archive');
    }
  };

  const isDocExpiringSoon = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const now = new Date();
    const expiry = new Date(expiryStr);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    return expiry > now && expiry <= thirtyDaysFromNow;
  };

  const isDocExpired = (expiryStr?: string) => {
    if (!expiryStr) return false;
    const now = new Date();
    const expiry = new Date(expiryStr);
    return expiry < now;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-brand-emerald" />
            Centralized Document Repository & Expirations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Store essential user agreements, contract templates, and track passport or visa expiration warnings.
          </p>
        </div>

        {expiringSoonCount > 0 && (
          <div className="bg-destructive/10 border border-rose-500/20 text-rose-450 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            {expiringSoonCount} Document(s) Expiring Soon!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload column */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 h-fit">
          <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-brand-emerald" />
            Register Document
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Target Team Member</label>
              <select
                value={selectedEmp?.uid || ''}
                onChange={e => {
                  const emp = employees.find(emp => emp.uid === e.target.value);
                  if (emp) setSelectedEmp(emp);
                }}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
              >
                {employees.map(emp => (
                  <option key={emp.uid} value={emp.uid}>{emp.firstName} {emp.lastName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Employment Contract, US Visa H1B"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Classification Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
                >
                  <option>Offer Letter</option>
                  <option>Contract</option>
                  <option>ID Proof</option>
                  <option>Certificate</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">File Name</label>
                <input
                  type="text"
                  placeholder="contract2026.pdf"
                  value={fileName}
                  onChange={e => setFileName(e.target.value)}
                  className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Secure Download Link (Optional Mockup)</label>
              <input
                type="text"
                placeholder="https://..."
                value={fileURL}
                onChange={e => setFileURL(e.target.value)}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Expiration / Renewal Target (If any)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-card border border-border p-2 rounded text-xs text-foreground focus:outline-none"
              />
            </div>

            <button
              onClick={handleUploadDocument}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FolderLock className="w-3.5 h-3.5" />
              Store Doc Securely
            </button>
          </div>
        </div>

        {/* List column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="font-semibold text-foreground text-base flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-emerald" />
                Electronic Document Cabinet Secure Index
              </h3>
              
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter by title..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:w-48 bg-card border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-zinc-650 focus:outline-none"
                />
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-10 text-zinc-650 text-sm">
                Safe is empty. Setup and register employee document metadata on the left form.
              </div>
            ) : (
              <div className="space-y-3">
                {documents
                  .filter(doc => doc.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(docInfo => {
                    const expiringSoon = isDocExpiringSoon(docInfo.expiryDate);
                    const expired = isDocExpired(docInfo.expiryDate);
                    
                    return (
                      <div 
                        key={docInfo.id} 
                        className={`bg-zinc-950 border p-4 rounded-xl flex items-center justify-between gap-4 transition hover:border-border ${expiringSoon ? 'border-amber-500/30 bg-amber-500/[0.02]' : expired ? 'border-rose-500/30 bg-rose-500/[0.02]' : 'border-zinc-850'}`}
                      >
                        <div className="space-y-1.5 max-w-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-success/10 text-success border border-emerald-500/20 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wide">
                              {docInfo.category}
                            </span>
                            
                            {expiringSoon && (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-semibold px-1 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                RENEWAL DUE SOON
                              </span>
                            )}
                            {expired && (
                              <span className="bg-destructive/10 text-rose-450 border border-rose-500/20 text-[9px] font-semibold px-1 py-0.5 rounded flex items-center gap-0.5">
                                <ShieldAlert className="w-3 h-3" />
                                EXPIRED
                              </span>
                            )}
                          </div>

                          <h4 className="font-semibold text-foreground text-sm">{docInfo.title}</h4>
                          <p className="text-[10px] font-mono text-zinc-550 leading-none">
                            File: {docInfo.fileName} • Safe-ID: {docInfo.id}
                          </p>

                          <div className="text-[10px] leading-none pt-1">
                            Assigned Owner: <span className="font-bold text-foreground">{docInfo.employeeName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {docInfo.expiryDate && (
                            <div className="text-right mr-2 hidden sm:block">
                              <span className="text-[10px] text-zinc-550 flex items-center justify-end gap-1">
                                <CalendarClock className="w-3 h-3" /> Term Expiry:
                              </span>
                              <span className={`text-[11px] font-semibold ${expired ? 'text-rose-450' : expiringSoon ? 'text-amber-450' : 'text-foreground'}`}>
                                {docInfo.expiryDate}
                              </span>
                            </div>
                          )}

                          <a 
                            href={docInfo.fileURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-zinc-850 hover:bg-accent text-foreground p-1.5 rounded transition"
                            title="Download secure copy"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDelete(docInfo.id!, docInfo.title)}
                            className="bg-card border border-border hover:text-rose-500 text-muted-foreground p-1.5 rounded transition cursor-pointer"
                            title="Purge Document metadata"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
