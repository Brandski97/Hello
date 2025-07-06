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
  Palette,
  Download,
  Upload,
  HelpCircle,
  Mail,
  Key,
  Edit,
  FolderOpen,
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
import { supabase } from "@/lib/supabase";
import { useEncryption } from "@/contexts/EncryptionContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CalendarView from "./calendar/CalendarView";
import NotesSection from "./notes/NotesSection";
import TaskManager from "./tasks/TaskManager";
import ProjectsSection from "./projects/ProjectsSection";
import EncryptionSetup from "./auth/EncryptionSetup";

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
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [encryptionDialogOpen, setEncryptionDialogOpen] = useState(false);
  const [encryptionSetupOpen, setEncryptionSetupOpen] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [accountUpdateStatus, setAccountUpdateStatus] = useState<string | null>(
    null,
  );
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const {
    hasValidPassphrase,
    isEncryptionEnabled,
    setEncryptionPassphrase,
    clearEncryptionPassphrase,
  } = useEncryption();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
  } = useNotifications();

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

  const handleAccountSettings = () => {
    setAccountForm({
      username: user?.email?.split("@")[0] || "",
      email: user?.email || "",
      password: "",
    });
    setAccountDialogOpen(true);
  };

  const handleSaveAccountSettings = async () => {
    try {
      setAccountUpdateStatus(null);

      // Update email if changed
      if (accountForm.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: accountForm.email,
        });
        if (emailError) throw emailError;
      }

      // Update password if provided
      if (accountForm.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: accountForm.password,
        });
        if (passwordError) throw passwordError;
      }

      // Update user metadata for username
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username: accountForm.username },
      });
      if (metadataError) throw metadataError;

      setAccountUpdateStatus("Account settings updated successfully!");

      // Add notification for account update
      addNotification({
        type: "account",
        action: "updated",
        title: "Account Updated",
        description: "Your account settings have been updated successfully",
      });

      // Clear password field after successful update
      setAccountForm((prev) => ({ ...prev, password: "" }));

      setTimeout(() => {
        setAccountDialogOpen(false);
        setAccountUpdateStatus(null);
      }, 2000);
    } catch (error: any) {
      console.error("Error updating account:", error);
      setAccountUpdateStatus(`Error: ${error.message}`);
    }
  };

  const handleEncryptionSettings = () => {
    setEncryptionDialogOpen(true);
  };

  const handleToggleEncryption = () => {
    if (hasValidPassphrase) {
      clearEncryptionPassphrase();
      addNotification({
        type: "encryption",
        action: "disabled",
        title: "Encryption Disabled",
        description: "Your data will no longer be encrypted",
      });
      alert(
        "Encryption has been disabled. Your data will no longer be encrypted.",
      );
      setEncryptionDialogOpen(false);
    } else {
      // Show the proper encryption setup dialog
      setEncryptionDialogOpen(false);
      setEncryptionSetupOpen(true);
    }
  };

  const handleEncryptionSetupComplete = () => {
    setEncryptionSetupOpen(false);
    addNotification({
      type: "encryption",
      action: "enabled",
      title: "Encryption Enabled",
      description: "Your data is now encrypted client-side",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileTextIcon className="h-4 w-4 text-blue-500" />;
      case "task":
        return <CheckSquareIcon className="h-4 w-4 text-green-500" />;
      case "event":
        return <CalendarIcon className="h-4 w-4 text-purple-500" />;
      case "account":
        return <User className="h-4 w-4 text-orange-500" />;
      case "encryption":
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <BellIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "created":
        return "created";
      case "updated":
        return "updated";
      case "deleted":
        return "deleted";
      case "completed":
        return "completed";
      case "enabled":
        return "enabled";
      case "disabled":
        return "disabled";
      default:
        return action;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
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
            variant={activeView === "projects" ? "default" : "ghost"}
            className="w-full justify-start h-12 text-left font-medium transition-all duration-200 hover:bg-accent/50"
            onClick={() => setActiveView("projects")}
          >
            <FolderOpen className="mr-3 h-5 w-5" />
            Projects
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
              <DropdownMenuItem onClick={handleAccountSettings}>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>

              {/* Encryption Settings */}
              <DropdownMenuItem onClick={handleEncryptionSettings}>
                <Shield className="mr-2 h-4 w-4" />
                Encryption Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  const dataToExport = {
                    timestamp: new Date().toISOString(),
                    user: user?.email,
                    note: "This is a demo export. Full export functionality coming soon!",
                  };
                  const blob = new Blob(
                    [JSON.stringify(dataToExport, null, 2)],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "securespace-export.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      alert(
                        `Selected file: ${file.name}. Import functionality coming soon!`,
                      );
                    }
                  };
                  input.click();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Help & Support */}
              <DropdownMenuItem
                onClick={() => {
                  window.open(
                    "mailto:support@securespace.app?subject=Help Request",
                    "_blank",
                  );
                }}
              >
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
                  <DropdownMenuItem onClick={() => setActiveView("projects")}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Create Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 border-border hover:bg-accent/50 relative"
                  >
                    <BellIcon className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-medium">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 max-h-96 overflow-y-auto"
                >
                  <div className="flex items-center justify-between p-3 border-b border-border">
                    <DropdownMenuLabel className="font-semibold text-foreground p-0">
                      Recent Activity
                    </DropdownMenuLabel>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={clearNotifications}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No recent activity
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors ${
                            !notification.read ? "bg-primary/5" : ""
                          }`}
                          onClick={() => {
                            if (!notification.read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              {notification.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {notification.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {notifications.length > 10 && (
                    <div className="p-2 text-center border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Showing 10 of {notifications.length} notifications
                      </p>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
            {activeView === "projects" && <ProjectsSection />}
            {activeView === "ai" && <AIAssistant />}
          </div>
        </main>
      </div>

      {/* Account Settings Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {accountUpdateStatus && (
              <Alert
                variant={
                  accountUpdateStatus.includes("Error")
                    ? "destructive"
                    : "default"
                }
              >
                <AlertDescription>{accountUpdateStatus}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={accountForm.username}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, username: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">New Password (optional)</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={accountForm.password}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, password: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAccountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAccountSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encryption Settings Dialog */}
      <Dialog
        open={encryptionDialogOpen}
        onOpenChange={setEncryptionDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Encryption Settings
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {hasValidPassphrase ? (
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {hasValidPassphrase
                        ? "Encryption Enabled"
                        : "Encryption Disabled"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hasValidPassphrase
                        ? "Your data is encrypted client-side"
                        : "Your data is stored without encryption"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={hasValidPassphrase ? "destructive" : "default"}
                  onClick={handleToggleEncryption}
                >
                  {hasValidPassphrase ? "Disable" : "Enable"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Encryption is performed entirely in your browser</p>
                <p>• Your encryption key never leaves your device</p>
                <p>
                  • If you lose your passphrase, your data cannot be recovered
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEncryptionDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encryption Setup Dialog */}
      <EncryptionSetup
        isOpen={encryptionSetupOpen}
        onClose={() => setEncryptionSetupOpen(false)}
        onComplete={handleEncryptionSetupComplete}
      />
    </div>
  );
}
