import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarIcon,
  FileTextIcon,
  CheckSquareIcon,
  BrainCircuitIcon,
  SearchIcon,
  BellIcon,
  SettingsIcon,
  PlusIcon,
  LogOut,
  Shield,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  User,
  Lock,
  Palette,
  Database,
  Download,
  Upload,
  HelpCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/contexts/EncryptionContext";
import CalendarView from "./calendar/CalendarView";
import NotesSection from "./notes/NotesSection";
import TaskManager from "./tasks/TaskManager";

interface AIInsightProps {
  title: string;
  description: string;
  type: "suggestion" | "summary" | "insight";
}

const AIInsight = ({
  title,
  description,
  type = "insight",
}: AIInsightProps) => {
  const getIcon = () => {
    switch (type) {
      case "suggestion":
        return <CalendarIcon className="h-5 w-5 text-primary" />;
      case "summary":
        return <FileTextIcon className="h-5 w-5 text-primary" />;
      case "insight":
      default:
        return <BrainCircuitIcon className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className="mb-4 bg-card border-border hover:bg-card/80 transition-colors duration-200">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 rounded-lg bg-primary/10 p-3 border border-primary/20">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AIAssistant = () => {
  const insights: AIInsightProps[] = [
    {
      title: "Privacy-First Schedule Optimization",
      description:
        "Your local analysis suggests 3 meetings tomorrow are back-to-back. Consider adding 15-minute privacy breaks between them.",
      type: "suggestion",
    },
    {
      title: "Encrypted Meeting Summary",
      description:
        "I've prepared an encrypted summary of your project kickoff meeting. All data remains on your device. Save to encrypted notes?",
      type: "summary",
    },
    {
      title: "Local Productivity Pattern",
      description:
        "Your device-only analysis shows peak productivity between 10am-12pm. Consider scheduling focused work during this private time.",
      type: "insight",
    },
  ];

  return (
    <div className="h-full bg-background p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <BrainCircuitIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              Privacy-First AI Assistant
            </h2>
            <p className="text-muted-foreground">
              Local insights that never leave your device
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">
            All AI processing happens locally • No data sent to servers
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <AIInsight key={index} {...insight} />
        ))}
      </div>

      <div className="mt-8">
        <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
          <BrainCircuitIcon className="mr-2 h-4 w-4" />
          Generate More Local Insights
        </Button>
      </div>
    </div>
  );
};

export default function Home() {
  const [activeView, setActiveView] = useState("calendar");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");
  const { user, signOut } = useAuth();
  const { hasValidPassphrase, isEncryptionEnabled } = useEncryption();

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | "system"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to dark theme
      setTheme("dark");
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;

    if (newTheme === "system") {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.toggle("dark", systemPrefersDark);
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="rounded-lg bg-primary p-2 shadow-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SecureSpace</h1>
            <p className="text-xs text-muted-foreground">
              Privacy-First Workspace
            </p>
          </div>
        </div>

        <nav className="space-y-3">
          <Button
            variant={activeView === "calendar" ? "default" : "ghost"}
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:bg-accent/50"
            onClick={() => setActiveView("calendar")}
          >
            <CalendarIcon className="mr-3 h-5 w-5" />
            Calendar
          </Button>
          <Button
            variant={activeView === "notes" ? "default" : "ghost"}
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:bg-accent/50"
            onClick={() => setActiveView("notes")}
          >
            <FileTextIcon className="mr-3 h-5 w-5" />
            Notes
          </Button>
          <Button
            variant={activeView === "tasks" ? "default" : "ghost"}
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:bg-accent/50"
            onClick={() => setActiveView("tasks")}
          >
            <CheckSquareIcon className="mr-3 h-5 w-5" />
            Tasks
          </Button>
          <Button
            variant={activeView === "ai" ? "default" : "ghost"}
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:bg-accent/50"
            onClick={() => setActiveView("ai")}
          >
            <BrainCircuitIcon className="mr-3 h-5 w-5" />
            AI Assistant
          </Button>
        </nav>

        <div className="mt-auto pt-6 space-y-3">
          <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 text-sm">
              {hasValidPassphrase ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Encrypted</span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Not Encrypted</span>
                </>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start h-11 border-border hover:bg-accent/50"
              >
                <SettingsIcon className="mr-3 h-5 w-5" />
                Settings
                <ChevronDown className="ml-auto h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="w-64">
              <DropdownMenuLabel className="font-semibold text-foreground">
                Settings & Preferences
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Theme Settings */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                  <div className="ml-auto flex items-center">
                    {theme === "light" && <Sun className="h-3 w-3" />}
                    {theme === "dark" && <Moon className="h-3 w-3" />}
                    {theme === "system" && <Monitor className="h-3 w-3" />}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("light")}
                    className={theme === "light" ? "bg-accent" : ""}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("dark")}
                    className={theme === "dark" ? "bg-accent" : ""}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleThemeChange("system")}
                    className={theme === "system" ? "bg-accent" : ""}
                  >
                    <Monitor className="mr-2 h-4 w-4" />
                    System Default
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Account Settings */}
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>

              {/* Privacy & Security */}
              <DropdownMenuItem>
                <Lock className="mr-2 h-4 w-4" />
                Privacy & Security
              </DropdownMenuItem>

              {/* Encryption Settings */}
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Encryption Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Data Management */}
              <DropdownMenuItem>
                <Database className="mr-2 h-4 w-4" />
                Data Management
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Help & Support */}
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            className="w-full justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10 border-border"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your private workspace..."
                className="w-full rounded-lg border border-input bg-background/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-border hover:bg-accent/50"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setActiveView("tasks")}>
                    <CheckSquareIcon className="mr-2 h-4 w-4" />
                    Create Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveView("notes")}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Create Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveView("calendar")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Create Event
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-border hover:bg-accent/50 relative"
              >
                <BellIcon className="h-4 w-4" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
              </Button>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
                    alt="User"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium text-foreground">
                    {user?.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email || "Secure Session"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="h-full">
            {activeView === "calendar" && <CalendarView />}
            {activeView === "notes" && <NotesSection />}
            {activeView === "tasks" && <TaskManager />}
            {activeView === "ai" && <AIAssistant />}
          </div>
        </main>
      </div>
    </div>
  );
}
