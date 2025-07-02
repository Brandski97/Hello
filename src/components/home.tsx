import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case "summary":
        return <FileTextIcon className="h-5 w-5 text-green-500" />;
      case "insight":
      default:
        return <BrainCircuitIcon className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-full bg-muted p-2">{getIcon()}</div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AIAssistant = () => {
  const insights: AIInsightProps[] = [
    {
      title: "Schedule Optimization",
      description:
        "You have 3 meetings scheduled back-to-back tomorrow. Consider adding 15-minute breaks between them.",
      type: "suggestion",
    },
    {
      title: "Meeting Summary: Project Kickoff",
      description:
        "I've prepared a summary of your project kickoff meeting from yesterday. Would you like to save it to your notes?",
      type: "summary",
    },
    {
      title: "Productivity Pattern",
      description:
        "You complete most of your tasks between 10am-12pm. Consider scheduling focused work during this time.",
      type: "insight",
    },
  ];

  return (
    <div className="h-full bg-background p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">AI Assistant</h2>
        <p className="text-muted-foreground">
          Your personalized productivity insights and suggestions
        </p>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <AIInsight key={index} {...insight} />
        ))}
      </div>

      <div className="mt-6">
        <Button className="w-full">
          <BrainCircuitIcon className="mr-2 h-4 w-4" />
          Generate More Insights
        </Button>
      </div>
    </div>
  );
};

export default function Home() {
  const [activeView, setActiveView] = useState("calendar");
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="rounded-md bg-primary p-1">
            <CalendarIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Productivity</h1>
        </div>

        <nav className="space-y-2">
          <Button
            variant={activeView === "calendar" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("calendar")}
          >
            <CalendarIcon className="mr-2 h-5 w-5" />
            Calendar
          </Button>
          <Button
            variant={activeView === "notes" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("notes")}
          >
            <FileTextIcon className="mr-2 h-5 w-5" />
            Notes
          </Button>
          <Button
            variant={activeView === "tasks" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("tasks")}
          >
            <CheckSquareIcon className="mr-2 h-5 w-5" />
            Tasks
          </Button>
          <Button
            variant={activeView === "ai" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("ai")}
          >
            <BrainCircuitIcon className="mr-2 h-5 w-5" />
            AI Assistant
          </Button>
        </nav>

        <div className="mt-auto pt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <BellIcon className="h-4 w-4" />
              </Button>
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || "user"}`}
                  alt="User"
                />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeView === "calendar" && <CalendarView />}
          {activeView === "notes" && <NotesSection />}
          {activeView === "tasks" && <TaskManager />}
          {activeView === "ai" && <AIAssistant />}
        </main>
      </div>
    </div>
  );
}
