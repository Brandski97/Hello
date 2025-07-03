import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  X,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/contexts/EncryptionContext";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  due_time: string | null;
  completed: boolean;
  linked_event?: string;
  linked_note?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  encrypted?: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
};

const TaskManager = () => {
  const { user } = useAuth();
  const { encryptContent, decryptContent, hasValidPassphrase } =
    useEncryption();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    priority: "medium",
    due_date: null,
    due_time: null,
    completed: false,
    linked_note: "",
  });
  const [userNotes, setUserNotes] = useState<{ id: string; title: string }[]>(
    [],
  );

  const [activeTab, setActiveTab] = useState("all");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUserNotes();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Decrypt tasks if encryption is enabled
      const decryptedTasks = await Promise.all(
        (data || []).map(async (task) => {
          if (
            task.encrypted &&
            hasValidPassphrase &&
            task.encryption_iv &&
            task.encryption_salt
          ) {
            try {
              const decryptedDescription = await decryptContent(
                task.description,
                task.encryption_iv,
                task.encryption_salt,
              );
              return {
                ...task,
                description: decryptedDescription || "[Decryption failed]",
              };
            } catch (error) {
              console.error("Failed to decrypt task:", error);
              return {
                ...task,
                description: "[Encrypted - Cannot decrypt]",
              };
            }
          }
          return task;
        }),
      );

      setTasks(decryptedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title")
        .eq("user_id", user?.id)
        .order("title", { ascending: true });

      if (error) throw error;
      setUserNotes(data || []);
    } catch (error) {
      console.error("Error fetching user notes:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title?.trim()) return;

    try {
      // Combine date and time if both are provided
      let combinedDueDate = null;
      if (newTask.due_date) {
        const date = new Date(newTask.due_date);
        if (newTask.due_time) {
          const [hours, minutes] = newTask.due_time.split(":");
          date.setHours(parseInt(hours), parseInt(minutes));
        }
        combinedDueDate = date.toISOString();
      }

      let taskData: any = {
        title: newTask.title,
        description: newTask.description || "",
        priority: newTask.priority || "medium",
        due_date: combinedDueDate,
        completed: false,
        linked_note: newTask.linked_note,
        user_id: user.id,
        encrypted: false,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && newTask.description) {
        const encryptionResult = await encryptContent(newTask.description);
        if (encryptionResult) {
          taskData = {
            ...taskData,
            description: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayTask = {
        ...data,
        description: newTask.description || "", // Show original description in UI
      };

      setTasks([displayTask, ...tasks]);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: null,
        due_time: null,
        completed: false,
        linked_note: "",
      });
      setIsNewTaskDialogOpen(false);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTask = async () => {
    if (!currentTask) return;

    try {
      // Combine date and time if both are provided
      let combinedDueDate = null;
      if (currentTask.due_date) {
        const date = new Date(currentTask.due_date);
        if (currentTask.due_time) {
          const [hours, minutes] = currentTask.due_time.split(":");
          date.setHours(parseInt(hours), parseInt(minutes));
        }
        combinedDueDate = date.toISOString();
      }

      let updateData: any = {
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        due_date: combinedDueDate,
        completed: currentTask.completed,
        linked_event: currentTask.linked_event,
        encrypted: false,
        encryption_iv: null,
        encryption_salt: null,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && currentTask.description) {
        const encryptionResult = await encryptContent(currentTask.description);
        if (encryptionResult) {
          updateData = {
            ...updateData,
            description: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", currentTask.id);

      if (error) throw error;

      const updatedTasks = tasks.map((task) =>
        task.id === currentTask.id
          ? {
              ...currentTask,
              encrypted: updateData.encrypted,
              encryption_iv: updateData.encryption_iv,
              encryption_salt: updateData.encryption_salt,
            }
          : task,
      );
      setTasks(updatedTasks);
      setIsEditTaskDialogOpen(false);
      setCurrentTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;

      setTasks(tasks.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const { error } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", id);

      if (error) throw error;

      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      );
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditTaskDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return task.completed;
    if (activeTab === "pending") return !task.completed;
    if (activeTab === "high")
      return task.priority === "high" && !task.completed;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-background h-full flex flex-col">
      <div className="p-8 border-b border-border">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Secure Tasks
              </h1>
              <p className="text-muted-foreground">
                Your encrypted task management
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsNewTaskDialogOpen(true)}
            className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8 bg-muted/30 border border-border">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All Tasks
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="high"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              High Priority
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Loading tasks...
                </CardContent>
              </Card>
            ) : filteredTasks.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No tasks found. Create a new task to get started.
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className="overflow-hidden bg-card border-border hover:bg-card/80 transition-colors duration-200"
                >
                  <CardContent className="p-0">
                    <div className="flex items-start p-4 gap-3">
                      <button
                        onClick={() => handleToggleComplete(task.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                      </button>

                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h3
                            className={`font-medium ${task.completed ? "line-through text-gray-400" : ""}`}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={`${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {task.due_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(task.due_date), "MMM dd, yyyy")}
                              {format(new Date(task.due_date), "HH:mm") !==
                                "00:00" && (
                                <span className="ml-1">
                                  at {format(new Date(task.due_date), "h:mm a")}
                                </span>
                              )}
                            </div>
                          )}

                          {task.linked_note && (
                            <Badge
                              variant="outline"
                              className="text-xs text-purple-600"
                            >
                              📝{" "}
                              {userNotes.find((n) => n.id === task.linked_note)
                                ?.title || task.linked_note}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Task description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) =>
                    setNewTask({
                      ...newTask,
                      priority: value as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">
                    Due Date
                  </label>
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {newTask.due_date ? (
                          format(new Date(newTask.due_date), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          newTask.due_date
                            ? new Date(newTask.due_date)
                            : undefined
                        }
                        onSelect={(date) => {
                          setNewTask({
                            ...newTask,
                            due_date: date ? date.toISOString() : null,
                          });
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="dueTime" className="text-sm font-medium">
                    Due Time (Optional)
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="dueTime"
                      type="time"
                      className="pl-10"
                      value={newTask.due_time || ""}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          due_time: e.target.value || null,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="linkedNote" className="text-sm font-medium">
                Link to Note (Optional)
              </label>
              <Select
                value={newTask.linked_note}
                onValueChange={(value) =>
                  setNewTask({
                    ...newTask,
                    linked_note: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No note</SelectItem>
                  {userNotes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewTaskDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog
        open={isEditTaskDialogOpen}
        onOpenChange={setIsEditTaskDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {currentTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="edit-title"
                  placeholder="Task title"
                  value={currentTask.title}
                  onChange={(e) =>
                    setCurrentTask({ ...currentTask, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="edit-description"
                  placeholder="Task description"
                  value={currentTask.description}
                  onChange={(e) =>
                    setCurrentTask({
                      ...currentTask,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="edit-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>
                  <Select
                    value={currentTask.priority}
                    onValueChange={(value) =>
                      setCurrentTask({
                        ...currentTask,
                        priority: value as "low" | "medium" | "high",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label
                      htmlFor="edit-dueDate"
                      className="text-sm font-medium"
                    >
                      Due Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {currentTask.due_date ? (
                            format(new Date(currentTask.due_date), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={
                            currentTask.due_date
                              ? new Date(currentTask.due_date)
                              : undefined
                          }
                          onSelect={(date) => {
                            const existingTime = currentTask.due_date
                              ? format(new Date(currentTask.due_date), "HH:mm")
                              : null;

                            if (
                              date &&
                              existingTime &&
                              existingTime !== "00:00"
                            ) {
                              const [hours, minutes] = existingTime.split(":");
                              date.setHours(parseInt(hours), parseInt(minutes));
                            }

                            setCurrentTask({
                              ...currentTask,
                              due_date: date ? date.toISOString() : null,
                            });
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="edit-dueTime"
                      className="text-sm font-medium"
                    >
                      Due Time (Optional)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-dueTime"
                        type="time"
                        className="pl-10"
                        value={
                          currentTask.due_date &&
                          format(new Date(currentTask.due_date), "HH:mm") !==
                            "00:00"
                            ? format(new Date(currentTask.due_date), "HH:mm")
                            : ""
                        }
                        onChange={(e) => {
                          if (currentTask.due_date) {
                            const date = new Date(currentTask.due_date);
                            if (e.target.value) {
                              const [hours, minutes] =
                                e.target.value.split(":");
                              date.setHours(parseInt(hours), parseInt(minutes));
                            } else {
                              date.setHours(0, 0, 0, 0);
                            }
                            setCurrentTask({
                              ...currentTask,
                              due_date: date.toISOString(),
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-linkedNote"
                  className="text-sm font-medium"
                >
                  Link to Note (Optional)
                </label>
                <Select
                  value={currentTask.linked_note || "none"}
                  onValueChange={(value) =>
                    setCurrentTask({
                      ...currentTask,
                      linked_note: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No note</SelectItem>
                    {userNotes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-completed"
                  checked={currentTask.completed}
                  onChange={(e) =>
                    setCurrentTask({
                      ...currentTask,
                      completed: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="edit-completed"
                  className="text-sm font-medium text-gray-700"
                >
                  Mark as completed
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTaskDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManager;
