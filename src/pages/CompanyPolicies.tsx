import { useState, useEffect } from 'react';
import { FileText, Search, ShieldCheck, Heart, Plane, Wallet, Award, Laptop, ScrollText } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '@/components/ui/badge';

interface CompanyPoliciesProps {
  initialSearchQuery?: string;
}

export interface Policy {
  id: string;
  title: string;
  category: 'Ethics' | 'Work Environment' | 'Compensation' | 'Benefits' | 'Operations';
  icon: any;
  lastUpdated: string;
  excerpt: string;
  content: string[];
}

const POLICIES: Policy[] = [
  {
    id: 'code-of-conduct',
    title: 'Workplace Code of Conduct',
    category: 'Ethics',
    icon: ShieldCheck,
    lastUpdated: 'Jan 2026',
    excerpt: 'Standard guidelines on professional integrity, respect, inclusion, and compliance.',
    content: [
      'Orbit Inc. holds its workforce to the highest standards of integrity, professional conduct, mutual respect, and ethics.',
      'Equal Opportunity: We explicitly forbid discrimination or harassment based on race, gender, religion, sexual orientation, disability, or age. Respect is our core currency.',
      'Conflicts of Interest: Employees must disclose relationships, secondary employments, or personal financial investments that could compete with or prejudice Orbit decisions.',
      'Responsible Communication: Internal and external communications (directories, forums, social channels) must stay professional and never expose intellectual property.'
    ]
  },
  {
    id: 'remote-work',
    title: 'Hybrid & Remote Work Policy',
    category: 'Work Environment',
    icon: Laptop,
    lastUpdated: 'Mar 2026',
    excerpt: 'Official guidelines on home offices, core collaboration hours, and digital presence.',
    content: [
      'Flexible Core Hours: To maintain harmony, everyone is expected to be reachable and active during core sync windows of 10:00 AM to 3:00 PM EST.',
      'Aero-ergonomic Setup Support: All full-time team members are eligible for a one-time $800 home office equipment subsidy (covering monitors, chairs, standard network upgrades).',
      'Security Measures: Secure remote routers and enterprise-standard VPN services must serve as the network tunnel for all system directories, task files, and customer metadata.'
    ]
  },
  {
    id: 'benefits-wellness',
    title: 'Comprehensive Benefits & Perks',
    category: 'Benefits',
    icon: Heart,
    lastUpdated: 'Feb 2026',
    excerpt: 'Outline of healthcare provisions, mental health budgets, and wellness offerings.',
    content: [
      'Comprehensive Healthcare: Medical, dental, and vision insurance with 100% premium coverage for individual employees and 60% for eligible dependents.',
      'Mental Health Resources: 6 free personal counseling or professional therapy sessions per calendar year via Orbit Well Partner network.',
      'Active Lifestyle Stipend: An elegant $75 monthly wellness reimbursement for membership fees (gyms, yoga centers, climbing clubs, swimming reservoirs).'
    ]
  },
  {
    id: 'expense-reimbursement',
    title: 'Expense & Travel Reimbursement',
    category: 'Compensation',
    icon: Wallet,
    lastUpdated: 'Apr 2026',
    excerpt: 'Standard protocols for traveling, team dinners, and standard expenses.',
    content: [
      'Client Entertainment & Dinners: Pre-approved client dinners or team-building sessions allow up to a comfortable $100 per attendee limit.',
      'Lodging & Flights: All business-related flights must be coach/economy. High-grade business cabins require divisional executive authorization.',
      'Submission Deadlines: Receipts must compile and submit via Expense Vault on or before the 25th of each month for rapid payroll adjustments.'
    ]
  },
  {
    id: 'leave-holidays',
    title: 'Leave of Absence & Holidays',
    category: 'Benefits',
    icon: Plane,
    lastUpdated: 'Dec 2025',
    excerpt: 'Framework for visual holiday periods, personal leave, sick days, and PTO structures.',
    content: [
      'Visual Holiday Time: Generous 20 days of voluntary Paid Time Off (PTO) plus standard national holidays matching our headquarters calendar rules.',
      'Health/Wellness Sabbatical: 5 fully paid days of flexible mental/physical health breaks, requiring zero formal medical certification.',
      'Parental Leave: 12 weeks of fully paid caretaking leave for child-bonding (maternity, paternity, adoptive parent resources).'
    ]
  },
  {
    id: 'performance-targets',
    title: 'Performance & Professional Growth',
    category: 'Operations',
    icon: Award,
    lastUpdated: 'Jan 2026',
    excerpt: 'Framework for target performance feedback, sprint delivery milestones, and tuition assistance.',
    content: [
      'Quarterly Appraisal Cycles: Active performance targets are evaluated contextually, assessing sprint delivery, system design, and soft teamwork attributes.',
      'Continuous Learning: Up to $1,500 annual tuition or digital education allowance for professional courses, master certifications, or books.',
      'Promotions & Progression: Transparent growth paths with reviews taking place twice a year (June reviews and December milestone checks).'
    ]
  }
];

