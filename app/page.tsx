"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import {
  ArrowRight,
  Check,
  Zap,
  BarChart3,
  Users,
  Lock,
  Settings,
  Plus,
  Play,
  ArrowRightLeft,
  MousePointer,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  FileSpreadsheet,
  Facebook,
  MessageSquare,
  AlertTriangle,
  Star,
  Workflow,
  Shield,
  Globe,
  Search,
  Building2,
  Menu,
  X,
  Mail,
  User,
  Activity,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Smartphone
} from "lucide-react";

// --- Types & Interfaces ---
interface ProblemCard {
  title: string;
  description: string;
  metric: string;
  solution: string;
  icon: any;
  color: string;
}

interface FeatureCard {
  title: string;
  description: string;
  badge?: string;
  icon: any;
  metric: string;
}

interface ScreenshotTab {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
}

// --- Data Constants ---
const TRUSTED_INDUSTRIES = [
  { name: "Marketing Agencies", icon: Zap },
  { name: "Real Estate", icon: Building2 },
  { name: "Solar EPC", icon: Sun },
  { name: "Healthcare", icon: Shield },
  { name: "Education", icon: Globe },
  { name: "Finance", icon: DollarSign },
  { name: "Retail", icon: Target },
  { name: "Automobile", icon: Activity }
];

const PROBLEM_CARDS: ProblemCard[] = [
  {
    title: "Lost Leads",
    description: "Leads scattered across multiple spreadsheets and emails end up forgotten or unassigned.",
    metric: "28% of leads go cold",
    solution: "Instant central ingestion database.",
    icon: AlertTriangle,
    color: "from-red-500/20 to-orange-500/20 text-red-500 border-red-500/20"
  },
  {
    title: "Late Responses",
    description: "Manual handling delays callback. Prospects buy from the competitor who contacts them first.",
    metric: "Response time > 4 hours",
    solution: "Instant SMS/WhatsApp automation.",
    icon: Clock,
    color: "from-amber-500/20 to-yellow-500/20 text-amber-500 border-amber-500/20"
  },
  {
    title: "No Automation",
    description: "Sales representatives waste hours manually updating sheets and typing copy-paste messages.",
    metric: "70% repetitive tasks",
    solution: "Auto-assignment & trigger rules.",
    icon: Workflow,
    color: "from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/20"
  },
  {
    title: "No Sales Visibility",
    description: "Agencies struggle to prove lead quality and tracking ROI of their campaigns to client owners.",
    metric: "Zero closed-loop analytics",
    solution: "Automated pipeline attribution dashboard.",
    icon: BarChart3,
    color: "from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/20"
  }
];

