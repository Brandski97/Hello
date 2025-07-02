import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Folder,
  Tag,
  Star,
  Clock,
  Trash,
  ChevronDown,
  ChevronRight,
  Edit,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  category?: string;
  tags?: string[];
  starred?: boolean;
  user_id: string;
}

const NotesSection = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showStarred, setShowStarred] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  useEffect(() => {
    // Extract unique categories and tags from notes
    const uniqueCategories = [
      ...new Set(
        notes.filter((note) => note.category).map((note) => note.category!),
      ),
    ];
    const uniqueTags = [...new Set(notes.flatMap((note) => note.tags || []))];
    setCategories(uniqueCategories);
    setAllTags(uniqueTags);
  }, [notes]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      if (data && data.length > 0 && !selectedNote) {
        setSelectedNote(data[0]);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!user || !newNote.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          title: newNote.title,
          content: newNote.content,
          category: newNote.category || null,
          tags: newNote.tags.length > 0 ? newNote.tags : null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setNotes([data, ...notes]);
      setSelectedNote(data);
      setNewNote({ title: "", content: "", category: "", tags: [] });
      setIsNewNoteDialogOpen(false);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;

      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);

      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleToggleStar = async (noteId: string) => {
    try {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const { error } = await supabase
        .from("notes")
        .update({ starred: !note.starred })
        .eq("id", noteId);

      if (error) throw error;

      const updatedNotes = notes.map((n) =>
        n.id === noteId ? { ...n, starred: !n.starred } : n,
      );
      setNotes(updatedNotes);

      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, starred: !selectedNote.starred });
      }
    } catch (error) {
      console.error("Error toggling star:", error);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditContent(selectedNote.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedNote) return;

    try {
      const { error } = await supabase
        .from("notes")
        .update({ content: editContent })
        .eq("id", selectedNote.id);

      if (error) throw error;

      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              content: editContent,
              updated_at: new Date().toISOString(),
            }
          : note,
      );
      setNotes(updatedNotes);
      setSelectedNote({
        ...selectedNote,
        content: editContent,
        updated_at: new Date().toISOString(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || note.category === selectedCategory;
    const matchesTag =
      !selectedTag || (note.tags && note.tags.includes(selectedTag));
    const matchesStarred = !showStarred || note.starred;

    return matchesSearch && matchesCategory && matchesTag && matchesStarred;
  });

  const handleAddTag = () => {
    if (newTagInput.trim() && !newNote.tags.includes(newTagInput.trim())) {
      setNewNote({
        ...newNote,
        tags: [...newNote.tags, newTagInput.trim()],
      });
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    setSelectedTag(null);
    setShowStarred(false);
  };

  const handleTagFilter = (tag: string | null) => {
    setSelectedTag(tag);
    setSelectedCategory(null);
    setShowStarred(false);
  };

  const handleStarredFilter = () => {
    setShowStarred(!showStarred);
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="border-r p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Notes</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNewNoteDialogOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <ChevronDown className="h-4 w-4 mr-1" />
            <span>Categories</span>
          </div>
          <div className="ml-6 space-y-1">
            <div
              className={`flex items-center text-sm py-1 hover:text-primary cursor-pointer ${
                selectedCategory === null ? "text-primary font-medium" : ""
              }`}
              onClick={() => handleCategoryFilter(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              <span>All Categories</span>
            </div>
            {categories.map((category) => (
              <div
                key={category}
                className={`flex items-center text-sm py-1 hover:text-primary cursor-pointer ${
                  selectedCategory === category
                    ? "text-primary font-medium"
                    : ""
                }`}
                onClick={() => handleCategoryFilter(category)}
              >
                <Folder className="h-4 w-4 mr-2" />
                <span>{category}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <ChevronDown className="h-4 w-4 mr-1" />
            <span>Tags</span>
          </div>
          <div className="ml-6 space-y-1">
            <div
              className={`flex items-center text-sm py-1 hover:text-primary cursor-pointer ${
                selectedTag === null ? "text-primary font-medium" : ""
              }`}
              onClick={() => handleTagFilter(null)}
            >
              <Tag className="h-4 w-4 mr-2" />
              <span>All Tags</span>
            </div>
            {allTags.map((tag) => (
              <div
                key={tag}
                className={`flex items-center text-sm py-1 hover:text-primary cursor-pointer ${
                  selectedTag === tag ? "text-primary font-medium" : ""
                }`}
                onClick={() => handleTagFilter(tag)}
              >
                <Tag className="h-4 w-4 mr-2" />
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div
            className={`flex items-center text-sm py-1 hover:text-primary cursor-pointer ${
              showStarred ? "text-primary font-medium" : ""
            }`}
            onClick={handleStarredFilter}
          >
            <Star className="h-4 w-4 mr-2" />
            <span>Starred</span>
          </div>
          <div className="flex items-center text-sm py-1 hover:text-primary cursor-pointer">
            <Clock className="h-4 w-4 mr-2" />
            <span>Recent</span>
          </div>
          <div className="flex items-center text-sm py-1 hover:text-primary cursor-pointer">
            <Trash className="h-4 w-4 mr-2" />
            <span>Trash</span>
          </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Notes List */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="border-r h-full">
        <div className="p-4 border-b">
          <h3 className="font-medium">All Notes ({filteredNotes.length})</h3>
        </div>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="p-2">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={`mb-2 cursor-pointer hover:bg-accent ${selectedNote?.id === note.id ? "bg-accent" : ""}`}
                onClick={() => handleNoteSelect(note)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{note.title}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStar(note.id);
                        }}
                      >
                        <Star
                          className={`h-3 w-3 ${note.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {note.content.replace(/[#*_\n]/g, "")}
                  </p>
                  <div className="mt-2">
                    {note.category && (
                      <Badge variant="outline" className="text-xs mb-1 mr-1">
                        {note.category}
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags?.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Note Editor */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <div className="flex flex-col h-full">
        {selectedNote ? (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">{selectedNote.title}</h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={handleEditClick}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {isEditing ? (
                <Textarea
                  className="min-h-[calc(100vh-12rem)] w-full p-4 font-mono"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {selectedNote.content.split("\n").map((line, i) => (
                    <div key={i} className="mb-2">
                      {line.startsWith("# ") ? (
                        <h1 className="text-2xl font-bold">
                          {line.substring(2)}
                        </h1>
                      ) : line.startsWith("## ") ? (
                        <h2 className="text-xl font-bold">
                          {line.substring(3)}
                        </h2>
                      ) : line.startsWith("### ") ? (
                        <h3 className="text-lg font-bold">
                          {line.substring(4)}
                        </h3>
                      ) : line.startsWith("- ") ? (
                        <div className="flex">
                          <span className="mr-2">•</span>
                          <span>{line.substring(2)}</span>
                        </div>
                      ) : line.startsWith("1. ") ||
                        line.startsWith("2. ") ||
                        line.startsWith("3. ") ? (
                        <div className="flex">
                          <span className="mr-2">{line.substring(0, 2)}</span>
                          <span>{line.substring(3)}</span>
                        </div>
                      ) : line.startsWith("**") && line.endsWith("**") ? (
                        <p className="font-bold">
                          {line.substring(2, line.length - 2)}
                        </p>
                      ) : (
                        <p>{line}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t text-xs text-muted-foreground">
              Last updated: {new Date(selectedNote.updated_at).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {loading ? "Loading notes..." : "No note selected"}
          </div>
        )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* New Note Dialog */}
      <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="note-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="note-title"
                placeholder="Note title"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="note-category" className="text-sm font-medium">
                Category (Optional)
              </label>
              <Select
                value={newNote.category}
                onValueChange={(value) =>
                  setNewNote({ ...newNote, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or type a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type a new category"
                value={newNote.category}
                onChange={(e) =>
                  setNewNote({ ...newNote, category: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="note-tags" className="text-sm font-medium">
                Tags (Optional)
              </label>
              <div className="flex gap-2">
                <Input
                  id="note-tags"
                  placeholder="Add a tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {newNote.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="note-content" className="text-sm font-medium">
                Content
              </label>
              <Textarea
                id="note-content"
                placeholder="Write your note content here..."
                className="min-h-[200px]"
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNote} disabled={!newNote.title.trim()}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesSection;
