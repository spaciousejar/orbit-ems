import { Component, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Clock,
  FileText,
  BarChart3,
  Shield,
  Star,
  Briefcase,
  Compass,
  AlertTriangle,
  Sparkles,
  Users2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Marquee } from '@/components/ui/marquee';
import { BlurFade } from '@/components/ui/blur-fade';
import { Badge } from '@/components/ui/badge';
import Navbar from './sections/NavbarSection';
import HeroSection from './sections/HeroSection';
import LogosSection from './sections/LogosSection';
import StatsSection from './sections/StatsSection';
import ItemsSection from './sections/ItemsSection';
import PricingSection from './sections/PricingSection';
import FAQSection from './sections/FaqSection';
import CTASection from './sections/CtaSection';
import FooterSection from './sections/FooterSection';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SaaSLandingPageProps {
  onSignIn: () => void;
  isLoggedIn: boolean;
  onGoToDashboard: () => void;
}

const analyticsData = {
  Engineering: [
    { name: 'Jan', value: 88 },
    { name: 'Feb', value: 92 },
    { name: 'Mar', value: 95 },
    { name: 'Apr', value: 94 },
    { name: 'May', value: 98 },
    { name: 'Jun', value: 99 },
  ],
  Sales: [
    { name: 'Jan', value: 75 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 85 },
    { name: 'Apr', value: 82 },
    { name: 'May', value: 89 },
    { name: 'Jun', value: 94 },
  ],
  Marketing: [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 70 },
    { name: 'Mar', value: 72 },
    { name: 'Apr', value: 78 },
    { name: 'May', value: 85 },
    { name: 'Jun', value: 88 },
  ],
};

const testimonials = [
  { quote: "Orbit completely changed our corporate HR setup. We migrated over 110 employees' documents and leave plans in a single afternoon. The AI HR Assistant saves us easily 12 hours of administrative drafting every month!", name: "Miranda Lopez", role: "VP of People, Apex Labs", initials: "ML", color: "#3b82f6" },
  { quote: "The real-time geofenced attendance tracking widget has eliminated timezone fatigue for our hybrid teams. Employees love the simple check-in click actions and custom holiday calendars!", name: "Jason Knowles", role: "Director of Engineering, SyncTech", initials: "JK", color: "#14b8a6" },
  { quote: "Having recruitment lists, applicant status channels, onboarding credentials checking, and compliance exports unified inside are absolute life-savers. Outstanding UX layout and typography!", name: "Eliza Roberts", role: "COO, Novation Global", initials: "ER", color: "#10b981" },
  { quote: "The compliance reporting alone saves our audit team a full work week every quarter. Exporting PDF summaries with one click is a game changer.", name: "David Chen", role: "Compliance Lead, FinCore Group", initials: "DC", color: "#a855f7" },
  { quote: "Our onboarding time dropped from 3 days to 4 hours. New hires love the unified checklist and automated tech provisioning.", name: "Sarah Mitchell", role: "HR Director, CloudBase Inc.", initials: "SM", color: "#ec4899" },
  { quote: "The applicant pipeline gives us real-time visibility into hiring stages. We closed our last engineering hire in 5 days flat.", name: "Marcus Williams", role: "Talent Acquisition Lead, DataStream", initials: "MW", color: "#f59e0b" },
];

const features = [
  {
    title: "AI HR Copilot",
    description: "Summarize timesheets, compile leave policies, and draft onboarding emails using native Gemini AI.",
    icon: <Sparkles className="size-5 stroke-1" />,
  },
  {
    title: "Geofenced Shift Checks",
    description: "Clock in and out with geolocation-tagged logging. View hours and schedule time off.",
    icon: <Clock className="size-5 stroke-1" />,
  },
  {
    title: "Interactive Timesheets",
    description: "Draft daily logs, submit weekly sheets, and track manager approval statuses in real time.",
    icon: <FileText className="size-5 stroke-1" />,
  },
  {
    title: "Applicant Pipeline",
    description: "Post listings and manage candidates across Applied, Interviewing, and Hired stages.",
    icon: <Briefcase className="size-5 stroke-1" />,
  },
  {
    title: "Onboarding Checklists",
    description: "Coordinate training tasks, verify tech setups, sign paperwork, and track progress step by step.",
    icon: <Users2 className="size-5 stroke-1" />,
  },
  {
    title: "Compliance Reports",
    description: "Generate compliance spreadsheets, attrition stats, leave charts, and export PDF summaries.",
    icon: <BarChart3 className="size-5 stroke-1" />,
  },
  {
    title: "Global Holiday Rules",
    description: "Track regional shifts, holiday calendars, and custom standard working hour rules for departments.",
    icon: <Compass className="size-5 stroke-1" />,
  },
  {
    title: "Role-Based Access",
    description: "Granular permissions for admins, managers, and employees across all modules and data.",
    icon: <Shield className="size-5 stroke-1" />,
  },
];

