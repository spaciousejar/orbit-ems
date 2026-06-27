import { HolidayInitializer } from './components/shared/HolidayInitializer';
import { lazy, Suspense, useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { auth, signIn } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, User as UserType } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { 
  Building2,
  PanelLeft,
  CalendarDays,
  Loader2,
  LayoutDashboard
} from 'lucide-react';
import { SaaSLandingPage } from './pages/landing/Landingpage';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ErrorBoundary } from './components/layouts/ErrorBoundary';
import { db } from './firebase';
import { userService } from './services/userService';
import { Sidebar } from './components/layouts/Sidebar';
import { Breadcrumbs } from './components/layouts/Breadcrumbs';
import { NotificationBell } from './components/shared/NotificationBell';
import { motion, AnimatePresence } from 'motion/react';

// Lazy load components for better performance and smaller initial bundle
const DashboardOverview = lazy(() => import('./pages/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const UserList = lazy(() => import('./pages/UserList').then(m => ({ default: m.UserList })));
const UserForm = lazy(() => import('./components/forms/UserForm').then(m => ({ default: m.UserForm })));
const AttendanceTracker = lazy(() => import('./pages/AttendanceTracker').then(m => ({ default: m.AttendanceTracker })));
const TimesheetManager = lazy(() => import('./pages/TimesheetManager').then(m => ({ default: m.TimesheetManager })));
const HolidayCalendar = lazy(() => import('./pages/HolidayCalendar').then(m => ({ default: m.HolidayCalendar })));
const LeaveRequestList = lazy(() => import('./pages/LeaveRequestList').then(m => ({ default: m.LeaveRequestList })));
const TaskList = lazy(() => import('./pages/TaskList').then(m => ({ default: m.TaskList })));
const RecruitmentManager = lazy(() => import('./pages/RecruitmentManager').then(m => ({ default: m.RecruitmentManager })));
const OnboardingManager = lazy(() => import('./pages/OnboardingManager').then(m => ({ default: m.OnboardingManager })));
const OffboardingManager = lazy(() => import('./pages/OffboardingManager').then(m => ({ default: m.OffboardingManager })));
const AnalyticsDashboard = lazy(() => import('./pages/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const ReportsDashboard = lazy(() => import('./pages/ReportsDashboard').then(m => ({ default: m.ReportsDashboard })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotificationsDashboard = lazy(() => import('./pages/NotificationsDashboard').then(m => ({ default: m.NotificationsDashboard })));
const GeminiChat = lazy(() => import('./components/shared/GeminiChat').then(m => ({ default: m.GeminiChat })));
const SystemLogs = lazy(() => import('./pages/SystemLogs').then(m => ({ default: m.SystemLogs })));
const PayrollManager = lazy(() => import('./pages/PayrollManager').then(m => ({ default: m.PayrollManager })));
const PerformanceManager = lazy(() => import('./pages/PerformanceManager').then(m => ({ default: m.PerformanceManager })));
const ExpenseManager = lazy(() => import('./pages/ExpenseManager').then(m => ({ default: m.ExpenseManager })));
const ShiftScheduler = lazy(() => import('./pages/ShiftScheduler').then(m => ({ default: m.ShiftScheduler })));
const TrainingManager = lazy(() => import('./pages/TrainingManager').then(m => ({ default: m.TrainingManager })));
const DocumentManager = lazy(() => import('./pages/DocumentManager').then(m => ({ default: m.DocumentManager })));
const CompanyPolicies = lazy(() => import('./pages/CompanyPolicies').then(m => ({ default: m.CompanyPolicies })));
const SeedDatabase = lazy(() => import('./pages/SeedDatabase').then(m => ({ default: m.default })));
import { GlobalSearchBar } from './components/shared/GlobalSearchBar';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full min-h-[400px]">
    <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchDept, setGlobalSearchDept] = useState('All');

  const handleGlobalSearchNavigate = (tabId: string, searchFilter?: string, deptFilter?: string) => {
    setGlobalSearchQuery(searchFilter || '');
    setGlobalSearchDept(deptFilter || 'All');
    setActiveTab(tabId);
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    if (window.location.hash) onHashChange();
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
          setAccessDenied(false);

          let userRecord: UserType | null = null;
          if (u.email) {
            userRecord = await userService.getUserByEmail(u.email);
          }

          if (userRecord) {
            if (userRecord.id !== u.uid) {
              const { id, ...data } = userRecord;
              await userService.createUserProfile(u.uid, { ...data, uid: u.uid });
              await userService.deleteUser(id!);
              userRecord = { id: u.uid, ...data, uid: u.uid };
            } else {
              const updates: Partial<UserType> = {};
              if (u.photoURL && userRecord.photoURL !== u.photoURL) updates.photoURL = u.photoURL;
              if (u.displayName && !userRecord.displayName) updates.displayName = u.displayName;

              if (Object.keys(updates).length > 0) {
                await userService.updateUser(u.uid, updates);
                userRecord = { ...userRecord, ...updates };
              }
            }
          } else {
            const now = new Date().toISOString();
            const nameParts = (u.displayName || u.email || '').split(' ');
            const newUser: Omit<UserType, 'id'> = {
              uid: u.uid,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
              name: u.displayName || u.email || '',
              email: u.email!,
              phone: '',
              jobTitle: '',
              department: '',
              role: 'employee',
              status: 'Active',
              photoURL: u.photoURL || undefined,
              displayName: u.displayName,
              createdAt: now,
              updatedAt: now
            };
            const docRef = await userService.createUserProfile(u.uid, newUser);
            userRecord = { id: docRef?.id || u.uid, ...newUser } as UserType;
          }

          setProfile(userRecord as UserProfile);
        } else {
          setUser(null);
          setProfile(null);
          setAccessDenied(false);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setUser(null);
        setProfile(null);
        setAccessDenied(true);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function testConnection() {
      try {
        const { getDocFromServer, doc } = await import('firebase/firestore');
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-primary/20 rounded-full" />
          <p className="text-sm text-muted-foreground">Loading Orbit HR...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="max-w-md w-full shadow-2xl border-border bg-card">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-destructive/10 p-3 rounded-2xl w-fit mb-2">
              <Building2 className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Access Denied</CardTitle>
            <CardDescription className="text-muted-foreground">
              Your account is not registered in the employee database. Please contact HR to get access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full h-12 text-lg font-medium shadow-lg bg-primary hover:bg-primary/90 transition-all">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <a
          href="#landing-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:rounded-md focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <main id="landing-content">
          <SaaSLandingPage
            onSignIn={signIn}
            isLoggedIn={false}
            onGoToDashboard={() => {}}
          />
        </main>
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'dashboard-overview':
        return (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {profile && <DashboardOverview profile={profile} />}
          </motion.div>
        );
      case 'dashboard-analytics':
        return (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AnalyticsDashboard />
          </motion.div>
        );
      case 'dashboard-reports':
        return (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ReportsDashboard />
          </motion.div>
        );
      case 'dashboard-system logs':
      case 'dashboard-system-logs':
        return (
          <motion.div
            key="system-logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SystemLogs />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <Settings profile={profile} />}
          </motion.div>
        );
      case 'payroll':
        return (
          <motion.div
            key="payroll"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PayrollManager />
          </motion.div>
        );
      case 'performance':
        return (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PerformanceManager />
          </motion.div>
        );
      case 'expenses':
        return (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ExpenseManager />
          </motion.div>
        );
      case 'shifts':
        return (
          <motion.div
            key="shifts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ShiftScheduler />
          </motion.div>
        );
      case 'training':
        return (
          <motion.div
            key="training"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TrainingManager />
          </motion.div>
        );
      case 'documents':
        return (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DocumentManager 
              initialSearchQuery={globalSearchQuery} 
              onClearFilters={() => setGlobalSearchQuery('')} 
            />
          </motion.div>
        );
      case 'employees':
      case 'employees-directory':
        return (
          <motion.div
            key="employees"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Team Directory</h2>
              {(profile?.role === 'admin' || profile?.role === 'hr_manager') && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="bg-primary hover:bg-primary/90">
                    Add Team Member
                  </Button>
                  <DialogContent className="bg-card border-border text-foreground">
                    <DialogHeader>
                      <DialogTitle>Add New Team Member</DialogTitle>
                      <DialogDescription className="sr-only">Fill out the form to add a new team member.</DialogDescription>
                    </DialogHeader>
                    <UserForm 
                      onSuccess={() => setIsAddDialogOpen(false)} 
                      onCancel={() => setIsAddDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <UserList 
              userRole={profile?.role || 'employee'} 
              initialSearchQuery={globalSearchQuery}
              initialDepartment={globalSearchDept}
              onClearFilters={() => {
                setGlobalSearchQuery('');
                setGlobalSearchDept('All');
              }}
            />
          </motion.div>
        );
      case 'employees-onboarding':
        return (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <OnboardingManager />
          </motion.div>
        );
      case 'employees-offboarding':
        return (
          <motion.div
            key="offboarding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <OffboardingManager />
          </motion.div>
        );
      case 'attendance-tracking':
      case 'attendance':
        return (
          <motion.div
            key="attendance-tracking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <AttendanceTracker profile={profile} />}
          </motion.div>
        );
      case 'attendance-timesheets':
        return (
          <motion.div
            key="attendance-timesheets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <TimesheetManager profile={profile} />}
          </motion.div>
        );
      case 'attendance-holidays':
        return (
          <motion.div
            key="holidays"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <HolidayCalendar profile={profile} />}
          </motion.div>
        );
      case 'attendance-leave requests':
        return (
          <motion.div
            key="leave-requests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <LeaveRequestList profile={profile} />}
          </motion.div>
        );
      case 'tasks':
        return (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <TaskList profile={profile} />}
          </motion.div>
        );
      case 'recruitment':
        return (
          <motion.div
            key="recruitment"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <RecruitmentManager />
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {profile && <NotificationsDashboard profile={profile} />}
          </motion.div>
        );
      case 'policies':
        return (
          <motion.div
            key="policies"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <CompanyPolicies initialSearchQuery={globalSearchQuery} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
              <Building2 className="w-8 h-8 opacity-20" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Section Under Development</h3>
            <p className="text-sm max-w-xs text-center">
              We're currently building out the {activeTab.replace('-', ' ')} section. Check back soon!
            </p>
          </motion.div>
        );
    }
  };

  if (activeTab === 'seed-database') {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen overflow-y-auto bg-background">
          <Suspense fallback={<LoadingFallback />}>
            <SeedDatabase />
          </Suspense>
          <div className="fixed bottom-6 right-6 z-50">
            <Button 
              onClick={() => setActiveTab('dashboard')} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xl h-11 px-5 rounded-full flex items-center gap-2 border border-primary/30 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Workspace</span>
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (activeTab === 'landing' && user) {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen overflow-y-auto bg-background">
          <SaaSLandingPage 
            onSignIn={() => {}} 
            isLoggedIn={true} 
            onGoToDashboard={() => setActiveTab('dashboard')} 
          />
          <div className="fixed bottom-6 right-6 z-50">
            <Button 
              onClick={() => setActiveTab('dashboard')} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-2xl h-11 px-5 rounded-full flex items-center gap-2 border border-primary/30 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Workspace</span>
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background text-muted-foreground overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

          {/* Skip to content link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:rounded-md focus:text-sm focus:font-medium"
          >
            Skip to main content
          </a>

          {/* Sidebar */}
          <div className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar 
            profile={profile} 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
              <div className="hidden md:block h-4 w-[1px] bg-border mx-2" />
              <div className="hidden md:block">
                <Breadcrumbs activeTab={activeTab} />
              </div>
            </div>

            <GlobalSearchBar 
              activeTab={activeTab} 
              onNavigateToTab={handleGlobalSearchNavigate} 
            />

            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              {profile && <NotificationBell profile={profile} onTabChange={setActiveTab} />}
              <div className="hidden sm:flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden md:inline">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="md:hidden">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main id="main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatePresence mode="wait">
                  {renderContent()}
                </AnimatePresence>
              </Suspense>
            </div>
          </main>
        </div>
        <Toaster position="top-right" theme="dark" />
        <HolidayInitializer />
        <Suspense fallback={null}>
          {profile && <GeminiChat userRole={profile.role} />}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