export function CompanyPolicies({ initialSearchQuery }: CompanyPoliciesProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery || '');
  const [activePolicy, setActivePolicy] = useState<string | null>(POLICIES[0].id);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchTerm(initialSearchQuery);
      // Auto-focus the policy that best matches the search term if possible
      const match = POLICIES.find(p => 
        p.title.toLowerCase().includes(initialSearchQuery.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(initialSearchQuery.toLowerCase()) ||
        p.content.some(c => c.toLowerCase().includes(initialSearchQuery.toLowerCase()))
      );
      if (match) {
        setActivePolicy(match.id);
      }
    }
  }, [initialSearchQuery]);

  const filtered = POLICIES.filter(p => {
    const query = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.excerpt.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.content.some(c => c.toLowerCase().includes(query))
    );
  });

  const selectedPolicy = POLICIES.find(p => p.id === activePolicy) || filtered[0] || POLICIES[0];

  const highlightText = (text: string, highlight: string) => {
    if (!highlight || !highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-primary/30 text-blue-250 py-0.5 rounded px-0.5 border border-primary/20">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" />
          Company Policies & Handbooks
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review critical governance, work environment guidelines, benefits packages, and workplace rules.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Drawer / Nav List */}
        <div className="w-full md:w-80 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search handbook, perks, code..."
              className="w-full bg-card border border-border text-sm rounded-lg pl-9 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-card border border-border rounded-lg p-2 space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No matching policies found</p>
            ) : (
              filtered.map((policy) => {
                const Icon = policy.icon;
                const isActive = policy.id === selectedPolicy.id;
                return (
                  <button
                    key={policy.id}
                    onClick={() => setActivePolicy(policy.id)}
                    className={`w-full text-left p-3 rounded-md transition-all flex items-start gap-3 group ${
                      isActive ? 'bg-primary/10 border border-primary/20 text-foreground' : 'hover:bg-accent text-muted-foreground border border-transparent'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      isActive ? 'bg-primary/20 text-primary' : 'bg-card border border-border text-muted-foreground group-hover:text-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-0.5">{policy.category}</p>
                      <h4 className="text-sm font-semibold truncate">{highlightText(policy.title, searchTerm)}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{policy.excerpt}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Policy Detail Viewer */}
        <div className="flex-1 min-w-0">
          {selectedPolicy ? (
            <motion.div
              key={selectedPolicy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden shadow-xl"
            >
              {/* Header Gradient */}
              <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b border-border flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 text-primary rounded-xl border border-primary/20">
                    {(() => {
                      const IconComponent = selectedPolicy.icon;
                      return <IconComponent className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-primary/10 text-primary border-none font-normal">
                        {selectedPolicy.category}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground font-medium">Last updated: {selectedPolicy.lastUpdated}</p>
                    </div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{selectedPolicy.title}</h3>
                  </div>
                </div>
              </div>

              {/* Policy Body */}
              <div className="p-6 md:p-8 space-y-6">
                <p className="text-zinc-350 italic text-sm border-l-2 border-primary/50 pl-4 py-1 leading-relaxed bg-zinc-950/20">
                  "{selectedPolicy.excerpt}"
                </p>

                <div className="space-y-6 pt-2">
                  {selectedPolicy.content.map((clause, idx) => (
                    <div key={idx} className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-lg flex gap-3">
                      <div className="h-6 w-6 shrink-0 bg-card border border-border text-xs font-semibold text-primary flex items-center justify-center rounded-md mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">
                        {highlightText(clause, searchTerm)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-850 pt-6 flex items-center justify-between text-[11px] text-zinc-550">
                  <span>Authorized by HR Operations Department</span>
                  <span>Orbit Secure Verification Block v2.6</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-card border border-border rounded-lg text-muted-foreground">
              <p>No policy selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