const SOLUTION_FLOW = [
  { step: "Meta Lead Ads", label: "Webhook Event", icon: Facebook, color: "text-blue-500 bg-blue-500/10" },
  { step: "GrowPhil CRM", label: "Central Ingest", icon: Sparkles, color: "text-primary bg-primary/10 ring-2 ring-primary" },
  { step: "Lead Assignment", label: "Smart Routing", icon: User, color: "text-purple-500 bg-purple-500/10" },
  { step: "Automation", label: "Template Trigger", icon: Workflow, color: "text-indigo-500 bg-indigo-500/10" },
  { step: "Tasks Created", label: "Sales Reminders", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  { step: "WhatsApp Notification", label: "Instant Chat", icon: MessageSquare, color: "text-success bg-success/10" },
  { step: "Sales Pipeline", label: "Active Tracking", icon: BarChart3, color: "text-cyan-500 bg-cyan-500/10" },
  { step: "Won Deal!", label: "Revenue Attributed", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" }
];

const FEATURES: FeatureCard[] = [
  {
    title: "Lead Management",
    description: "Centralized workspace detailing custom fields, campaign sources, communications, and audit trails.",
    icon: Users,
    metric: "Unlimited Leads"
  },
  {
    title: "Google Sheets Sync",
    description: "Map columns from spreadsheets to the CRM database with configurable automatic polling intervals.",
    badge: "5 Min Intervals",
    icon: FileSpreadsheet,
    metric: "Bi-directional Sync"
  },
  {
    title: "Meta Lead Ads Integration",
    description: "Direct webhooks instantly pull prospects submitted from Facebook/Instagram ad campaigns in real-time.",
    badge: "Real-Time Webhook",
    icon: Facebook,
    metric: "Instant Ingest"
  },
  {
    title: "Sales Pipeline",
    description: "Drag-and-drop board tracking deal stages: New, Contacted, Qualified, Negotiation, Won/Lost.",
    icon: BarChart3,
    metric: "Visual Kanban"
  },
  {
    title: "Workflow Automation",
    description: "Define trigger rules (e.g. New Lead) to automatically assign representatives and send email/WhatsApp alerts.",
    badge: "No-Code Builder",
    icon: Workflow,
    metric: "Custom Triggers"
  },
  {
    title: "Task Management",
    description: "Set reminders, follow-up dates, and log assignments automatically linked with specific leads.",
    icon: Clock,
    metric: "Overdue Reminders"
  },
  {
    title: "Analytics & ROI",
    description: "Generate charts representing total revenue closed, top-performing ad channels, and rep performance.",
    icon: TrendingUp,
    metric: "Close-Loop Reports"
  },
  {
    title: "Role-Based Access (RBAC)",
    description: "Silo workspace visibility with permissions for agency admins, client owners, managers, and executives.",
    icon: Lock,
    metric: "Granular Security"
  }
];

const SCREENSHOT_TABS: ScreenshotTab[] = [
  {
    id: "dashboard",
    label: "Main Dashboard",
    title: "Platform Overview",
    description: "Get quick visibility over total sales, lead ingestion logs, active tasks, and team efficiency metrics.",
    icon: Laptop,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "pipeline",
    label: "Kanban Pipeline",
    title: "Visual Deal Pipeline",
    description: "Drag leads between columns. Filter by custom parameters, and trigger workflows on stage transitions.",
    icon: Layers,
    color: "from-indigo-500 to-purple-500"
  },
  {
    id: "google-sheets",
    label: "Google Sheets Sync",
    title: "Spreadsheet Integrations",
    description: "OAuth directly into Google Workspace, map sheet columns dynamically, and track import sync history logs.",
    icon: FileSpreadsheet,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "meta-integration",
    label: "Meta Webhooks",
    title: "Meta Lead Ingestion",
    description: "Sync your client's Facebook Business page form leads in milliseconds via native, secure webhooks.",
    icon: Facebook,
    color: "from-blue-600 to-blue-400"
  },
  {
    id: "automation",
    label: "Automation Rules",
    title: "Workflow Trigger Logic",
    description: "Configure sequence chains. When a lead stage changes, assign it, schedule tasks, and trigger messages.",
    icon: Workflow,
    color: "from-violet-500 to-fuchsia-500"
  },
  {
    id: "analytics",
    label: "Reports & Charts",
    title: "Revenue Tracking",
    description: "Analyze campaign return on ad spend (ROAS) and monitor sales rep conversion leadership metrics.",
    icon: BarChart3,
    color: "from-amber-500 to-pink-500"
  }
];

const TIMELINE_STEPS = [
  { title: "Register Agency", desc: "Create your master agency account on our multi-tenant cloud workspace." },
  { title: "Verify Email", desc: "Quick verification via onboarding email links." },
  { title: "Activate 45-Day Trial", desc: "Unlock full professional features with zero payment details required upfront." },
  { title: "Create Client Profile", desc: "Provision dedicated sub-workspaces for each of your client businesses." },
  { title: "Connect Google Sheets / Meta", desc: "Easily map their current ad forms or sync sheets." },
  { title: "Receive Leads", desc: "Leads begin flowing instantly. Real-time notifications pop up." },
  { title: "Close More Deals", desc: "Nurture with task reminders, automation triggers, and track closing revenue." }
];

const FAQS: FAQItem[] = [
  {
    question: "How does the 45-Day Free Trial work?",
    answer: "You get full, unrestricted access to all features (Pro level) for 45 days. You do not need to enter a credit card. At the end of the trial, you can choose to subscribe to our Starter or Pro plans, or downgrade to keep basic features."
  },
  {
    question: "Can I manage multiple clients under a single login?",
    answer: "Yes, absolutely. GrowPhil CRM is built from the ground up as a multi-tenant platform. Agency administrators can switch between different client workspaces seamlessly from their dashboard and assign unique managers/executives to specific accounts."
  },
  {
    question: "How does Google Sheets column mapping work?",
    answer: "Once you authorize your Google account, you choose a spreadsheet and specific tab. GrowPhil fetches the header row, letting you map custom fields like 'Full Name' to 'name', 'Phone No' to 'phone', or any custom field mapping you need. Sync runs automatically at your selected interval."
  },
  {
    question: "Is there a limit to how many Facebook pages I can connect?",
    answer: "No. You can connect as many Facebook Business accounts, pages, and Lead Ads forms as needed under your agency's client profiles. Real-time webhooks ingest the leads in milliseconds."
  },
  {
    question: "Do you integrate with WhatsApp?",
    answer: "Yes. Using our built-in workflow engine, you can map templates to send outbound WhatsApp notifications instantly when a new lead lands or when their pipeline status changes."
  },
  {
    question: "Is data isolated between different clients?",
    answer: "Yes, client workspaces are completely isolated. Users added to one client profile cannot view leads, activity logs, mappings, or reports of other clients unless they are designated as Agency Admins."
  }
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Vikram Mehta",
    role: "Founder & CEO",
    company: "Apex Media Agency",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    quote: "Switching our clients from scattered sheets to GrowPhil CRM changed our agency. We proved lead quality, tracked ROI, and cut response times down to minutes. Clients are staying with us twice as long!",
    rating: 5
  },
  {
    name: "Sarah Jenkins",
    role: "Head of Marketing Operations",
    company: "Elevate Real Estate",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    quote: "Meta Lead Ads stream into our dashboard instantly. Before GrowPhil, it took hours to assign leads to agents. Now, assignment is automated, and agents get follow-up WhatsApp tasks in real time.",
    rating: 5
  },
  {
    name: "Arjun Sharma",
    role: "Sales Director",
    company: "SunDrive Solar EPC",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    quote: "Our sales reps close 40% more deals using the pipelines. The task scheduler and activity history logs guarantee that no lead slips through the cracks. It's clean, intuitive, and insanely fast.",
    rating: 5
  }
];

export default function SaaSLandingPage() {
  const { theme, toggleTheme } = useTheme();
  
  // State Management
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeScreenshotTab, setActiveScreenshotTab] = useState("dashboard");
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  
  // Timeline Active Step State
  const [timelineStep, setTimelineStep] = useState(3); // default highlight 4th step "Create Client"

  // Carousel Testimonials
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  // Workflow Simulator Interactive States
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  // Stats Counters
  const [totalLeadsCount, setTotalLeadsCount] = useState(12430);

  // Real-time toast simulated leads
  const [incomingLeads, setIncomingLeads] = useState<Array<{ name: string; source: string; time: string; id: number }>>([
    { name: "John Doe", source: "Facebook Lead Ads", time: "Just now", id: 1 },
    { name: "Meera Patel", source: "Google Sheets Sync", time: "1 min ago", id: 2 }
  ]);

  // Handle Navbar Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Simulating Real-time leads arrivals
  useEffect(() => {
    const names = ["Aravind Kumar", "Elena Rostova", "Sophia Miller", "Li Wei", "Carlos Santana", "Devendra Nath"];
    const sources = ["Facebook Lead Ads", "Google Sheets Sync", "API Ingestion"];
    
    const interval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const newId = Date.now();

      setIncomingLeads((prev) => [
        { name: randomName, source: randomSource, time: "Just now", id: newId },
        ...prev.slice(0, 1) // keep latest 2
      ]);

      setTotalLeadsCount((prev) => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Simulating Solution Workflow Stepper
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % SOLUTION_FLOW.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Next Testimonial
  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };
  // Prev Testimonial
  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <div className="relative w-full overflow-x-hidden min-h-screen font-sans antialiased bg-background text-foreground transition-premium">
      
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none z-0" />
      <div className="absolute top-[200px] left-1/4 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[400px] right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* --- STICKY NAVBAR --- */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-premium border-b ${
          scrolled
            ? "glass-header shadow-sm py-4"
            : "bg-transparent border-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center text-white font-display font-extrabold text-xl shadow-lg shadow-primary/20">
              G
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-text-primary">
              GrowPhil <span className="text-primary">CRM</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Why GrowPhil</a>
            <a href="#solution" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">How it Works</a>
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">FAQs</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border bg-card/40 hover:bg-hover transition-premium text-text-secondary hover:text-text-primary"
              aria-label="Toggle visual theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <a
              href="https://growphil.vercel.app/login"
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
            >
              Sign In
            </a>
            <a
              href="#pricing"
              className="text-sm font-semibold bg-primary hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 transition-premium shadow-md shadow-primary/20 hover:scale-[1.02]"
            >
              Start Free Trial
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border bg-card/40 text-text-secondary"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-border bg-card/40 text-text-primary"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden w-full bg-card/95 border-b border-border backdrop-blur-lg overflow-hidden"
            >
              <div className="px-6 py-6 flex flex-col gap-5">
                <a
                  href="#problem"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary"
                >
                  Why GrowPhil
                </a>
                <a
                  href="#solution"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary"
                >
                  How it Works
                </a>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary"
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-text-secondary"
                >
                  FAQs
                </a>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-3">
                  <a
                    href="https://growphil.vercel.app/login"
                    className="w-full text-center py-2.5 rounded-xl border border-border text-text-primary font-medium bg-background/50"
                  >
                    Sign In
                  </a>
                  <a
                    href="#pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-xl bg-primary text-white font-semibold"
                  >
                    Start 45-Day Trial
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- SECTION 1: HERO --- */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6 animate-pulse">
              <Sparkles size={12} />
              <span>SaaS 2026 Edition: Multi-Tenant Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-text-primary tracking-tight leading-[1.08] mb-6">
              Manage Every Client's Leads From <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">One CRM</span>
            </h1>
            
            <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-8 max-w-xl">
              GrowPhil CRM helps marketing agencies capture leads from Meta Lead Ads and Google Sheets, automate follow-ups, assign representatives instantly, and close deals with an intelligent sales pipeline.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <a
                href="#pricing"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white rounded-xl px-7 py-4 font-semibold text-base transition-premium shadow-lg shadow-primary/20 hover:scale-[1.02]"
              >
                <span>Start 45-Day Free Trial</span>
                <ArrowRight size={18} />
              </a>
              <a
                href="#solution"
                className="flex items-center justify-center gap-2 bg-card border border-border hover:bg-hover text-text-primary rounded-xl px-7 py-4 font-semibold text-base transition-premium"
              >
                <Play size={16} className="fill-current text-primary" />
                <span>Book Live Demo</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border w-full max-w-md">
              <div>
                <span className="block text-2xl font-bold font-display text-text-primary">
                  {totalLeadsCount.toLocaleString()}
                </span>
                <span className="text-xs text-text-secondary">Synced Leads Today</span>
              </div>
              <div>
                <span className="block text-2xl font-bold font-display text-text-primary">99.9%</span>
                <span className="text-xs text-text-secondary">Uptime Rate</span>
              </div>
              <div>
                <span className="block text-2xl font-bold font-display text-text-primary">45 Days</span>
                <span className="text-xs text-text-secondary">Risk-Free Trial</span>
              </div>
            </div>
          </div>

          {/* Right Hero: High-Fidelity 3D Dashboard Mockup */}
          <div className="lg:col-span-6 relative w-full flex justify-center">
            
            {/* Ambient Background Glow behind dashboard */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-cyan-500/10 rounded-3xl blur-2xl transform scale-95" />

            {/* Interactive Browser Frame Container */}
            <div className="relative w-full max-w-lg border border-border bg-card/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden aspect-[4/3] flex flex-col">
              
              {/* Browser Header */}
              <div className="bg-card-secondary/80 border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="bg-background/80 border border-border text-[10px] text-text-secondary px-6 py-0.5 rounded-md max-w-xs truncate">
                  growphil.com/agency/dashboard
                </div>
                <div className="w-12" />
              </div>

              {/* Dashboard Content Mockup */}
              <div className="flex-1 p-5 grid grid-cols-12 gap-4 text-xs overflow-hidden select-none">
                
                {/* Metric Sidebar */}
                <div className="col-span-3 border-r border-border/80 pr-3 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">G</div>
                    <span>GrowPhil</span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <span className="bg-primary/10 text-primary font-semibold px-2 py-1 rounded-md">Overview</span>
                    <span className="text-text-secondary px-2 py-1">Pipelines</span>
                    <span className="text-text-secondary px-2 py-1 font-medium text-[10px] flex items-center justify-between">
                      Clients <span className="bg-border px-1 rounded">12</span>
                    </span>
                    <span className="text-text-secondary px-2 py-1">Integrations</span>
                    <span className="text-text-secondary px-2 py-1">Settings</span>
                  </nav>
                </div>

                {/* Dashboard Main Visual Area */}
                <div className="col-span-9 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-text-primary text-[13px]">Apex Media Workspace</h4>
                      <span className="text-[10px] text-text-secondary">Summary stats for this week</span>
                    </div>
                    <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full font-medium">Live</span>
                  </div>

                  {/* Cards Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card-secondary/60 border border-border/50 rounded-xl p-3">
                      <span className="text-[10px] text-text-secondary block">Monthly Revenue</span>
                      <span className="text-[14px] font-bold text-text-primary font-display">₹4,82,500</span>
                      <span className="text-[9px] text-success block mt-1">↑ 18.4% from May</span>
                    </div>
                    <div className="bg-card-secondary/60 border border-border/50 rounded-xl p-3">
                      <span className="text-[10px] text-text-secondary block">Conversion Rate</span>
                      <span className="text-[14px] font-bold text-text-primary font-display">24.6%</span>
                      <span className="text-[9px] text-primary block mt-1">↑ 3.2% vs industry avg</span>
                    </div>
                  </div>

                  {/* Chart representation */}
                  <div className="bg-card-secondary/60 border border-border/50 rounded-xl p-3 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] text-text-secondary">
                      <span>Ingestion Rate (Hours)</span>
                      <span>Total: 840 leads</span>
                    </div>
                    {/* Simulated SVG Bar chart */}
                    <div className="h-16 flex items-end justify-between px-2 pt-2 border-b border-border/60">
                      <div className="w-5 bg-primary/20 rounded-t-sm h-1/3" />
                      <div className="w-5 bg-primary/45 rounded-t-sm h-2/3" />
                      <div className="w-5 bg-primary/60 rounded-t-sm h-1/2" />
                      <div className="w-5 bg-gradient-to-t from-primary to-cyan-400 rounded-t-sm h-full" />
                      <div className="w-5 bg-primary/80 rounded-t-sm h-4/5" />
                      <div className="w-5 bg-primary/50 rounded-t-sm h-3/5" />
                    </div>
                    <div className="flex justify-between text-[8px] text-text-secondary px-1 pt-1">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* --- Floating Live Feeds Toast Overlay --- */}
            <div className="absolute -bottom-6 -right-4 max-w-[240px] flex flex-col gap-2 z-10">
              <AnimatePresence mode="popLayout">
                {incomingLeads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="glass-card shadow-xl rounded-xl p-3 border border-primary/20 flex gap-2.5 items-start bg-card/90"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                      {lead.source.includes("Facebook") ? <Facebook size={14} /> : <FileSpreadsheet size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-text-primary truncate">{lead.name}</span>
                        <span className="text-[8px] text-text-secondary whitespace-nowrap">{lead.time}</span>
                      </div>
                      <span className="text-[9px] text-text-secondary block truncate">Synced via {lead.source}</span>
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-success mt-1">
                        <Check size={8} /> Trigger sent
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Floating Task Prompt */}
            <div className="absolute -top-6 -left-6 glass-card shadow-lg rounded-xl p-3 border border-border/80 flex items-center gap-3 bg-card/90 max-w-[190px]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[9px] text-text-secondary block">Pending Tasks</span>
                <span className="text-[11px] font-bold text-text-primary">Call Vikram (Real Estate)</span>
                <span className="text-[8px] text-red-500 block">Due in 15 mins</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* --- SECTION 2: TRUSTED BY LOGO CLOUD --- */}
      <section className="py-12 border-y border-border bg-card-secondary/30 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <span className="text-xs font-bold text-text-secondary tracking-widest uppercase">
            TRUSTED BY GROWING TEAMS ACROSS MULTIPLE VERTICALS
          </span>
        </div>

        {/* Infinite Marquee Wrapper */}
        <div className="w-full relative flex overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-12 text-text-secondary font-semibold text-base py-2">
            {[...TRUSTED_INDUSTRIES, ...TRUSTED_INDUSTRIES].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3.5 hover:text-text-primary transition-colors cursor-default">
                <div className="w-7 h-7 rounded-lg bg-border flex items-center justify-center">
                  <item.icon size={14} className="text-primary" />
                </div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        </div>
      </section>

      {/* --- SECTION 3: PROBLEM SECTION --- */}
      <section id="problem" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">THE EXCEL CHAOS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            Still Managing Leads in Spreadsheets?
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-16">
            Every minute you wait to contact a new lead, conversion probability falls. Static spreadsheets lack real-time pipelines, leading to dropped calls, forgotten follow-ups, and lost deals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PROBLEM_CARDS.map((card, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-start text-left bg-card hover:bg-hover border border-border p-6 rounded-2xl shadow-sm transition-premium hover:-translate-y-1.5 group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${card.color}`}>
                  <card.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 font-display group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4 flex-1">
                  {card.description}
                </p>
                <div className="mt-4 pt-4 border-t border-border/60 w-full flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-red-500 font-bold">{card.metric}</span>
                  <span className="text-text-primary">→ {card.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: SOLUTION DYNAMIC FLOW --- */}
      <section id="solution" className="py-20 md:py-28 bg-card-secondary/35 border-y border-border relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">PIPELINE UNIFICATION</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            GrowPhil CRM Solves Everything
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-16">
            See how your client lead ingestion flow transforms into a fully automated, transparent revenue-producing engine in seconds.
          </p>

          {/* Interactive Dynamic Grid Flow */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-stretch relative">
            {SOLUTION_FLOW.map((node, idx) => {
              const isActive = activeWorkflowStep === idx;
              return (
                <div key={idx} className="relative flex flex-col items-center">
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center p-4 rounded-xl border transition-premium ${
                      isActive
                        ? "bg-card border-primary shadow-lg shadow-primary/10 scale-105"
                        : "bg-card/50 border-border"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${node.color}`}>
                      <node.icon size={18} />
                    </div>
                    <span className="text-[11px] font-bold text-text-primary text-center leading-tight mb-1 truncate w-full">
                      {node.step}
                    </span>
                    <span className="text-[9px] text-text-secondary text-center truncate w-full">
                      {node.label}
                    </span>
                  </div>

                  {/* Connective Arrows */}
                  {idx < SOLUTION_FLOW.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3.5 transform -translate-y-1/2 z-10 text-border">
                      <ChevronRight size={14} className={isActive ? "text-primary animate-pulse" : "text-border"} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 inline-flex items-center gap-2 text-xs text-text-secondary bg-card border border-border px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping" />
            <span>Interactive Simulator: Syncs loop automatically in our background workers.</span>
          </div>
        </div>
      </section>

      {/* --- SECTION 5: CORE FEATURES GRID --- */}
      <section id="features" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">ENTERPRISE CORE</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            Powering Agency Execution
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-16">
            Everything your team needs to pull, distribute, nurture, and track client leads in a single centralized multi-tenant workspace.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feat, idx) => (
              <div
                key={idx}
                className="bg-card hover:bg-hover border border-border rounded-2xl p-6 text-left flex flex-col justify-between group transition-premium hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <feat.icon size={20} />
                    </div>
                    {feat.badge && (
                      <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full">
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2 font-display">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed mb-6">
                    {feat.description}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold text-text-secondary">
                  <span>Capacity: {feat.metric}</span>
                  <a href="#pricing" className="text-primary hover:underline flex items-center gap-1">
                    Start Trial <ChevronRight size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 6: PLATFORM INTERACTIVE SHOWCASE --- */}
      <section className="py-20 md:py-28 bg-card-secondary/35 border-y border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">EXPLORE THE PRODUCT</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-4">
              Dashboard In Action
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Click the tabs below to explore exact modules from our Next.js client application.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            {SCREENSHOT_TABS.map((tab) => {
              const isActive = activeScreenshotTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreenshotTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-premium ${
                    isActive
                      ? "bg-primary border-primary text-white shadow-md shadow-primary/25"
                      : "bg-card border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Screen mockups rendering dynamic views */}
          <div className="relative border border-border bg-card/60 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto aspect-[16/10] flex flex-col">
            
            {/* Mockup Header */}
            <div className="bg-card-secondary/80 border-b border-border px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500/50" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/50" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500/50" />
              </div>
              <div className="bg-background/80 border border-border text-xs text-text-secondary px-8 py-1 rounded-md max-w-sm truncate text-center">
                crm.growphil.app/client/{activeScreenshotTab}
              </div>
              <div className="w-16" />
            </div>

            {/* Dynamic Rendering based on Selected Tab */}
            <div className="flex-1 p-8 text-xs overflow-y-auto bg-background/40">
              <AnimatePresence mode="wait">
                {SCREENSHOT_TABS.map((tab) => {
                  if (tab.id !== activeScreenshotTab) return null;
                  return (
                    <motion.div
                      key={tab.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-text-primary mb-1 font-display">
                            {tab.title}
                          </h3>
                          <p className="text-text-secondary leading-relaxed text-xs max-w-md">
                            {tab.description}
                          </p>
                        </div>
                        <span className="self-start md:self-center px-3 py-1 bg-primary/10 text-primary border border-primary/20 font-bold rounded-lg whitespace-nowrap">
                          Fully Functional
                        </span>
                      </div>

                      {/* Mockup visual area */}
                      <div className="flex-1 border border-dashed border-border/80 rounded-xl p-4 bg-card/30 flex flex-col justify-center min-h-[220px]">
                        
                        {tab.id === "dashboard" && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-card border border-border p-4 rounded-xl">
                              <span className="text-text-secondary block mb-1">Incoming Lead Syncs</span>
                              <span className="text-xl font-bold font-display text-text-primary">1,240</span>
                              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-primary h-full w-[70%]" />
                              </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl">
                              <span className="text-text-secondary block mb-1">Closed Deals (This Month)</span>
                              <span className="text-xl font-bold font-display text-text-primary">₹3,40,000</span>
                              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-success h-full w-[85%]" />
                              </div>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-xl">
                              <span className="text-text-secondary block mb-1">Outstanding Tasks</span>
                              <span className="text-xl font-bold font-display text-text-primary">14 Pending</span>
                              <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-amber-500 h-full w-[40%]" />
                              </div>
                            </div>
                          </div>
                        )}

                        {tab.id === "pipeline" && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2.5">
                              <span className="font-bold text-text-primary block border-b border-border/60 pb-1.5 mb-1.5">New Leads (2)</span>
                              <div className="bg-card-secondary/80 border border-border/50 p-2.5 rounded-lg">
                                <span className="font-semibold block text-text-primary">John Doe</span>
                                <span className="text-[9px] text-text-secondary">Synced 5 mins ago</span>
                              </div>
                              <div className="bg-card-secondary/80 border border-border/50 p-2.5 rounded-lg">
                                <span className="font-semibold block text-text-primary">Meera Patel</span>
                                <span className="text-[9px] text-text-secondary">Synced 10 mins ago</span>
                              </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2.5">
                              <span className="font-bold text-text-primary block border-b border-border/60 pb-1.5 mb-1.5">Contacted (1)</span>
                              <div className="bg-card-secondary/80 border border-border/50 p-2.5 rounded-lg">
                                <span className="font-semibold block text-text-primary">Alice Smith</span>
                                <span className="text-[9px] text-text-secondary">Assigned: Devendra</span>
                              </div>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-3 flex flex-col gap-2.5">
                              <span className="font-bold text-text-primary block border-b border-border/60 pb-1.5 mb-1.5">Won Deal (1)</span>
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                                <span className="font-bold block text-emerald-500">Vikram Mehta</span>
                                <span className="text-[9px] text-text-secondary">Deal Closed: ₹12,500</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {tab.id === "google-sheets" && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-500/15 text-emerald-500 rounded flex items-center justify-center">
                                  <FileSpreadsheet size={16} />
                                </div>
                                <div>
                                  <span className="font-bold text-text-primary block">Real Estate Leads Spreadsheet</span>
                                  <span className="text-[10px] text-text-secondary">Tab: Sheet1 • Connected to Vikram's Agency</span>
                                </div>
                              </div>
                              <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded font-bold">Mapped</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 py-2">
                              <div className="bg-card border border-border/60 p-2.5 rounded-lg">
                                <span className="text-[9px] text-text-secondary block">CRM Target: Name</span>
                                <span className="font-semibold text-text-primary">Mapped to: `Full Name`</span>
                              </div>
                              <div className="bg-card border border-border/60 p-2.5 rounded-lg">
                                <span className="text-[9px] text-text-secondary block">CRM Target: Phone</span>
                                <span className="font-semibold text-text-primary">Mapped to: `Contact Number`</span>
                              </div>
                              <div className="bg-card border border-border/60 p-2.5 rounded-lg">
                                <span className="text-[9px] text-text-secondary block">CRM Target: Email</span>
                                <span className="font-semibold text-text-primary">Mapped to: `Email Address`</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {tab.id === "meta-integration" && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-500/15 text-blue-500 rounded flex items-center justify-center">
                                  <Facebook size={16} />
                                </div>
                                <div>
                                  <span className="font-bold text-text-primary block">Apex Agency Facebook Integration</span>
                                  <span className="text-[10px] text-text-secondary">Token Status: Active • Webhook Registered</span>
                                </div>
                              </div>
                              <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping" />
                            </div>
                            <div className="bg-card-secondary/70 border border-border/50 p-3 rounded-xl mt-2 text-[10px] font-mono whitespace-pre overflow-x-auto text-text-secondary">
                              {`{
  "event": "leadgen_creation",
  "lead_id": "7044182570396041",
  "form_id": "95738604812",
  "created_time": 1782386450,
  "payload": { "name": "Sophia Miller", "phone": "+91 98765 43210" }
}`}
                            </div>
                          </div>
                        )}

                        {tab.id === "automation" && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-semibold text-text-primary mb-2">
                              <Workflow size={14} className="text-primary" />
                              <span>Rule: On New Lead Arrival</span>
                            </div>
                            <div className="flex flex-col gap-2 relative pl-6 border-l border-primary/20">
                              <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-primary" />
                              <div className="bg-card border border-border/60 p-2 rounded-lg flex items-center justify-between">
                                <span>Assign to top rep (Round Robin)</span>
                                <span className="text-primary text-[9px] font-bold">Action 1</span>
                              </div>
                              <div className="absolute -left-1.5 top-14 w-3 h-3 rounded-full bg-primary" />
                              <div className="bg-card border border-border/60 p-2 rounded-lg flex items-center justify-between">
                                <span>Send welcome template via WhatsApp</span>
                                <span className="text-primary text-[9px] font-bold">Action 2</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {tab.id === "analytics" && (
                          <div className="flex flex-col gap-2">
                            <span className="text-text-secondary text-[10px] block">Pipeline Ingestion Trend (May vs June)</span>
                            <div className="h-28 flex items-end justify-between px-6 pt-2 border-b border-border/60">
                              <div className="w-6 bg-primary/25 h-[40%]" />
                              <div className="w-6 bg-primary/80 h-[85%]" />
                              <div className="w-6 bg-primary/25 h-[50%]" />
                              <div className="w-6 bg-primary/80 h-[95%]" />
                              <div className="w-6 bg-primary/25 h-[30%]" />
                              <div className="w-6 bg-primary/80 h-[75%]" />
                            </div>
                            <div className="flex justify-between text-[9px] text-text-secondary px-6 mt-1">
                              <span>Weeks 1</span>
                              <span>Weeks 2</span>
                              <span>Weeks 3</span>
                            </div>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 7: HOW IT WORKS TIMELINE --- */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">GET STARTED</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-4">
              7 Steps To CRM Success
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Follow this sequence to register your agency and configure automated lead flows for all your clients.
            </p>
          </div>

          {/* Interactive Timeline Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Timeline Left: Steps Details */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {TIMELINE_STEPS.map((step, idx) => {
                const isActive = timelineStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setTimelineStep(idx)}
                    className={`flex items-start text-left gap-4 p-4 rounded-xl border transition-premium ${
                      isActive
                        ? "bg-card border-primary shadow-md shadow-primary/5 translate-x-2"
                        : "bg-transparent border-transparent hover:bg-card-secondary/20"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive ? "bg-primary text-white" : "bg-border text-text-secondary"
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm mb-1 ${isActive ? "text-text-primary" : "text-text-secondary"}`}>
                        {step.title}
                      </h4>
                      {isActive && (
                        <p className="text-xs text-text-secondary leading-relaxed animate-fade-in">
                          {step.desc}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Timeline Right: Interactive Visual Representation */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-lg relative min-h-[300px] flex flex-col justify-center">
                
                {timelineStep === 0 && (
                  <div className="text-center py-6">
                    <Building2 className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Register Agency</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Define your Agency Name, Master admin email, and select your hosting region context.
                    </p>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                      <div className="bg-primary h-full w-[15%]" />
                    </div>
                  </div>
                )}

                {timelineStep === 1 && (
                  <div className="text-center py-6">
                    <Mail className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Verify Email</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Check your inbox. We verify agency domains instantly to establish secure outbound email configurations.
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-success font-semibold bg-success/10 px-3 py-1 rounded-full">
                      <Check size={12} /> Email Verified
                    </span>
                  </div>
                )}

                {timelineStep === 2 && (
                  <div className="text-center py-6">
                    <Zap className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Activate 45-Day Trial</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Full access to Pro plan capabilities immediately enabled. Zero risk. Zero cards requested.
                    </p>
                    <div className="text-text-primary font-bold text-xs bg-card-secondary px-4 py-2 rounded-lg max-w-xs mx-auto border border-border">
                      Trial ends: August 9, 2026
                    </div>
                  </div>
                )}

                {timelineStep === 3 && (
                  <div className="text-center py-6">
                    <Users className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Create Client Profile</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Add custom names like "Apex Real Estate" or "Delhi Clinic". Create unique login access routes for their staff.
                    </p>
                    <div className="border border-border/80 bg-card-secondary p-3 rounded-xl max-w-xs mx-auto flex items-center justify-between text-left">
                      <div>
                        <span className="font-bold block text-text-primary">Apex Real Estate</span>
                        <span className="text-[9px] text-text-secondary">Delhi NCR Sector 62</span>
                      </div>
                      <span className="text-[10px] text-primary font-bold">Sub-Workspace Active</span>
                    </div>
                  </div>
                )}

                {timelineStep === 4 && (
                  <div className="text-center py-6">
                    <FileSpreadsheet className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Connect Google Sheets / Meta</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Direct connection using secure OAuth endpoints. Map columns in seconds, saving form settings.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shadow"><FileSpreadsheet size={18} /></div>
                      <ArrowRightLeft size={16} className="text-text-secondary" />
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shadow">G</div>
                    </div>
                  </div>
                )}

                {timelineStep === 5 && (
                  <div className="text-center py-6">
                    <Facebook className="mx-auto text-primary mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Receive Leads Instantly</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      When a prospective lead fills out forms on Facebook or updates sheets, rows load automatically.
                    </p>
                    <span className="inline-flex items-center gap-2 text-xs text-success bg-success/10 px-4 py-1.5 rounded-full font-bold">
                      <span className="w-2.5 h-2.5 bg-success rounded-full animate-ping" />
                      Incoming Sync In Progress
                    </span>
                  </div>
                )}

                {timelineStep === 6 && (
                  <div className="text-center py-6">
                    <DollarSign className="mx-auto text-success mb-4" size={48} />
                    <h3 className="text-lg font-bold text-text-primary mb-2 font-display">Close More Deals</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto mb-4">
                      Assign leads automatically. Guide them using the drag-and-drop board pipeline, and capture revenue.
                    </p>
                    <div className="bg-success/5 border border-success/20 p-3.5 rounded-xl max-w-xs mx-auto text-success font-bold font-display">
                      + ₹1,40,000 Deal Won
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 8: AUTOMATION SHOWCASE --- */}
      <section className="py-20 md:py-28 bg-card-secondary/35 border-y border-border relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">NO-CODE BUILDER</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            Visual Automation Workflows
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto mb-16">
            Define automated rules that trigger instantly when new leads arrive, ensuring rapid contact and routing.
          </p>

          {/* Workflow Builder Grid Node Display */}
          <div className="max-w-3xl mx-auto border border-border bg-card/60 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-left relative">
            <div className="flex items-center gap-2 mb-6 border-b border-border/60 pb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-text-secondary font-semibold ml-2">Workflow Rule Configuration: New Inbound Lead</span>
            </div>

            <div className="flex flex-col gap-6 relative pl-8 border-l border-primary/20">
              
              {/* Node 1: Trigger */}
              <div className="relative">
                <div className="absolute -left-11 top-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold font-display shadow-md shadow-primary/20">1</div>
                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full mb-1 inline-block">TRIGGER</span>
                    <h4 className="font-bold text-sm text-text-primary">New Inbound Lead Arrives</h4>
                    <p className="text-xs text-text-secondary">Source: Facebook Form or Sheets Mapped Connection</p>
                  </div>
                  <Facebook size={20} className="text-primary" />
                </div>
              </div>

              {/* Node 2: Condition */}
              <div className="relative">
                <div className="absolute -left-11 top-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold font-display shadow-md shadow-primary/20">2</div>
                <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-purple-500/10 text-purple-500 font-bold px-2 py-0.5 rounded-full mb-1 inline-block">CONDITION</span>
                    <h4 className="font-bold text-sm text-text-primary">Campaign Name contains "Solar Promotion"</h4>
                    <p className="text-xs text-text-secondary">Applies only to Solar campaign verticals</p>
                  </div>
                  <Sun size={20} className="text-purple-500" />
                </div>
              </div>

              {/* Node 3: Actions Group */}
              <div className="relative">
                <div className="absolute -left-11 top-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold font-display shadow-md shadow-primary/20">3</div>
                <div className="flex flex-col gap-3">
                  
                  <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded-full mb-1 inline-block">ACTION</span>
                      <h4 className="font-bold text-sm text-text-primary">Assign Sales Executive</h4>
                      <p className="text-xs text-text-secondary">Round Robin pool: Solar Experts Group</p>
                    </div>
                    <User size={20} className="text-success" />
                  </div>

                  <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded-full mb-1 inline-block">ACTION</span>
                      <h4 className="font-bold text-sm text-text-primary">Outbound WhatsApp Message</h4>
                      <p className="text-xs text-text-secondary">Template: `Solar Welcome Call Intro` to prospect</p>
                    </div>
                    <MessageSquare size={20} className="text-success" />
                  </div>

                  <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] bg-success/10 text-success font-bold px-2 py-0.5 rounded-full mb-1 inline-block">ACTION</span>
                      <h4 className="font-bold text-sm text-text-primary">Create Task in CRM</h4>
                      <p className="text-xs text-text-secondary">Task: "Follow-up callback in 2 hours" assigned to rep</p>
                    </div>
                    <Clock size={20} className="text-success" />
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 9: DASHBOARD ANALYTICS SHOWCASE --- */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left side text */}
            <div className="lg:col-span-5 text-left">
              <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">CLOSE-LOOP REPORTING</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
                Attribution & Revenue Analytics
              </h2>
              <p className="text-text-secondary leading-relaxed mb-8">
                Marketing agencies finally have close-loop feedback. Prove your value to client business owners by showing exactly which leads generated revenue. Monitor executive closing leadership metrics and track average lead-to-deal response times.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
                    <Check size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">Track conversion rates in real-time</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
                    <Check size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">Attribute revenue to Facebook Ad forms</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/10 text-success rounded-lg flex items-center justify-center shrink-0">
                    <Check size={16} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">Track top performing sales executives</span>
                </div>
              </div>
            </div>

            {/* Right side analytics showcase */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Sales Attributed Card */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-text-secondary text-[11px] font-semibold block mb-2 uppercase">TOTAL VALUE CLOSED</span>
                  <span className="text-2xl font-bold font-display text-text-primary">₹6,84,300</span>
                  <span className="text-xs text-success block mt-1">↑ 22.4% this month</span>
                </div>
                {/* Simulated custom SVG line chart */}
                <div className="h-16 w-full mt-6">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d="M0,25 Q15,18 30,22 T60,10 T90,5 L100,5"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,25 Q15,18 30,22 T60,10 T90,5 L100,5 L100,30 L0,30 Z"
                      fill="url(#gradient-blue)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Lead Sources Card */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <span className="text-text-secondary text-[11px] font-semibold block mb-4 uppercase">LEAD SOURCE SHARE</span>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Facebook Ads</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full w-[65%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>Google Sheets Sync</span>
                      <span>25%</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[25%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span>API Ingest</span>
                      <span>10%</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full w-[10%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* conversion metrics widget */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm sm:col-span-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6">
                <div>
                  <span className="text-text-secondary text-[11px] font-semibold block mb-1 uppercase">LEAD ATTRIBUTION FUNNEL</span>
                  <span className="text-lg font-bold text-text-primary block font-display">12,430 Ingested Leads</span>
                  <span className="text-xs text-text-secondary">Average closing cycle: 4.8 days</span>
                </div>
                <div className="flex items-center gap-8 font-display">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-text-primary">85.4%</span>
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">Contacted</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-primary">32.6%</span>
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">Qualified</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-success">24.6%</span>
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">Won Deal</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 10: INDUSTRIES GRID --- */}
      <section className="py-20 md:py-28 bg-card-secondary/35 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">SUPPORTED VERTICALS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            Built For Diverse Niches
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-16">
            GrowPhil CRM can be configured for any local or online campaign niche.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TRUSTED_INDUSTRIES.map((industry, idx) => (
              <div
                key={idx}
                className="bg-card hover:bg-hover border border-border p-6 rounded-2xl flex flex-col items-center justify-center group transition-premium hover:-translate-y-1 hover:shadow-md cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-4">
                  <industry.icon size={22} />
                </div>
                <span className="font-bold text-sm text-text-primary font-display">{industry.name}</span>
                <span className="text-[10px] text-text-secondary mt-1">Template Active</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 11: PRICING --- */}
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">TRANSPARENT PLANS</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-black text-text-primary tracking-tight mb-6">
            Start Free. Scale As You Grow.
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto mb-8">
            Try full features risk-free for 45 days. No payment details required. Toggle billing duration below.
          </p>

          {/* Monthly/Yearly Toggle */}
          <div className="inline-flex items-center gap-2 bg-card-secondary border border-border p-1.5 rounded-xl mb-16">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-premium ${
                billingCycle === "monthly"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-premium flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="bg-success text-white text-[9px] px-1.5 py-0.5 rounded font-black">Save 20%</span>
            </button>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* Free Trial Card */}
            <div className="bg-card border border-border p-8 rounded-3xl text-left flex flex-col justify-between hover:border-primary/40 transition-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary/10 text-primary border-b border-l border-primary/20 text-[9px] font-bold px-3 py-1 rounded-bl-lg">
                45-Day Trial Available
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Free Trial</h4>
                <div className="flex items-baseline gap-1 mb-4 font-display">
                  <span className="text-3xl font-black text-text-primary font-display">₹0</span>
                  <span className="text-text-secondary text-xs">/ month</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  Perfect to evaluate functionality and configure client integrations with zero upfront commitment.
                </p>
                <div className="h-px bg-border my-6" />
                <ul className="flex flex-col gap-3 text-xs mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Manage up to 2 Clients</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Google Sheets mapping sync</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Meta Lead Webhooks</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Sales Kanban pipeline boards</span></li>
                  <li className="flex items-center gap-2 text-text-secondary/50"><X size={14} className="shrink-0" /> <span>Workflow auto-actions</span></li>
                </ul>
              </div>
              <a
                href="https://growphil.vercel.app/register"
                className="w-full text-center py-3 rounded-xl border border-border bg-card-secondary hover:bg-hover font-semibold text-xs text-text-primary transition-premium"
              >
                Get Started Free
              </a>
            </div>

            {/* Starter Plan Card */}
            <div className="bg-card border border-border p-8 rounded-3xl text-left flex flex-col justify-between hover:border-primary/40 transition-premium relative">
              <div>
                <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Starter</h4>
                <div className="flex items-baseline gap-1 mb-4 font-display">
                  <span className="text-3xl font-black text-text-primary">
                    {billingCycle === "monthly" ? "₹2,499" : "₹1,999"}
                  </span>
                  <span className="text-text-secondary text-xs">/ month</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  Ideal for boutique agencies managing up to 10 clients. Enable workflows and email notifications.
                </p>
                <div className="h-px bg-border my-6" />
                <ul className="flex flex-col gap-3 text-xs mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Manage up to 10 Clients</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>All integrations (Meta, Sheets)</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Up to 5 Workflow automations</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Standard email alerts (Resend)</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Custom field configuration</span></li>
                </ul>
              </div>
              <a
                href="https://growphil.vercel.app/register?plan=starter"
                className="w-full text-center py-3 rounded-xl border border-border bg-card-secondary hover:bg-hover font-semibold text-xs text-text-primary transition-premium"
              >
                Choose Starter Plan
              </a>
            </div>

            {/* Pro Plan Card - Highlighted */}
            <div className="bg-card border-2 border-primary p-8 rounded-3xl text-left flex flex-col justify-between relative shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                MOST POPULAR
              </div>
              <div>
                <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Professional (Pro)</h4>
                <div className="flex items-baseline gap-1 mb-4 font-display">
                  <span className="text-3xl font-black text-text-primary">
                    {billingCycle === "monthly" ? "₹5,999" : "₹4,799"}
                  </span>
                  <span className="text-text-secondary text-xs">/ month</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-6">
                  For growing agencies seeking unlimited scale, priority support, and multi-user team hierarchy.
                </p>
                <div className="h-px bg-border my-6" />
                <ul className="flex flex-col gap-3 text-xs mb-8">
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span className="font-bold">Unlimited Client profiles</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Unlimited custom automations</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Advanced WhatsApp notifications</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span>Detailed Sync Logs & Audit histories</span></li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-success shrink-0" /> <span className="font-bold">Priority 24/7 Slack Support</span></li>
                </ul>
              </div>
              <a
                href="https://growphil.vercel.app/register?plan=pro"
                className="w-full text-center py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold text-xs transition-premium shadow-md shadow-primary/20"
              >
                Choose Pro Plan
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 12: TESTIMONIALS --- */}
      <section className="py-20 md:py-28 bg-card-secondary/35 border-y border-border relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">TESTIMONIALS</span>
          <h2 className="text-3xl md:text-4xl font-display font-black text-text-primary tracking-tight mb-16">
            Loved By Marketing Agencies
          </h2>

          {/* Testimonial slider view */}
          <div className="relative bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm min-h-[220px] text-left">
            
            {/* Quote details */}
            <div className="flex items-center gap-1.5 mb-6 text-amber-500">
              {[...Array(TESTIMONIALS[testimonialIndex].rating)].map((_, i) => (
                <Star key={i} size={16} className="fill-current" />
              ))}
            </div>

            <p className="text-sm md:text-base text-text-primary leading-relaxed mb-8 italic">
              "{TESTIMONIALS[testimonialIndex].quote}"
            </p>

            <div className="flex items-center justify-between border-t border-border/60 pt-6">
              <div className="flex items-center gap-4">
                <img
                  src={TESTIMONIALS[testimonialIndex].image}
                  alt={TESTIMONIALS[testimonialIndex].name}
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
                <div>
                  <span className="block font-bold text-text-primary text-sm font-display">
                    {TESTIMONIALS[testimonialIndex].name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {TESTIMONIALS[testimonialIndex].role} at {TESTIMONIALS[testimonialIndex].company}
                  </span>
                </div>
              </div>

              {/* Slider Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevTestimonial}
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-hover flex items-center justify-center text-text-secondary transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ArrowRight size={14} className="rotate-180" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-hover flex items-center justify-center text-text-secondary transition-colors"
                  aria-label="Next testimonial"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- SECTION 13: FAQ ACCORDION --- */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary tracking-widest uppercase mb-3 block">COMMON ANSWERS</span>
            <h2 className="text-3xl md:text-4xl font-display font-black text-text-primary tracking-tight mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-text-secondary text-xs">
              Everything you need to know about GrowPhil plans, sync options, and setups.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFAQIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-2xl overflow-hidden transition-premium"
                >
                  <button
                    onClick={() => setOpenFAQIndex(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-sm text-text-primary font-display"
                  >
                    <span>{faq.question}</span>
                    <div className={`p-1.5 rounded-lg border border-border/80 text-text-secondary transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      <ChevronDown size={14} />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-6 text-xs text-text-secondary leading-relaxed border-t border-border/40 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 14: FINAL CTA --- */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-cyan-500 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 text-white">
          <span className="text-xs font-bold tracking-widest uppercase mb-4 bg-white/10 border border-white/20 px-3 py-1 rounded-full inline-block">
            BOOST AGENCY PERFORMANCE
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight mb-6 leading-tight">
            Ready To Convert Leads In Minutes?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-10 text-sm md:text-base leading-relaxed">
            Register Apex, Delhi Solar, or real estate client workspaces today. Ingest prospects instantly, map custom attributes, and close deals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <a
              href="#pricing"
              className="w-full sm:w-auto bg-white text-primary hover:bg-blue-50 font-bold px-8 py-4 rounded-xl text-base shadow-lg transition-premium hover:scale-[1.02]"
            >
              Start 45-Day Trial Free
            </a>
            <a
              href="https://calendly.com/growphil"
              className="w-full sm:w-auto bg-transparent border border-white/40 hover:bg-white/10 font-bold px-8 py-4 rounded-xl text-base transition-premium"
            >
              Book 1:1 Live Demo
            </a>
          </div>

          <span className="block text-[11px] text-blue-100 mt-6 font-medium">
            45 Days Trial. Full Professional Modules. No credit card required.
          </span>
        </div>
      </section>

      {/* --- SECTION 15: FOOTER --- */}
      <footer className="bg-card border-t border-border pt-16 pb-12 relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-4 flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">G</div>
              <span className="font-display font-bold text-base text-text-primary">GrowPhil CRM</span>
            </div>
            <p className="text-text-secondary leading-relaxed max-w-xs">
              Automated multi-tenant CRM for digital marketing agencies, capturing Google Sheets mapping & Facebook ads webhook streams.
            </p>
            <div className="flex items-center gap-3 mt-2 text-text-secondary">
              {/* Dummy Social Links */}
              <span className="p-2 border border-border rounded-lg bg-card-secondary hover:text-text-primary transition-colors cursor-pointer"><Facebook size={14} /></span>
              <span className="p-2 border border-border rounded-lg bg-card-secondary hover:text-text-primary transition-colors cursor-pointer"><MessageSquare size={14} /></span>
              <span className="p-2 border border-border rounded-lg bg-card-secondary hover:text-text-primary transition-colors cursor-pointer"><Globe size={14} /></span>
            </div>
          </div>

          {/* Links Col 1 */}
          <div className="md:col-span-2 text-left">
            <h5 className="font-bold text-text-primary uppercase mb-4 tracking-wider">Features</h5>
            <ul className="flex flex-col gap-2.5 text-text-secondary">
              <li><a href="#features" className="hover:text-text-primary">Lead Ingestion</a></li>
              <li><a href="#features" className="hover:text-text-primary">Sheets Sync Mapping</a></li>
              <li><a href="#features" className="hover:text-text-primary">Meta Integrations</a></li>
              <li><a href="#features" className="hover:text-text-primary">Task Pipelines</a></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="md:col-span-2 text-left">
            <h5 className="font-bold text-text-primary uppercase mb-4 tracking-wider">Company</h5>
            <ul className="flex flex-col gap-2.5 text-text-secondary">
              <li><a href="#" className="hover:text-text-primary">About Us</a></li>
              <li><a href="#pricing" className="hover:text-text-primary">Pricing Plans</a></li>
              <li><a href="#" className="hover:text-text-primary">API Documentation</a></li>
              <li><a href="#" className="hover:text-text-primary">Platform Support</a></li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="md:col-span-4 text-left">
            <h5 className="font-bold text-text-primary uppercase mb-4 tracking-wider">Stay Updated</h5>
            <p className="text-text-secondary mb-4">
              Receive tips on agency optimization and lead conversion metrics.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <input
                type="email"
                placeholder="Enter work email"
                className="flex-1 bg-card-secondary border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="bg-primary hover:bg-blue-600 text-white rounded-xl px-4 py-2.5 font-bold transition-colors"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-secondary font-medium">
          <span>© 2026 GrowPhil CRM. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-text-primary">Terms of Service</a>
            <a href="#" className="hover:text-text-primary">Cookies Settings</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
