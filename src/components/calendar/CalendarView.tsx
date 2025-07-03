import React, { useState, useEffect } from "react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useEncryption } from "@/contexts/EncryptionContext";

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO date string
  end_time: string; // ISO date string
  location?: string;
  link?: string;
  color?: string;
  user_id: string;
  linked_note?: string;
  linked_task?: string;
  encrypted?: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
  created_at: string;
  updated_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const CalendarView = () => {
  const { user } = useAuth();
  const { encryptContent, decryptContent, hasValidPassphrase } =
    useEncryption();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<{ id: string; title: string }[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
    location: "",
    link: "",
    linked_note: "",
    linked_task: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTasks();
      fetchNotes();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user?.id)
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Decrypt events if encryption is enabled
      const decryptedEvents = await Promise.all(
        (data || []).map(async (event) => {
          if (
            event.encrypted &&
            hasValidPassphrase &&
            event.encryption_iv &&
            event.encryption_salt
          ) {
            try {
              const decryptedDescription = await decryptContent(
                event.description,
                event.encryption_iv,
                event.encryption_salt,
              );
              return {
                ...event,
                description: decryptedDescription || "[Decryption failed]",
              };
            } catch (error) {
              console.error("Failed to decrypt event:", error);
              return {
                ...event,
                description: "[Encrypted - Cannot decrypt]",
              };
            }
          }
          return event;
        }),
      );

      setEvents(decryptedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title")
        .eq("user_id", user?.id)
        .order("title", { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handlePrevious = () => {
    if (view === "day") {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setCurrentDate(prevMonth);
    }
  };

  const handleNext = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCurrentDate(nextMonth);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateEvent = async () => {
    if (!user || !newEvent.title?.trim()) return;

    try {
      let eventData: any = {
        title: newEvent.title,
        description: newEvent.description || "",
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        location: newEvent.location || null,
        link: newEvent.link || null,
        color: `bg-${["blue", "green", "purple", "red", "yellow", "indigo", "pink"][Math.floor(Math.random() * 7)]}-500`,
        user_id: user.id,
        linked_note: newEvent.linked_note || null,
        linked_task: newEvent.linked_task || null,
        encrypted: false,
      };

      // Encrypt description if encryption is enabled and description exists
      if (hasValidPassphrase && newEvent.description) {
        const encryptionResult = await encryptContent(newEvent.description);
        if (encryptionResult) {
          eventData = {
            ...eventData,
            description: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayEvent = {
        ...data,
        description: newEvent.description || "", // Show original description in UI
      };

      setEvents([...events, displayEvent]);
      setNewEvent({
        title: "",
        description: "",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: "",
        link: "",
        linked_note: "",
        linked_task: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter((event) => {
      const eventDate = parseISO(event.start_time);
      return isSameDay(eventDate, currentDate);
    });
    const dayTasks = tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = parseISO(task.due_date);
      return isSameDay(taskDate, currentDate);
    });

    return (
      <div className="flex flex-col h-[600px] overflow-y-auto">
        <div className="text-center py-4 font-medium">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </div>
        <div className="flex flex-1">
          <div className="w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-t border-gray-200 text-xs text-gray-500 text-right pr-2"
              >
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          <div className="flex-1 relative">
            {hours.map((hour) => (
              <div key={hour} className="h-16 border-t border-gray-200"></div>
            ))}
            {dayEvents.map((event) => {
              const startTime = parseISO(event.start_time);
              const endTime = parseISO(event.end_time);
              const startHour =
                startTime.getHours() + startTime.getMinutes() / 60;
              const endHour = endTime.getHours() + endTime.getMinutes() / 60;
              const duration = endHour - startHour;

              return (
                <div
                  key={event.id}
                  className={`absolute rounded-md p-2 text-white text-xs ${event.color || "bg-blue-500"} cursor-pointer hover:opacity-90`}
                  style={{
                    top: `${startHour * 4}rem`,
                    height: `${duration * 4}rem`,
                    left: "0.5rem",
                    right: "0.5rem",
                  }}
                  title={`${event.title}${event.description ? ` - ${event.description}` : ""}${event.location ? ` @ ${event.location}` : ""}`}
                >
                  <div className="font-medium truncate">{event.title}</div>
                  <div className="truncate">
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </div>
                  {event.location && (
                    <div className="text-xs opacity-90 truncate">
                      📍 {event.location}
                    </div>
                  )}
                </div>
              );
            })}
            {dayTasks.map((task) => {
              const taskDate = parseISO(task.due_date!);
              const startHour = 9; // Default to 9 AM for tasks
              const duration = 1; // 1 hour duration for tasks
              const priorityColor =
                task.priority === "high"
                  ? "bg-red-500"
                  : task.priority === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500";

              return (
                <div
                  key={`task-${task.id}`}
                  className={`absolute rounded-md p-2 text-white text-xs ${priorityColor} opacity-80`}
                  style={{
                    top: `${startHour * 4}rem`,
                    height: `${duration * 4}rem`,
                    left: "0.5rem",
                    right: "0.5rem",
                  }}
                >
                  <div className="font-medium">📋 {task.title}</div>
                  <div className="text-xs">{task.priority} priority</div>
                  {task.completed && <div className="text-xs">✓ Completed</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex flex-col h-[600px] overflow-auto">
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="w-16 flex-shrink-0"></div>
          {days.map((day, i) => (
            <div key={i} className="flex-1 text-center py-2">
              <div className="font-medium">{format(day, "EEE")}</div>
              <div
                className={cn(
                  "text-sm",
                  isSameDay(day, new Date())
                    ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                    : "",
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-1">
          <div className="w-16 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-t border-gray-200 text-xs text-gray-500 text-right pr-2"
              >
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={dayIndex} className="flex-1 relative">
              {hours.map((hour) => (
                <div key={hour} className="h-16 border-t border-gray-200"></div>
              ))}
              {events
                .filter((event) => {
                  const eventDate = parseISO(event.start_time);
                  return isSameDay(eventDate, day);
                })
                .map((event) => {
                  const startTime = parseISO(event.start_time);
                  const endTime = parseISO(event.end_time);
                  const startHour =
                    startTime.getHours() + startTime.getMinutes() / 60;
                  const endHour =
                    endTime.getHours() + endTime.getMinutes() / 60;
                  const duration = endHour - startHour;

                  return (
                    <div
                      key={event.id}
                      className={`absolute rounded-md p-1 text-white text-xs ${event.color || "bg-blue-500"} cursor-pointer hover:opacity-90`}
                      style={{
                        top: `${startHour * 4}rem`,
                        height: `${duration * 4}rem`,
                        left: "0.25rem",
                        right: "0.25rem",
                      }}
                      title={`${event.title}${event.description ? ` - ${event.description}` : ""}${event.location ? ` @ ${event.location}` : ""}`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="truncate">
                        {format(startTime, "h:mm a")}
                      </div>
                    </div>
                  );
                })}
              {tasks
                .filter((task) => {
                  if (!task.due_date) return false;
                  const taskDate = parseISO(task.due_date);
                  return isSameDay(taskDate, day);
                })
                .map((task) => {
                  const startHour = 9; // Default to 9 AM for tasks
                  const duration = 1; // 1 hour duration for tasks
                  const priorityColor =
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500";

                  return (
                    <div
                      key={`task-${task.id}`}
                      className={`absolute rounded-md p-1 text-white text-xs ${priorityColor} opacity-80`}
                      style={{
                        top: `${startHour * 4}rem`,
                        height: `${duration * 4}rem`,
                        left: "0.25rem",
                        right: "0.25rem",
                      }}
                    >
                      <div className="font-medium truncate">
                        📋 {task.title}
                      </div>
                      <div className="truncate text-xs">{task.priority}</div>
                      {task.completed && <div className="text-xs">✓</div>}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    const firstDay = startOfWeek(startDate, { weekStartsOn: 0 });
    const lastDay = endOfWeek(endDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });

    return (
      <div className="h-[600px] overflow-y-auto">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-white text-center py-2 text-sm font-medium"
            >
              {day}
            </div>
          ))}
          {days.map((day, i) => {
            const dayEvents = events.filter((event) => {
              const eventDate = parseISO(event.start_time);
              return isSameDay(eventDate, day);
            });
            const dayTasks = tasks.filter((task) => {
              if (!task.due_date) return false;
              const taskDate = parseISO(task.due_date);
              return isSameDay(taskDate, day);
            });

            return (
              <div
                key={i}
                className={cn(
                  "bg-white min-h-28 p-1 border-t",
                  !isSameMonth(day, currentDate) && "text-gray-400 bg-gray-50",
                  isSameDay(day, new Date()) && "bg-blue-50",
                )}
              >
                <div className="text-right text-sm">{format(day, "d")}</div>
                <div className="mt-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs rounded px-1 py-0.5 mb-1 truncate text-white ${event.color || "bg-blue-500"}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayTasks.slice(0, 2).map((task) => {
                    const priorityColor =
                      task.priority === "high"
                        ? "bg-red-500"
                        : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500";
                    return (
                      <div
                        key={`task-${task.id}`}
                        className={`text-xs rounded px-1 py-0.5 mb-1 truncate text-white ${priorityColor} opacity-80`}
                      >
                        📋 {task.title}
                      </div>
                    );
                  })}
                  {dayEvents.length + dayTasks.length > 4 && (
                    <div className="text-xs text-gray-500 pl-1">
                      +{dayEvents.length + dayTasks.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full h-full bg-card border-border">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground">
                Private Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Your encrypted schedule
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {view === "day" && format(currentDate, "MMMM d, yyyy")}
              {view === "week" &&
                `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
              {view === "month" && format(currentDate, "MMMM yyyy")}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "day" | "week" | "month")}
            >
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Event title"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Event description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date">Start Date & Time *</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={
                          newEvent.start_time
                            ? format(
                                parseISO(newEvent.start_time),
                                "yyyy-MM-dd'T'HH:mm",
                              )
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewEvent({
                              ...newEvent,
                              start_time: new Date(
                                e.target.value,
                              ).toISOString(),
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date">End Date & Time *</Label>
                      <Input
                        id="end-date"
                        type="datetime-local"
                        value={
                          newEvent.end_time
                            ? format(
                                parseISO(newEvent.end_time),
                                "yyyy-MM-dd'T'HH:mm",
                              )
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            setNewEvent({
                              ...newEvent,
                              end_time: new Date(e.target.value).toISOString(),
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="Event location"
                        value={newEvent.location}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="link">Link</Label>
                      <Input
                        id="link"
                        placeholder="https://..."
                        value={newEvent.link}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, link: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="linked-note">
                        Link to Note (Optional)
                      </Label>
                      <select
                        id="linked-note"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newEvent.linked_note || ""}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            linked_note: e.target.value || null,
                          })
                        }
                      >
                        <option value="">No note</option>
                        {notes.map((note) => (
                          <option key={note.id} value={note.id}>
                            {note.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="linked-task">
                        Link to Task (Optional)
                      </Label>
                      <select
                        id="linked-task"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newEvent.linked_task || ""}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            linked_task: e.target.value || null,
                          })
                        }
                      >
                        <option value="">No task</option>
                        {tasks.map((task) => (
                          <option key={task.id} value={task.id}>
                            {task.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleCreateEvent}
                    disabled={!newEvent.title}
                  >
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "day" | "week" | "month")}
        >
          <TabsContent value="day" className="mt-0">
            {renderDayView()}
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            {renderWeekView()}
          </TabsContent>
          <TabsContent value="month" className="mt-0">
            {renderMonthView()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CalendarView;