const faqItems = [
  {
    question: "What is Orbit HR, and how is it different?",
    answer: (
      <p className="text-muted-foreground max-w-[640px] text-balance">
        Orbit HR is an all-in-one Enterprise Employee Operating System (EMS) designed for contemporary companies. Unlike old, fragmented legacy tools, Orbit bundles lightning-fast onboarding, real-time geofenced attendance tracking, customizable timesheets, active recruitment, and a built-in server-side AI HR Copilot directly in one seamless layout.
      </p>
    ),
  },
  {
    question: "How does the AI HR Copilot integration work?",
    answer: (
      <p className="text-muted-foreground max-w-[640px] text-balance">
        The AI HR Copilot utilizes native server-side Gemini models to securely understand, draft, and answer intricate workspace questions based on company policies, holiday calendars, timesheet aggregates, and task boards. Your data is strictly sandboxed and never used for public training.
      </p>
    ),
  },
  {
    question: "Is there any setup fee or long-term contract?",
    answer: (
      <p className="text-muted-foreground max-w-[640px] text-balance">
        Absolutely not. Orbit operates on flat month-to-month subscription plans that cancel anytime. Choosing annual billing offers a 20% discount. We also provide free hands-on onboarding migration assistance for teams larger than 50 employees.
      </p>
    ),
  },
  {
    question: "Can we track regional shift preferences and holiday rules?",
    answer: (
      <p className="text-muted-foreground max-w-[640px] text-balance">
        Yes. Orbit contains an integrated global holiday initializer with separate compliance support, customizable standard working hour rules for individual departments, and personal timezone tracking.
      </p>
    ),
  },
];

const heroMockup = (
  <div className="flex w-full flex-col">
    {/* Browser chrome */}
    <div className="flex items-center gap-1.5 pb-2 sm:pb-3 border-b border-border/60 p-3">
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400/70" />
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400/70" />
      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
      <span className="ml-1.5 sm:ml-2 text-[8px] sm:text-[10px] text-muted-foreground font-mono tracking-tight truncate">https://orbit-ems.app/Dashboard</span>
    </div>
    <div> <img src="/newdash.png" alt="dashboard image" loading='lazy' className="w-full h-auto max-w-full"/></div>
  </div>
);

