import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  FileText,
  CheckSquare,
  Target,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Clock,
  TrendingUp,
  Archive,
  Play,
  Pause,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/contexts/EncryptionContext";
import { useNotifications } from "@/contexts/NotificationsContext";

type Project = {
  id: string;
  title: string;
  description: string;
  color: string;
  status: "active" | "completed" | "archived";
  start_date: string | null;
  end_date: string | null;
  user_id: string;
  encrypted?: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
  title_encrypted?: boolean;
  title_encryption_iv?: string;
  title_encryption_salt?: string;
  created_at: string;
  updated_at: string;
};

type ProjectGoal = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  completed: boolean;
  due_date: string | null;
  user_id: string;
  encrypted?: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
  title_encrypted?: boolean;
  title_encryption_iv?: string;
  title_encryption_salt?: string;
  created_at: string;
  updated_at: string;
};

type ProjectStats = {
  tasks: number;
  completedTasks: number;
  notes: number;
  events: number;
  goals: number;
  completedGoals: number;
};

const ProjectsSection = () => {
  const { user } = useAuth();
  const { encryptContent, decryptContent, hasValidPassphrase } =
    useEncryption();
  const { addNotification } = useNotifications();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectGoals, setProjectGoals] = useState<ProjectGoal[]>([]);
  const [projectStats, setProjectStats] = useState<
    Record<string, ProjectStats>
  >({});
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    description: "",
    color: "bg-blue-500",
    status: "active",
    start_date: null,
    end_date: null,
  });

  const [newGoal, setNewGoal] = useState<Partial<ProjectGoal>>({
    title: "",
    description: "",
    target_value: 0,
    current_value: 0,
    unit: "",
    due_date: null,
  });

  const [datePickerOpen, setDatePickerOpen] = useState<{
    start: boolean;
    end: boolean;
    goal: boolean;
  }>({ start: false, end: false, goal: false });

  const projectColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectGoals(selectedProject.id);
      fetchProjectStats(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Decrypt projects if encryption is enabled
      const decryptedProjects = await Promise.all(
        (data || []).map(async (project) => {
          let decryptedProject = { ...project };

          // Decrypt description if encrypted
          if (
            project.encrypted &&
            hasValidPassphrase &&
            project.encryption_iv &&
            project.encryption_salt
          ) {
            try {
              const decryptedDescription = await decryptContent(
                project.description,
                project.encryption_iv,
                project.encryption_salt,
              );
              decryptedProject.description =
                decryptedDescription || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt project description:", error);
              decryptedProject.description = "[Encrypted - Cannot decrypt]";
            }
          }

          // Decrypt title if encrypted
          if (
            project.title_encrypted &&
            hasValidPassphrase &&
            project.title_encryption_iv &&
            project.title_encryption_salt
          ) {
            try {
              const decryptedTitle = await decryptContent(
                project.title,
                project.title_encryption_iv,
                project.title_encryption_salt,
              );
              decryptedProject.title = decryptedTitle || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt project title:", error);
              decryptedProject.title = "[Encrypted - Cannot decrypt]";
            }
          }

          return decryptedProject;
        }),
      );

      setProjects(decryptedProjects);
      if (decryptedProjects.length > 0 && !selectedProject) {
        setSelectedProject(decryptedProjects[0]);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectGoals = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_goals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Decrypt goals if encryption is enabled
      const decryptedGoals = await Promise.all(
        (data || []).map(async (goal) => {
          let decryptedGoal = { ...goal };

          // Decrypt description if encrypted
          if (
            goal.encrypted &&
            hasValidPassphrase &&
            goal.encryption_iv &&
            goal.encryption_salt
          ) {
            try {
              const decryptedDescription = await decryptContent(
                goal.description,
                goal.encryption_iv,
                goal.encryption_salt,
              );
              decryptedGoal.description =
                decryptedDescription || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt goal description:", error);
              decryptedGoal.description = "[Encrypted - Cannot decrypt]";
            }
          }

          // Decrypt title if encrypted
          if (
            goal.title_encrypted &&
            hasValidPassphrase &&
            goal.title_encryption_iv &&
            goal.title_encryption_salt
          ) {
            try {
              const decryptedTitle = await decryptContent(
                goal.title,
                goal.title_encryption_iv,
                goal.title_encryption_salt,
              );
              decryptedGoal.title = decryptedTitle || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt goal title:", error);
              decryptedGoal.title = "[Encrypted - Cannot decrypt]";
            }
          }

          return decryptedGoal;
        }),
      );

      setProjectGoals(decryptedGoals);
    } catch (error) {
      console.error("Error fetching project goals:", error);
    }
  };

  const fetchProjectStats = async (projectId: string) => {
    try {
      // Fetch tasks count
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      const { count: completedTasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("completed", true);

      // Fetch notes count
      const { count: notesCount } = await supabase
        .from("notes")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Fetch events count
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Fetch goals count
      const { count: goalsCount } = await supabase
        .from("project_goals")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      const { count: completedGoalsCount } = await supabase
        .from("project_goals")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("completed", true);

      setProjectStats((prev) => ({
        ...prev,
        [projectId]: {
          tasks: tasksCount || 0,
          completedTasks: completedTasksCount || 0,
          notes: notesCount || 0,
          events: eventsCount || 0,
          goals: goalsCount || 0,
          completedGoals: completedGoalsCount || 0,
        },
      }));
    } catch (error) {
      console.error("Error fetching project stats:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProject.title?.trim()) return;

    try {
      let projectData: any = {
        title: newProject.title,
        description: newProject.description || "",
        color: newProject.color || "bg-blue-500",
        status: newProject.status || "active",
        start_date: newProject.start_date,
        end_date: newProject.end_date,
        user_id: user.id,
        encrypted: false,
        title_encrypted: false,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && newProject.description) {
        const encryptionResult = await encryptContent(newProject.description);
        if (encryptionResult) {
          projectData = {
            ...projectData,
            description: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      // Encrypt title if encryption is enabled
      if (hasValidPassphrase && newProject.title) {
        const titleEncryptionResult = await encryptContent(newProject.title);
        if (titleEncryptionResult) {
          projectData = {
            ...projectData,
            title: titleEncryptionResult.encryptedData,
            title_encrypted: true,
            title_encryption_iv: titleEncryptionResult.iv,
            title_encryption_salt: titleEncryptionResult.salt,
          };
        }
      }

      const { data, error } = await supabase
        .from("projects")
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayProject = {
        ...data,
        description: newProject.description || "",
        title: newProject.title,
      };

      setProjects([displayProject, ...projects]);
      setSelectedProject(displayProject);

      // Add notification
      addNotification({
        type: "note", // Using note type for projects
        action: "created",
        title: "Project Created",
        description: `"${newProject.title}" project has been created`,
      });

      setNewProject({
        title: "",
        description: "",
        color: "bg-blue-500",
        status: "active",
        start_date: null,
        end_date: null,
      });
      setIsNewProjectDialogOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleCreateGoal = async () => {
    if (!user || !selectedProject || !newGoal.title?.trim()) return;

    try {
      let goalData: any = {
        project_id: selectedProject.id,
        title: newGoal.title,
        description: newGoal.description || "",
        target_value: newGoal.target_value || 0,
        current_value: newGoal.current_value || 0,
        unit: newGoal.unit || "",
        due_date: newGoal.due_date,
        user_id: user.id,
        encrypted: false,
        title_encrypted: false,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && newGoal.description) {
        const encryptionResult = await encryptContent(newGoal.description);
        if (encryptionResult) {
          goalData = {
            ...goalData,
            description: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      // Encrypt title if encryption is enabled
      if (hasValidPassphrase && newGoal.title) {
        const titleEncryptionResult = await encryptContent(newGoal.title);
        if (titleEncryptionResult) {
          goalData = {
            ...goalData,
            title: titleEncryptionResult.encryptedData,
            title_encrypted: true,
            title_encryption_iv: titleEncryptionResult.iv,
            title_encryption_salt: titleEncryptionResult.salt,
          };
        }
      }

      const { data, error } = await supabase
        .from("project_goals")
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayGoal = {
        ...data,
        description: newGoal.description || "",
        title: newGoal.title,
      };

      setProjectGoals([displayGoal, ...projectGoals]);
      fetchProjectStats(selectedProject.id);

      // Add notification
      addNotification({
        type: "task", // Using task type for goals
        action: "created",
        title: "Goal Created",
        description: `"${newGoal.title}" goal has been added to ${selectedProject.title}`,
      });

      setNewGoal({
        title: "",
        description: "",
        target_value: 0,
        current_value: 0,
        unit: "",
        due_date: null,
      });
      setIsNewGoalDialogOpen(false);
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleUpdateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from("project_goals")
        .update({ current_value: newValue })
        .eq("id", goalId);

      if (error) throw error;

      setProjectGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId ? { ...goal, current_value: newValue } : goal,
        ),
      );
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      const deletedProject = projects.find((p) => p.id === projectId);
      const updatedProjects = projects.filter((p) => p.id !== projectId);
      setProjects(updatedProjects);

      if (selectedProject?.id === projectId) {
        setSelectedProject(
          updatedProjects.length > 0 ? updatedProjects[0] : null,
        );
      }

      // Add notification
      if (deletedProject) {
        addNotification({
          type: "note",
          action: "deleted",
          title: "Project Deleted",
          description: `"${deletedProject.title}" project has been deleted`,
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return project.status === "active";
    if (activeTab === "completed") return project.status === "completed";
    if (activeTab === "archived") return project.status === "archived";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="bg-background h-full flex">
      {/* Projects Sidebar */}
      <div className="w-80 border-r border-border p-6 flex flex-col bg-card/30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Projects
              </h2>
              <p className="text-xs text-muted-foreground">
                Organize your work
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNewProjectDialogOpen(true)}
            className="hover:bg-accent/50"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-4 bg-muted/30 border border-border">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Done
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No projects found. Create your first project to get started.
            </div>
          ) : (
            filteredProjects.map((project) => {
              const stats = projectStats[project.id] || {
                tasks: 0,
                completedTasks: 0,
                notes: 0,
                events: 0,
                goals: 0,
                completedGoals: 0,
              };

              return (
                <Card
                  key={project.id}
                  className={`cursor-pointer hover:bg-accent/50 transition-colors duration-200 border-border ${
                    selectedProject?.id === project.id
                      ? "bg-accent/30 border-primary/30"
                      : ""
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${project.color}`}
                        ></div>
                        <h3 className="font-medium truncate">
                          {project.title}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewProject(project);
                              setIsEditProjectDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Badge
                      variant="outline"
                      className={`${getStatusColor(project.status)} mb-3`}
                    >
                      {project.status}
                    </Badge>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" />
                        <span>
                          {stats.completedTasks}/{stats.tasks} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{stats.notes} notes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{stats.events} events</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>
                          {stats.completedGoals}/{stats.goals} goals
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Project Header */}
            <div className="p-6 border-b border-border bg-card/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-4 h-4 rounded-full ${selectedProject.color}`}
                  ></div>
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                      {selectedProject.title}
                    </h1>
                    <p className="text-muted-foreground">
                      {selectedProject.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedProject.status)}
                  >
                    {selectedProject.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewGoalDialogOpen(true)}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    Add Goal
                  </Button>
                </div>
              </div>

              {/* Project Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: "Tasks",
                    value: `${projectStats[selectedProject.id]?.completedTasks || 0}/${projectStats[selectedProject.id]?.tasks || 0}`,
                    icon: CheckSquare,
                    color: "text-green-600",
                  },
                  {
                    label: "Notes",
                    value: projectStats[selectedProject.id]?.notes || 0,
                    icon: FileText,
                    color: "text-blue-600",
                  },
                  {
                    label: "Events",
                    value: projectStats[selectedProject.id]?.events || 0,
                    icon: Calendar,
                    color: "text-purple-600",
                  },
                  {
                    label: "Goals",
                    value: `${projectStats[selectedProject.id]?.completedGoals || 0}/${projectStats[selectedProject.id]?.goals || 0}`,
                    icon: Target,
                    color: "text-orange-600",
                  },
                ].map((stat, index) => (
                  <Card key={index} className="bg-card border-border">
                    <CardContent className="p-4 text-center">
                      <stat.icon
                        className={`h-5 w-5 mx-auto mb-2 ${stat.color}`}
                      />
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Project Goals */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Project Goals
                </h2>
                {projectGoals.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No goals set for this project yet. Add your first goal to
                      track progress.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projectGoals.map((goal) => {
                      const progress = getProgressPercentage(
                        goal.current_value,
                        goal.target_value,
                      );
                      return (
                        <Card key={goal.id} className="bg-card border-border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-medium text-foreground">
                                  {goal.title}
                                </h3>
                                {goal.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {goal.description}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={goal.completed ? "default" : "outline"}
                                className={
                                  goal.completed
                                    ? "bg-green-100 text-green-800"
                                    : ""
                                }
                              >
                                {goal.completed ? "Completed" : "In Progress"}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Progress: {goal.current_value} /{" "}
                                  {goal.target_value} {goal.unit}
                                </span>
                                <span className="font-medium">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <Progress value={progress} className="h-2" />

                              {goal.due_date && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    Due:{" "}
                                    {format(
                                      new Date(goal.due_date),
                                      "MMM dd, yyyy",
                                    )}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 mt-3">
                                <Input
                                  type="number"
                                  placeholder="Update progress"
                                  className="w-32 h-8"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      const value = parseFloat(
                                        (e.target as HTMLInputElement).value,
                                      );
                                      if (!isNaN(value)) {
                                        handleUpdateGoalProgress(
                                          goal.id,
                                          value,
                                        );
                                        (e.target as HTMLInputElement).value =
                                          "";
                                      }
                                    }
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {goal.unit}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {loading ? "Loading..." : "Select a project to view details"}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <Dialog
        open={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="project-title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="project-title"
                placeholder="Project title"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="project-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="project-description"
                placeholder="Project description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {projectColors.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full ${color} border-2 ${
                        newProject.color === color
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      onClick={() => setNewProject({ ...newProject, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newProject.status}
                  onValueChange={(value) =>
                    setNewProject({
                      ...newProject,
                      status: value as "active" | "completed" | "archived",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover
                  open={datePickerOpen.start}
                  onOpenChange={(open) =>
                    setDatePickerOpen((prev) => ({ ...prev, start: open }))
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newProject.start_date ? (
                        format(new Date(newProject.start_date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newProject.start_date
                          ? new Date(newProject.start_date)
                          : undefined
                      }
                      onSelect={(date) => {
                        setNewProject({
                          ...newProject,
                          start_date: date ? date.toISOString() : null,
                        });
                        setDatePickerOpen((prev) => ({
                          ...prev,
                          start: false,
                        }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover
                  open={datePickerOpen.end}
                  onOpenChange={(open) =>
                    setDatePickerOpen((prev) => ({ ...prev, end: open }))
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newProject.end_date ? (
                        format(new Date(newProject.end_date), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newProject.end_date
                          ? new Date(newProject.end_date)
                          : undefined
                      }
                      onSelect={(date) => {
                        setNewProject({
                          ...newProject,
                          end_date: date ? date.toISOString() : null,
                        });
                        setDatePickerOpen((prev) => ({ ...prev, end: false }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProject.title?.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Goal Dialog */}
      <Dialog open={isNewGoalDialogOpen} onOpenChange={setIsNewGoalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="goal-title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="goal-title"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="goal-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="goal-description"
                placeholder="Goal description"
                value={newGoal.description}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Target Value</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newGoal.target_value}
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      target_value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Current Value</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newGoal.current_value}
                  onChange={(e) =>
                    setNewGoal({
                      ...newGoal,
                      current_value: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Unit</label>
                <Input
                  placeholder="hours, tasks, etc."
                  value={newGoal.unit}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, unit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Due Date (Optional)</label>
              <Popover
                open={datePickerOpen.goal}
                onOpenChange={(open) =>
                  setDatePickerOpen((prev) => ({ ...prev, goal: open }))
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {newGoal.due_date ? (
                      format(new Date(newGoal.due_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={
                      newGoal.due_date ? new Date(newGoal.due_date) : undefined
                    }
                    onSelect={(date) => {
                      setNewGoal({
                        ...newGoal,
                        due_date: date ? date.toISOString() : null,
                      });
                      setDatePickerOpen((prev) => ({ ...prev, goal: false }));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewGoalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGoal}
              disabled={!newGoal.title?.trim()}
            >
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsSection;
