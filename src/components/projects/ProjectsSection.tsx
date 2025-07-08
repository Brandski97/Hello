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
  ChevronDown,
  ChevronUp,
  X,
  Link,
  Zap,
  Star,
  ArrowRight,
  Grid3X3,
  List,
  Filter,
  Search,
  Sparkles,
  Network,
  Eye,
  EyeOff,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

type LinkedItem = {
  id: string;
  title: string;
  type: "task" | "note" | "event";
  completed?: boolean;
  priority?: string;
  due_date?: string;
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
  const [linkedItems, setLinkedItems] = useState<Record<string, LinkedItem[]>>(
    {},
  );
  const [goalLinkedItems, setGoalLinkedItems] = useState<
    Record<string, LinkedItem[]>
  >({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConnections, setShowConnections] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [selectedGoalForEdit, setSelectedGoalForEdit] =
    useState<ProjectGoal | null>(null);
  const [selectedGoalForLinking, setSelectedGoalForLinking] = useState<
    string | null
  >(null);

  // Available items for linking
  const [availableTasks, setAvailableTasks] = useState<LinkedItem[]>([]);
  const [availableNotes, setAvailableNotes] = useState<LinkedItem[]>([]);
  const [availableEvents, setAvailableEvents] = useState<LinkedItem[]>([]);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    title: "",
    description: "",
    color: "bg-gradient-to-br from-blue-500 to-purple-600",
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

  const projectGradients = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-teal-600",
    "bg-gradient-to-br from-purple-500 to-pink-600",
    "bg-gradient-to-br from-red-500 to-orange-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-indigo-500 to-blue-600",
    "bg-gradient-to-br from-pink-500 to-rose-600",
    "bg-gradient-to-br from-teal-500 to-cyan-600",
  ];

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchAllLinkedItems();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectGoals(selectedProject.id);
      fetchProjectStats(selectedProject.id);
      fetchProjectLinkedItems(selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (projectGoals.length > 0) {
      projectGoals.forEach((goal) => {
        fetchGoalLinkedItems(goal.id);
      });
    }
  }, [projectGoals]);

  const fetchAllLinkedItems = async () => {
    if (!user) return;

    try {
      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, due_date")
        .eq("user_id", user.id)
        .order("title", { ascending: true });

      if (tasksError) throw tasksError;
      setAvailableTasks(
        (tasks || []).map((task) => ({
          id: task.id,
          title: task.title,
          type: "task" as const,
          completed: task.completed,
          priority: task.priority,
          due_date: task.due_date,
        })),
      );

      // Fetch notes
      const { data: notes, error: notesError } = await supabase
        .from("notes")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("title", { ascending: true });

      if (notesError) throw notesError;
      setAvailableNotes(
        (notes || []).map((note) => ({
          id: note.id,
          title: note.title,
          type: "note" as const,
        })),
      );

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("user_id", user.id)
        .order("title", { ascending: true });

      if (eventsError) throw eventsError;
      setAvailableEvents(
        (events || []).map((event) => ({
          id: event.id,
          title: event.title,
          type: "event" as const,
          due_date: event.start_time,
        })),
      );
    } catch (error) {
      console.error("Error fetching linked items:", error);
    }
  };

  const fetchProjectLinkedItems = async (projectId: string) => {
    if (!user) return;

    try {
      const linkedItemsForProject: LinkedItem[] = [];

      // Fetch linked tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, due_date")
        .eq("project_id", projectId);

      if (tasks) {
        linkedItemsForProject.push(
          ...tasks.map((task) => ({
            id: task.id,
            title: task.title,
            type: "task" as const,
            completed: task.completed,
            priority: task.priority,
            due_date: task.due_date,
          })),
        );
      }

      // Fetch linked notes
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title")
        .eq("project_id", projectId);

      if (notes) {
        linkedItemsForProject.push(
          ...notes.map((note) => ({
            id: note.id,
            title: note.title,
            type: "note" as const,
          })),
        );
      }

      // Fetch linked events
      const { data: events } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("project_id", projectId);

      if (events) {
        linkedItemsForProject.push(
          ...events.map((event) => ({
            id: event.id,
            title: event.title,
            type: "event" as const,
            due_date: event.start_time,
          })),
        );
      }

      setLinkedItems((prev) => ({
        ...prev,
        [projectId]: linkedItemsForProject,
      }));
    } catch (error) {
      console.error("Error fetching project linked items:", error);
    }
  };

  const fetchGoalLinkedItems = async (goalId: string) => {
    if (!user) return;

    try {
      const linkedItemsForGoal: LinkedItem[] = [];

      // Fetch linked tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, due_date")
        .eq("linked_goal_id", goalId);

      if (tasks) {
        linkedItemsForGoal.push(
          ...tasks.map((task) => ({
            id: task.id,
            title: task.title,
            type: "task" as const,
            completed: task.completed,
            priority: task.priority,
            due_date: task.due_date,
          })),
        );
      }

      // Fetch linked notes
      const { data: notes } = await supabase
        .from("notes")
        .select("id, title")
        .eq("linked_goal_id", goalId);

      if (notes) {
        linkedItemsForGoal.push(
          ...notes.map((note) => ({
            id: note.id,
            title: note.title,
            type: "note" as const,
          })),
        );
      }

      // Fetch linked events
      const { data: events } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("linked_goal_id", goalId);

      if (events) {
        linkedItemsForGoal.push(
          ...events.map((event) => ({
            id: event.id,
            title: event.title,
            type: "event" as const,
            due_date: event.start_time,
          })),
        );
      }

      setGoalLinkedItems((prev) => ({
        ...prev,
        [goalId]: linkedItemsForGoal,
      }));
    } catch (error) {
      console.error("Error fetching goal linked items:", error);
    }
  };

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
        color:
          newProject.color || "bg-gradient-to-br from-blue-500 to-purple-600",
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
        type: "note",
        action: "created",
        title: "Project Created",
        description: `"${newProject.title}" project has been created`,
      });

      setNewProject({
        title: "",
        description: "",
        color: "bg-gradient-to-br from-blue-500 to-purple-600",
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
        type: "task",
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

  const handleLinkItemToProject = async (
    itemId: string,
    itemType: "task" | "note" | "event",
  ) => {
    if (!selectedProject) return;

    try {
      const updateData: any = { project_id: selectedProject.id };

      // If linking to a specific goal, also set the goal link
      if (selectedGoalForLinking) {
        updateData.linked_goal_id = selectedGoalForLinking;
      }

      const { error } = await supabase
        .from(
          itemType === "task"
            ? "tasks"
            : itemType === "note"
              ? "notes"
              : "events",
        )
        .update(updateData)
        .eq("id", itemId);

      if (error) throw error;

      // Refresh project linked items
      fetchProjectLinkedItems(selectedProject.id);
      fetchProjectStats(selectedProject.id);

      // If linking to a specific goal, refresh goal linked items
      if (selectedGoalForLinking) {
        fetchGoalLinkedItems(selectedGoalForLinking);
      }

      const targetName = selectedGoalForLinking
        ? `goal in ${selectedProject.title}`
        : selectedProject.title;

      addNotification({
        type: itemType,
        action: "updated",
        title: "Item Linked",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} has been linked to ${targetName}`,
      });
    } catch (error) {
      console.error(`Error linking ${itemType} to project:`, error);
    }
  };

  const handleUnlinkItemFromProject = async (
    itemId: string,
    itemType: "task" | "note" | "event",
  ) => {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from(
          itemType === "task"
            ? "tasks"
            : itemType === "note"
              ? "notes"
              : "events",
        )
        .update({ project_id: null })
        .eq("id", itemId);

      if (error) throw error;

      // Refresh project linked items
      fetchProjectLinkedItems(selectedProject.id);
      fetchProjectStats(selectedProject.id);

      addNotification({
        type: itemType,
        action: "updated",
        title: "Item Unlinked",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} has been unlinked from ${selectedProject.title}`,
      });
    } catch (error) {
      console.error(`Error unlinking ${itemType} from project:`, error);
    }
  };

  const handleUnlinkItemFromGoal = async (
    itemId: string,
    itemType: "task" | "note" | "event",
    goalId: string,
  ) => {
    try {
      const { error } = await supabase
        .from(
          itemType === "task"
            ? "tasks"
            : itemType === "note"
              ? "notes"
              : "events",
        )
        .update({ linked_goal_id: null })
        .eq("id", itemId);

      if (error) throw error;

      // Refresh goal linked items
      fetchGoalLinkedItems(goalId);

      // Also refresh project linked items if needed
      if (selectedProject) {
        fetchProjectLinkedItems(selectedProject.id);
      }

      addNotification({
        type: itemType,
        action: "updated",
        title: "Item Unlinked from Goal",
        description: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} has been unlinked from the goal`,
      });
    } catch (error) {
      console.error(`Error unlinking ${itemType} from goal:`, error);
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

  const handleEditProject = async () => {
    if (!user || !newProject.title?.trim() || !newProject.id) return;

    try {
      let projectData: any = {
        title: newProject.title,
        description: newProject.description || "",
        color:
          newProject.color || "bg-gradient-to-br from-blue-500 to-purple-600",
        status: newProject.status || "active",
        start_date: newProject.start_date,
        end_date: newProject.end_date,
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
        .update(projectData)
        .eq("id", newProject.id)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayProject = {
        ...data,
        description: newProject.description || "",
        title: newProject.title,
      };

      setProjects(
        projects.map((p) => (p.id === newProject.id ? displayProject : p)),
      );
      if (selectedProject?.id === newProject.id) {
        setSelectedProject(displayProject);
      }

      // Add notification
      addNotification({
        type: "note",
        action: "updated",
        title: "Project Updated",
        description: `"${newProject.title}" project has been updated`,
      });

      setNewProject({
        title: "",
        description: "",
        color: "bg-gradient-to-br from-blue-500 to-purple-600",
        status: "active",
        start_date: null,
        end_date: null,
      });
      setIsEditProjectDialogOpen(false);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };

  const handleEditGoal = async () => {
    if (!user || !selectedGoalForEdit || !selectedGoalForEdit.title?.trim())
      return;

    try {
      let goalData: any = {
        title: selectedGoalForEdit.title,
        description: selectedGoalForEdit.description || "",
        target_value: selectedGoalForEdit.target_value || 0,
        current_value: selectedGoalForEdit.current_value || 0,
        unit: selectedGoalForEdit.unit || "",
        due_date: selectedGoalForEdit.due_date,
        encrypted: false,
        title_encrypted: false,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && selectedGoalForEdit.description) {
        const encryptionResult = await encryptContent(
          selectedGoalForEdit.description,
        );
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
      if (hasValidPassphrase && selectedGoalForEdit.title) {
        const titleEncryptionResult = await encryptContent(
          selectedGoalForEdit.title,
        );
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
        .update(goalData)
        .eq("id", selectedGoalForEdit.id)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayGoal = {
        ...data,
        description: selectedGoalForEdit.description || "",
        title: selectedGoalForEdit.title,
      };

      setProjectGoals(
        projectGoals.map((g) =>
          g.id === selectedGoalForEdit.id ? displayGoal : g,
        ),
      );

      // Add notification
      addNotification({
        type: "task",
        action: "updated",
        title: "Goal Updated",
        description: `"${selectedGoalForEdit.title}" goal has been updated`,
      });

      setSelectedGoalForEdit(null);
      setIsEditGoalDialogOpen(false);
    } catch (error) {
      console.error("Error updating goal:", error);
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

  const handleNavigateToItem = (
    itemId: string,
    itemType: "task" | "note" | "event",
  ) => {
    // Navigate to the appropriate section based on item type
    const event = new CustomEvent("navigateToSection", {
      detail: {
        section:
          itemType === "task"
            ? "tasks"
            : itemType === "note"
              ? "notes"
              : "calendar",
        itemId,
      },
    });
    window.dispatchEvent(event);
  };

  const filteredProjects = projects.filter((project) => {
    const matchesTab = activeTab === "all" || project.status === activeTab;
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
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

  const getItemIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case "task":
        return "text-green-600 bg-green-100";
      case "note":
        return "text-blue-600 bg-blue-100";
      case "event":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-background h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Project Hub
              </h1>
              <p className="text-muted-foreground">
                Organize, track, and connect your work
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnections(!showConnections)}
              className={
                showConnections ? "bg-primary/10 border-primary/30" : ""
              }
            >
              {showConnections ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showConnections ? "Hide" : "Show"} Connections
            </Button>
            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => setIsNewProjectDialogOpen(true)}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-muted/30 border border-border">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Projects Grid/List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No projects found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create your first project to get started
                </p>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {filteredProjects.map((project) => {
                const stats = projectStats[project.id] || {
                  tasks: 0,
                  completedTasks: 0,
                  notes: 0,
                  events: 0,
                  goals: 0,
                  completedGoals: 0,
                };
                const projectLinkedItems = linkedItems[project.id] || [];
                const isSelected = selectedProject?.id === project.id;

                return (
                  <Card
                    key={project.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-border ${
                      isSelected ? "ring-2 ring-primary/50 shadow-lg" : ""
                    } ${viewMode === "list" ? "flex items-center p-4" : ""}`}
                    onClick={() => setSelectedProject(project)}
                  >
                    {viewMode === "grid" ? (
                      <>
                        {/* Project Header */}
                        <div
                          className={`h-24 rounded-t-lg ${project.color} relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="absolute top-3 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNewProject({
                                      ...project,
                                      id: project.id,
                                    });
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
                          <div className="absolute bottom-3 left-3">
                            <Badge
                              variant="outline"
                              className="bg-white/20 text-white border-white/30"
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description || "No description"}
                            </p>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1 rounded bg-green-100">
                                <CheckSquare className="h-3 w-3 text-green-600" />
                              </div>
                              <span className="text-muted-foreground">
                                {stats.completedTasks}/{stats.tasks}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1 rounded bg-blue-100">
                                <FileText className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-muted-foreground">
                                {stats.notes}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1 rounded bg-purple-100">
                                <Calendar className="h-3 w-3 text-purple-600" />
                              </div>
                              <span className="text-muted-foreground">
                                {stats.events}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1 rounded bg-orange-100">
                                <Target className="h-3 w-3 text-orange-600" />
                              </div>
                              <span className="text-muted-foreground">
                                {stats.completedGoals}/{stats.goals}
                              </span>
                            </div>
                          </div>

                          {/* Connection Indicators */}
                          {showConnections && projectLinkedItems.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {projectLinkedItems
                                .slice(0, 3)
                                .map((item, index) => (
                                  <div
                                    key={item.id}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getItemColor(item.type)}`}
                                  >
                                    {getItemIcon(item.type)}
                                    <span className="truncate max-w-16">
                                      {item.title}
                                    </span>
                                  </div>
                                ))}
                              {projectLinkedItems.length > 3 && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                  <Plus className="h-3 w-3" />
                                  {projectLinkedItems.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </>
                    ) : (
                      /* List View */
                      <>
                        <div
                          className={`w-4 h-16 rounded-l-lg ${project.color} mr-4`}
                        ></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-foreground">
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getStatusColor(project.status)}
                              >
                                {project.status}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNewProject({
                                        ...project,
                                        id: project.id,
                                      });
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
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {project.description || "No description"}
                          </p>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="h-4 w-4" />
                              {stats.completedTasks}/{stats.tasks} tasks
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {stats.notes} notes
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {stats.events} events
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {stats.completedGoals}/{stats.goals} goals
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Details Sidebar */}
        {selectedProject && (
          <div className="w-96 border-l border-border bg-card/30 flex flex-col">
            {/* Project Header */}
            <div className="p-6 border-b border-border">
              <div
                className={`h-20 rounded-lg ${selectedProject.color} mb-4 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-xl font-bold text-white truncate">
                    {selectedProject.title}
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedProject.description || "No description"}
              </p>
              <div className="flex items-center gap-2 mb-4">
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

            {/* Goals Section */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Goals & Progress
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedGoalForLinking(null);
                    setIsLinkingDialogOpen(true);
                  }}
                >
                  <Network className="h-4 w-4 mr-2" />
                  Link Items
                </Button>
              </div>

              {projectGoals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No goals yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewGoalDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Goal
                  </Button>
                </div>
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
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1">
                                {goal.title}
                              </h4>
                              {goal.description && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {goal.description}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoalForEdit(goal);
                                    setNewGoal({
                                      title: goal.title,
                                      description: goal.description,
                                      target_value: goal.target_value,
                                      current_value: goal.current_value,
                                      unit: goal.unit,
                                      due_date: goal.due_date,
                                    });
                                    setIsEditGoalDialogOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Goal
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedGoalForLinking(goal.id);
                                    setIsLinkingDialogOpen(true);
                                  }}
                                >
                                  <Link className="mr-2 h-4 w-4" />
                                  Link Items
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {goal.current_value} / {goal.target_value}{" "}
                                {goal.unit}
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
                          </div>

                          {/* Quick Progress Update */}
                          <div className="flex items-center gap-2 mt-3">
                            <Input
                              type="number"
                              placeholder="Update"
                              className="h-8 text-xs"
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  const value = parseFloat(
                                    (e.target as HTMLInputElement).value,
                                  );
                                  if (!isNaN(value)) {
                                    handleUpdateGoalProgress(goal.id, value);
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {goal.unit}
                            </span>
                          </div>

                          {/* Goal Linked Items */}
                          {goalLinkedItems[goal.id] &&
                            goalLinkedItems[goal.id].length > 0 && (
                              <div className="mt-4 pt-3 border-t border-border">
                                <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                  Linked Items (
                                  {goalLinkedItems[goal.id].length})
                                </h5>
                                <div className="space-y-1">
                                  {goalLinkedItems[goal.id]
                                    .slice(0, 3)
                                    .map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                        onClick={() =>
                                          handleNavigateToItem(
                                            item.id,
                                            item.type,
                                          )
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`p-0.5 rounded ${getItemColor(item.type)}`}
                                          >
                                            {getItemIcon(item.type)}
                                          </div>
                                          <span className="text-xs font-medium text-foreground truncate">
                                            {item.title}
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnlinkItemFromGoal(
                                              item.id,
                                              item.type,
                                              goal.id,
                                            );
                                          }}
                                          title="Unlink from goal"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  {goalLinkedItems[goal.id].length > 3 && (
                                    <div className="text-xs text-muted-foreground text-center py-1">
                                      +{goalLinkedItems[goal.id].length - 3}{" "}
                                      more items
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Linked Items Section */}
              {linkedItems[selectedProject.id] &&
                linkedItems[selectedProject.id].length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-foreground mb-4">
                      Connected Items
                    </h3>
                    <div className="space-y-2">
                      {linkedItems[selectedProject.id].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() =>
                            handleNavigateToItem(item.id, item.type)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-1 rounded ${getItemColor(item.type)}`}
                            >
                              {getItemIcon(item.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.title}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {item.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToItem(item.id, item.type);
                              }}
                              title="Open item"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlinkItemFromProject(item.id, item.type);
                              }}
                              title="Unlink item"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
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
                <label className="text-sm font-medium">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {projectGradients.map((gradient) => (
                    <button
                      key={gradient}
                      className={`h-8 rounded-lg ${gradient} border-2 ${
                        newProject.color === gradient
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      onClick={() =>
                        setNewProject({ ...newProject, color: gradient })
                      }
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

      {/* Edit Project Dialog */}
      <Dialog
        open={isEditProjectDialogOpen}
        onOpenChange={setIsEditProjectDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="edit-project-title"
                className="text-sm font-medium"
              >
                Title *
              </label>
              <Input
                id="edit-project-title"
                placeholder="Project title"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject({ ...newProject, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="edit-project-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="edit-project-description"
                placeholder="Project description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Color Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {projectGradients.map((gradient) => (
                    <button
                      key={gradient}
                      className={`h-8 rounded-lg ${gradient} border-2 ${
                        newProject.color === gradient
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      onClick={() =>
                        setNewProject({ ...newProject, color: gradient })
                      }
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
                <label className="text-sm font-medium">
                  Start Date (Optional)
                </label>
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
                <label className="text-sm font-medium">
                  End Date (Optional)
                </label>
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
              onClick={() => setIsEditProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditProject}
              disabled={!newProject.title?.trim()}
            >
              Update Project
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

      {/* Edit Goal Dialog */}
      <Dialog
        open={isEditGoalDialogOpen}
        onOpenChange={setIsEditGoalDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-goal-title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="edit-goal-title"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="edit-goal-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="edit-goal-description"
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
              onClick={() => {
                setIsEditGoalDialogOpen(false);
                setSelectedGoalForEdit(null);
                setNewGoal({
                  title: "",
                  description: "",
                  target_value: 0,
                  current_value: 0,
                  unit: "",
                  due_date: null,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedGoalForEdit) {
                  setSelectedGoalForEdit({
                    ...selectedGoalForEdit,
                    title: newGoal.title || "",
                    description: newGoal.description || "",
                    target_value: newGoal.target_value || 0,
                    current_value: newGoal.current_value || 0,
                    unit: newGoal.unit || "",
                    due_date: newGoal.due_date,
                  });
                  handleEditGoal();
                }
              }}
              disabled={!newGoal.title?.trim()}
            >
              Update Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linking Dialog */}
      <Dialog open={isLinkingDialogOpen} onOpenChange={setIsLinkingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Link Items to {selectedProject?.title}
              {selectedGoalForLinking && " Goal"}
            </DialogTitle>
            {selectedGoalForLinking && (
              <p className="text-sm text-muted-foreground">
                Items will be linked to the specific goal and can be used to
                track goal progress.
              </p>
            )}
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="tasks">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              <TabsContent
                value="tasks"
                className="space-y-2 max-h-64 overflow-y-auto"
              >
                {availableTasks
                  .filter((task) => {
                    // If linking to a specific goal, show all available tasks
                    if (selectedGoalForLinking) {
                      return !goalLinkedItems[selectedGoalForLinking]?.some(
                        (item) => item.id === task.id,
                      );
                    }
                    // Otherwise, show tasks not linked to the project
                    return !linkedItems[selectedProject?.id || ""]?.some(
                      (item) => item.id === task.id,
                    );
                  })
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.priority} priority
                            {task.due_date &&
                              ` • Due ${format(new Date(task.due_date), "MMM dd")}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleLinkItemToProject(task.id, "task");
                          setIsLinkingDialogOpen(false);
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent
                value="notes"
                className="space-y-2 max-h-64 overflow-y-auto"
              >
                {availableNotes
                  .filter((note) => {
                    // If linking to a specific goal, show all available notes
                    if (selectedGoalForLinking) {
                      return !goalLinkedItems[selectedGoalForLinking]?.some(
                        (item) => item.id === note.id,
                      );
                    }
                    // Otherwise, show notes not linked to the project
                    return !linkedItems[selectedProject?.id || ""]?.some(
                      (item) => item.id === note.id,
                    );
                  })
                  .map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{note.title}</p>
                          <p className="text-xs text-muted-foreground">Note</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleLinkItemToProject(note.id, "note");
                          setIsLinkingDialogOpen(false);
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </div>
                  ))}
              </TabsContent>
              <TabsContent
                value="events"
                className="space-y-2 max-h-64 overflow-y-auto"
              >
                {availableEvents
                  .filter((event) => {
                    // If linking to a specific goal, show all available events
                    if (selectedGoalForLinking) {
                      return !goalLinkedItems[selectedGoalForLinking]?.some(
                        (item) => item.id === event.id,
                      );
                    }
                    // Otherwise, show events not linked to the project
                    return !linkedItems[selectedProject?.id || ""]?.some(
                      (item) => item.id === event.id,
                    );
                  })
                  .map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.due_date &&
                              format(new Date(event.due_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          handleLinkItemToProject(event.id, "event");
                          setIsLinkingDialogOpen(false);
                        }}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Link
                      </Button>
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLinkingDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsSection;
