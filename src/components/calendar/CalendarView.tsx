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

interface Event {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  color?: string;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "Team Meeting",
      description: "Weekly sync with the product team",
      start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      color: "bg-blue-500",
    },
    {
      id: "2",
      title: "Project Review",
      description: "Review Q2 project milestones",
      start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(),
      color: "bg-green-500",
    },
    {
      id: "3",
      title: "Client Call",
      description: "Introduction call with new client",
      start: addDays(new Date(), 1).toISOString(),
      end: addDays(new Date(), 1).toISOString(),
      color: "bg-purple-500",
    },
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    start: new Date().toISOString(),
    end: new Date().toISOString(),
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
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
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

  const handleCreateEvent = () => {
    const newEventWithId = {
      ...newEvent,
      id: Math.random().toString(36).substring(2, 9),
      color: `bg-${["blue", "green", "purple", "red", "yellow"][Math.floor(Math.random() * 5)]}-500`,
    } as Event;

    setEvents([...events, newEventWithId]);
    setNewEvent({
      title: "",
      description: "",
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    });
    setIsDialogOpen(false);
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const dayEvents = events.filter((event) => {
      const eventDate = parseISO(event.start);
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
              const startTime = parseISO(event.start);
              const endTime = parseISO(event.end);
              const startHour =
                startTime.getHours() + startTime.getMinutes() / 60;
              const endHour = endTime.getHours() + endTime.getMinutes() / 60;
              const duration = endHour - startHour;

              return (
                <div
                  key={event.id}
                  className={`absolute rounded-md p-2 text-white text-xs ${event.color || "bg-blue-500"}`}
                  style={{
                    top: `${startHour * 4}rem`,
                    height: `${duration * 4}rem`,
                    left: "0.5rem",
                    right: "0.5rem",
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  <div>
                    {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                  </div>
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
                  const eventDate = parseISO(event.start);
                  return isSameDay(eventDate, day);
                })
                .map((event) => {
                  const startTime = parseISO(event.start);
                  const endTime = parseISO(event.end);
                  const startHour =
                    startTime.getHours() + startTime.getMinutes() / 60;
                  const endHour =
                    endTime.getHours() + endTime.getMinutes() / 60;
                  const duration = endHour - startHour;

                  return (
                    <div
                      key={event.id}
                      className={`absolute rounded-md p-1 text-white text-xs ${event.color || "bg-blue-500"}`}
                      style={{
                        top: `${startHour * 4}rem`,
                        height: `${duration * 4}rem`,
                        left: "0.25rem",
                        right: "0.25rem",
                      }}
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
              const eventDate = parseISO(event.start);
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
    <Card className="w-full h-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Calendar</CardTitle>
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
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
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
                      <Label htmlFor="start-date">Start</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEvent.start ? (
                              format(parseISO(newEvent.start), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              newEvent.start
                                ? parseISO(newEvent.start)
                                : undefined
                            }
                            onSelect={(date) =>
                              date &&
                              setNewEvent({
                                ...newEvent,
                                start: date.toISOString(),
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="end-date">End</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newEvent.end ? (
                              format(parseISO(newEvent.end), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              newEvent.end ? parseISO(newEvent.end) : undefined
                            }
                            onSelect={(date) =>
                              date &&
                              setNewEvent({
                                ...newEvent,
                                end: date.toISOString(),
                              })
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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

// This is a simplified version of the Calendar component for the event creation dialog
// In a real app, you would import the actual Calendar component
const Calendar = ({ mode, selected, onSelect, initialFocus }: any) => {
  return (
    <div className="p-3">
      <div className="text-center mb-2">Calendar Placeholder</div>
      <Button onClick={() => onSelect(new Date())} className="w-full">
        Select Today
      </Button>
    </div>
  );
};

export default CalendarView;