export function SaaSLandingPage({ onSignIn, isLoggedIn, onGoToDashboard }: SaaSLandingPageProps) {


  const dashboardCta = isLoggedIn ? { text: "Dashboard", variant: "default" as const, onClick: onGoToDashboard, iconRight: <ArrowRight className="size-4" /> } : undefined;

  const heroButtons = isLoggedIn
    ? [
        {
          text: "Dashboard",
          variant: "default" as const,
          onClick: onGoToDashboard,
          iconRight: <ArrowRight className="size-4" />,
        },
      ]
    : [
        {
          text: "Get started free",
          variant: "default" as const,
          onClick: onSignIn,
          iconRight: <ArrowRight className="size-4" />,
        },
        {
          text: "Watch demo",
          variant: "outline" as const,
          onClick: () => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }),
        },
      ];

  const ctaButtons = isLoggedIn
    ? [
        {
          text: "Go to Dashboard",
          variant: "default" as const,
          onClick: onGoToDashboard,
          iconRight: <ArrowRight className="size-4" />,
        },
      ]
    : [
        {
          text: "Get started free",
          variant: "default" as const,
          onClick: onSignIn,
          iconRight: <ArrowRight className="size-4" />,
        },
      ];

  const pricingPlans = [
    {
      name: "Starter",
      description: "For small teams getting started with Orbit",
      price: 0,
      priceNote: "Free forever. No credit card needed.",
      cta: {
        variant: "glow" as const,
        label: isLoggedIn ? "Go to Dashboard" : "Get started free",
        onClick: isLoggedIn ? onGoToDashboard : onSignIn,
      },
      features: [
        "Up to 10 employees",
        "Basic timesheets",
        "Attendance tracking",
        "Email support",
      ],
      variant: "default" as const,
    },
    {
      name: "Pro",
      description: "For growing teams that need the full power of Orbit",
      price: 49,
      originalPrice: 79,
      promotionText: "Most popular",
      priceNote: "Billed monthly or annually",
      cta: {
        variant: "default" as const,
        label: isLoggedIn ? "Go to Dashboard" : "Start free trial",
        onClick: isLoggedIn ? onGoToDashboard : onSignIn,
      },
      features: [
        "Up to 100 employees",
        "AI HR Copilot",
        "Advanced analytics",
        "Geofenced attendance",
        "Priority support",
        "Custom holiday rules",
      ],
      variant: "glow-brand" as const,
    },
    {
      name: "Enterprise",
      description: "For organizations with advanced compliance needs",
      price: 100,
      priceNote: "Custom pricing — we'll build a plan for you",
      cta: {
        variant: "default" as const,
        label: isLoggedIn ? "Go to Dashboard" : "Get started",
        onClick: isLoggedIn ? onGoToDashboard : onSignIn,
      },
      features: [
        "Unlimited employees",
        "Custom integrations",
        "Dedicated support",
        "SSO / SAML",
        "Compliance exports",
        "Role-based access",
      ],
      variant: "default" as const,
    },
  ];

  return (
    <ErrorBoundary>
      <div
        id="landing-content"
        className="bg-background text-foreground font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-clip antialiased"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-gradient-to-b from-blue-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <Navbar
          logo={
            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={isLoggedIn ? onGoToDashboard : undefined}
              aria-label={isLoggedIn ? "Go to dashboard" : "Orbit EMS"}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-brand-emerald rounded-lg flex items-center justify-center shadow-lg shadow-brand-emerald/10">
                <Compass className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Orbit{' '}
                <span className="text-xs text-muted-foreground font-normal">EMS</span>
              </span>
            </button>
          }
          name=""
          homeUrl="#"
          showNavigation={false}
          actions={
            isLoggedIn
              ? [
                  {
                    text: "Dashboard",
                    isButton: true,
                    variant: "default" as const,
                    onClick: onGoToDashboard,
                    iconRight: <ArrowRight className="w-4 h-4 ml-2" />,
                  },
                ]
              : [
                  { text: "Log in", isButton: false, onClick: onSignIn },
                  { text: "Sign up", isButton: true, variant: "default" as const, onClick: onSignIn },
                ]
          }
        />
        <HeroSection
          title="The operating system for your people."
          description="Onboarding, attendance, timesheets, recruitment, and AI-powered analytics — all in one unified platform."
          badge={
            <Badge variant="outline" className="animate-appear">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Announcing Orbit Beta
            </Badge>
          }
          buttons={heroButtons}
          mockup={heroMockup}
        />

        <LogosSection
          badge={false}
          title="Trusted by teams from around the world"
        />

        <StatsSection
          items={[
            { label: "active users", value: "12", suffix: "k+", description: "teams using Orbit across 40 countries" },
            { label: "hours tracked", value: "2.4", suffix: "M+", description: "total attendance hours logged" },
            { label: "onboarded", value: "50", suffix: "k+", description: "employees onboarded seamlessly" },
            { label: "AI responses", value: "100", suffix: "k+", description: "HR Copilot queries answered monthly" },
          ]}
        />

        <ItemsSection
          title="One Unified OS. Zero Fragmented HR Tooling."
          items={features}
        />

        <PricingSection
          title="Simple, Dynamic, Predictable Pricing."
          description="No long-term contracts. Adjust active credentials anytime as your team grows or changes size."
          plans={pricingPlans}
        />

        <section id="testimonials" className="py-24 border-t border-border bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BlurFade inView className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary">Testimonials</h2>
              <p className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-heading leading-tight">
                Trusted by High-Performance Teams.
              </p>
              <p className="text-muted-foreground text-md sm:text-lg">
                Hear how operations officers, human resource managers, and employees simplify compliance with Orbit.
              </p>
            </BlurFade>
            <div className="relative mt-14">
              <Marquee pauseOnHover className="[--duration:40s]">
                {testimonials.map((t, i) => (
                  <Card key={i} className="bg-card/60 border-border shadow-xl w-[280px] sm:w-80 shrink-0 mx-3">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-current" aria-hidden="true" />
                        ))}
                      </div>
                      <p className="text-foreground text-sm leading-relaxed italic">{t.quote}</p>
                      <div className="flex items-center gap-3 border-t border-border pt-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase text-white" style={{ backgroundColor: `${t.color}20` }}>{t.initials}</div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">{t.name}</p>
                          <span className="text-[10px] text-zinc-400 block">{t.role}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </Marquee>
            </div>
          </div>
        </section>

        <FAQSection title="Frequently Asked Questions" items={faqItems} />

        <CTASection title="Ready to Orbit Your Operations?" buttons={ctaButtons} />

        <FooterSection
          logo={
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-brand-emerald rounded flex items-center justify-center text-primary-foreground text-xs font-bold">
                O
              </div>
            </div>
          }
          name="Orbit EMS"
          columns={[
            {
              title: "Product",
              links: [
                { text: "Features", href: "#features" },
                { text: "Demo", href: "#demo" },
                { text: "Pricing", href: "#pricing" },
                { text: "Testimonials", href: "#testimonials" },
              ],
            },
            {
              title: "Legal",
              links: [
                { text: "Privacy Policy", href: "#" },
                { text: "Terms of Service", href: "#" },
                { text: "Compliance", href: "#" },
              ],
            },
            {
              title: "Company",
              links: [
                { text: "About", href: "#" },
                { text: "Blog", href: "#" },
                { text: "Contact", href: "#" },
              ],
            },
          ]}
          copyright={`\u00A9 ${new Date().getFullYear()} Orbit EMS. All rights reserved.`}
          policies={[
            { text: "Privacy Policy", href: "#" },
            { text: "Terms of Service", href: "#" },
          ]}
          showModeToggle={true}
        />
      </div>
    </ErrorBoundary>
  );
}
