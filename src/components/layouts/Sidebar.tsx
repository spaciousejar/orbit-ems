import { cn, getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Briefcase, 
  Wallet, 
  Settings, 
  FileText, 
  Star,
  ChevronDown,
  Globe,
  User,
  CheckSquare,
  Bell,
  Award,
  DollarSign,
  Calendar,
  GraduationCap,
  FolderLock
} from "lucide-react";
import { useState } from "react";
import { UserProfile } from "../../types";
import { logout } from "../../firebase";

interface SidebarProps {
  profile: UserProfile | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ profile, activeTab, onTabChange }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["Dashboard", "Team", "Attendance"]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const canManage = profile?.role === 'admin' || profile?.role === 'hr_manager';
  const isTeamLead = profile?.role === 'team_lead';

  const menuItems = [
    {
      title: "Platform",
      items: [
        { 
          name: "Dashboard", 
          icon: LayoutDashboard, 
          subItems: profile?.role === 'admin' 
            ? ["Overview", "Analytics", "Reports", "System Logs"] 
            : ["Overview", "Analytics", "Reports"],
          id: "dashboard"
        },
        { 
          name: "Team", 
          icon: Users, 
          subItems: ["Directory", "Onboarding", "Offboarding"],
          id: "employees"
        },
        { 
          name: "Attendance", 
          icon: Clock, 
          subItems: ["Tracking", "Timesheets", "Leave Requests", "Holidays"],
          id: "attendance"
        },
        { name: "Tasks", icon: CheckSquare, id: "tasks" },
        { name: "Notifications", icon: Bell, id: "notifications" },
        ...(canManage ? [
          { name: "Recruitment", icon: Briefcase, id: "recruitment" },
        ] : []),
        { name: "Settings", icon: Settings, id: "settings" },
      ]
    },
    {
      title: "Core Operations",
      items: [
        { name: "Payroll & Compensation", icon: Wallet, id: "payroll" },
        { name: "Performance Targets", icon: Award, id: "performance" },
        { name: "Expense Reimbursement", icon: DollarSign, id: "expenses" },
        { name: "Shift Schedules", icon: Calendar, id: "shifts" },
        { name: "Training Courses", icon: GraduationCap, id: "training" },
        { name: "Document Safe", icon: FolderLock, id: "documents" },
      ]
    },
    {
      title: "Public View",
      items: [
        { name: "SaaS Landing", icon: Star, id: "landing" },
      ]
    },
    {
      title: "Docs",
      items: [
        { name: "Company Policies", icon: FileText, id: "policies" },
      ]
    }
  ];

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-sm leading-tight">Orbit Inc</h1>
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">Headquarters</p>
        </div>
        <div className="ml-auto">
          <ChevronDown className="w-4 h-4 text-sidebar-foreground/40" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-4">
        {menuItems.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-2">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = activeTab.startsWith(item.id);
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => {
                        if (item.subItems) {
                          toggleSection(item.name);
                        }
                        onTabChange(item.id);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm group focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                        isActive ? "text-sidebar-foreground bg-sidebar-accent" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground")} />
                      <span className="flex-1 text-left font-medium">{item.name}</span>
                      {item.subItems && (
                        <ChevronDown className={cn(
                          "w-3 h-3 transition-transform",
                          expandedSections.includes(item.name) ? "" : "-rotate-90"
                        )} />
                      )}
                    </button>
                    
                    {item.subItems && expandedSections.includes(item.name) && (
                      <div className="ml-9 space-y-1">
                        {item.subItems.map((subItem) => {
                          const subId = `${item.id}-${subItem.toLowerCase()}`;
                          const isSubActive = activeTab === subId || (subItem === "Overview" && activeTab === item.id);
                          return (
                            <button
                              key={subItem}
                              onClick={() => onTabChange(subId)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                                isSubActive ? "text-sidebar-foreground font-medium" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                              )}
                            >
                              {subItem}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-sidebar-accent/50 transition-colors group text-left"
        >
          <div className="w-10 h-10 bg-sidebar-accent rounded-full flex items-center justify-center text-sidebar-foreground/60 border border-sidebar-border overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold">
                {getInitials(profile?.displayName || profile?.name || "") || <User className="w-5 h-5" />}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.displayName || "User"}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest font-bold mt-0.5">
              {profile?.role?.replace('_', ' ') || "Team Member"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60" />
        </button>
      </div>
    </div>
  );
}
