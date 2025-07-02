import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalendarIcon,
  NotebookPen,
  CheckSquare,
  BrainCircuit,
  Search,
  Bell,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
}

const SidebarItem = ({ icon, label, path, active }: SidebarItemProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={path}>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={`w-full justify-start mb-1 ${active ? "bg-secondary" : ""}`}
            >
              <div className="flex items-center">
                {icon}
                <span className="ml-2">{label}</span>
              </div>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Determine active section based on current path
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card p-4 flex flex-col">
        <div className="flex items-center mb-6">
          <h1 className="text-xl font-bold">Productivity</h1>
        </div>

        <div className="mb-4">
          <Button variant="outline" className="w-full justify-start">
            <Plus className="h-4 w-4 mr-2" />
            New Item
          </Button>
        </div>

        <div className="space-y-1">
          <SidebarItem
            icon={<CalendarIcon className="h-5 w-5" />}
            label="Calendar"
            path="/calendar"
            active={isActive("/calendar")}
          />
          <SidebarItem
            icon={<NotebookPen className="h-5 w-5" />}
            label="Notes"
            path="/notes"
            active={isActive("/notes")}
          />
          <SidebarItem
            icon={<CheckSquare className="h-5 w-5" />}
            label="Tasks"
            path="/tasks"
            active={isActive("/tasks")}
          />
          <SidebarItem
            icon={<BrainCircuit className="h-5 w-5" />}
            label="AI Assistant"
            path="/assistant"
            active={isActive("/assistant")}
          />
        </div>

        <div className="mt-auto">
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=user123"
                  alt="User"
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-muted-foreground">
                  user@example.com
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-6">
          <div className="flex items-center w-1/3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Log out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
