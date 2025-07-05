import React, { useState, useEffect, useRef } from "react";
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
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Type,
  Palette,
  Eye,
  EyeOff,
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
import { useEncryption } from "@/contexts/EncryptionContext";
import { useNotifications } from "@/contexts/NotificationsContext";

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
  encrypted?: boolean;
  encryption_iv?: string;
  encryption_salt?: string;
  title_encrypted?: boolean;
  title_encryption_iv?: string;
  title_encryption_salt?: string;
}

const NotesSection = () => {
  const { user } = useAuth();
  const { encryptContent, decryptContent, hasValidPassphrase } =
    useEncryption();
  const { addNotification } = useNotifications();
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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

      // Decrypt notes if encryption is enabled
      const decryptedNotes = await Promise.all(
        (data || []).map(async (note) => {
          let decryptedNote = { ...note };

          // Decrypt content if encrypted
          if (
            note.encrypted &&
            hasValidPassphrase &&
            note.encryption_iv &&
            note.encryption_salt
          ) {
            try {
              const decryptedContent = await decryptContent(
                note.content,
                note.encryption_iv,
                note.encryption_salt,
              );
              decryptedNote.content = decryptedContent || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt note content:", error);
              decryptedNote.content = "[Encrypted - Cannot decrypt]";
            }
          }

          // Decrypt title if encrypted
          if (
            note.title_encrypted &&
            hasValidPassphrase &&
            note.title_encryption_iv &&
            note.title_encryption_salt
          ) {
            try {
              const decryptedTitle = await decryptContent(
                note.title,
                note.title_encryption_iv,
                note.title_encryption_salt,
              );
              decryptedNote.title = decryptedTitle || "[Decryption failed]";
            } catch (error) {
              console.error("Failed to decrypt note title:", error);
              decryptedNote.title = "[Encrypted - Cannot decrypt]";
            }
          }

          return decryptedNote;
        }),
      );

      setNotes(decryptedNotes);
      if (decryptedNotes && decryptedNotes.length > 0 && !selectedNote) {
        setSelectedNote(decryptedNotes[0]);
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
      let noteData: any = {
        title: newNote.title,
        content: newNote.content,
        category: newNote.category || null,
        tags: newNote.tags.length > 0 ? newNote.tags : null,
        user_id: user.id,
        encrypted: false,
        title_encrypted: false,
      };

      // Encrypt content if encryption is enabled
      if (hasValidPassphrase && newNote.content) {
        const encryptionResult = await encryptContent(newNote.content);
        if (encryptionResult) {
          noteData = {
            ...noteData,
            content: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      // Encrypt title if encryption is enabled
      if (hasValidPassphrase && newNote.title) {
        const titleEncryptionResult = await encryptContent(newNote.title);
        if (titleEncryptionResult) {
          noteData = {
            ...noteData,
            title: titleEncryptionResult.encryptedData,
            title_encrypted: true,
            title_encryption_iv: titleEncryptionResult.iv,
            title_encryption_salt: titleEncryptionResult.salt,
          };
        }
      }

      const { data, error } = await supabase
        .from("notes")
        .insert(noteData)
        .select()
        .single();

      if (error) throw error;

      // If encrypted, show decrypted version in UI
      const displayNote = {
        ...data,
        content: newNote.content, // Show original content in UI
        title: newNote.title, // Show original title in UI
      };

      setNotes([displayNote, ...notes]);
      setSelectedNote(displayNote);

      // Add notification
      addNotification({
        type: "note",
        action: "created",
        title: "Note Created",
        description: `"${newNote.title}" has been saved`,
      });

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

      const deletedNote = notes.find((note) => note.id === noteId);
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);

      // Add notification
      if (deletedNote) {
        addNotification({
          type: "note",
          action: "deleted",
          title: "Note Deleted",
          description: `"${deletedNote.title}" has been deleted`,
        });
      }

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
      let updateData: any = {
        content: editContent,
        encrypted: false,
        encryption_iv: null,
        encryption_salt: null,
        title_encrypted: false,
        title_encryption_iv: null,
        title_encryption_salt: null,
      };

      // Encrypt content if encryption is enabled
      if (hasValidPassphrase && editContent) {
        const encryptionResult = await encryptContent(editContent);
        if (encryptionResult) {
          updateData = {
            ...updateData,
            content: encryptionResult.encryptedData,
            encrypted: true,
            encryption_iv: encryptionResult.iv,
            encryption_salt: encryptionResult.salt,
          };
        }
      }

      // Encrypt title if encryption is enabled
      if (hasValidPassphrase && selectedNote.title) {
        const titleEncryptionResult = await encryptContent(selectedNote.title);
        if (titleEncryptionResult) {
          updateData = {
            ...updateData,
            title: titleEncryptionResult.encryptedData,
            title_encrypted: true,
            title_encryption_iv: titleEncryptionResult.iv,
            title_encryption_salt: titleEncryptionResult.salt,
          };
        }
      }

      const { error } = await supabase
        .from("notes")
        .update(updateData)
        .eq("id", selectedNote.id);

      if (error) throw error;

      const updatedNotes = notes.map((note) =>
        note.id === selectedNote.id
          ? {
              ...note,
              content: editContent, // Show decrypted content in UI
              title: selectedNote.title, // Show decrypted title in UI
              updated_at: new Date().toISOString(),
              encrypted: updateData.encrypted,
              encryption_iv: updateData.encryption_iv,
              encryption_salt: updateData.encryption_salt,
              title_encrypted: updateData.title_encrypted,
              title_encryption_iv: updateData.title_encryption_iv,
              title_encryption_salt: updateData.title_encryption_salt,
            }
          : note,
      );
      setNotes(updatedNotes);
      setSelectedNote({
        ...selectedNote,
        content: editContent,
        title: selectedNote.title, // Show decrypted title in UI
        updated_at: new Date().toISOString(),
        encrypted: updateData.encrypted,
        encryption_iv: updateData.encryption_iv,
        encryption_salt: updateData.encryption_salt,
        title_encrypted: updateData.title_encrypted,
        title_encryption_iv: updateData.title_encryption_iv,
        title_encryption_salt: updateData.title_encryption_salt,
      });

      // Add notification
      addNotification({
        type: "note",
        action: "updated",
        title: "Note Updated",
        description: `"${selectedNote.title}" has been updated`,
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

  // Markdown formatting functions
  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    const newText = before + selectedText + after;

    const newContent =
      editContent.substring(0, start) + newText + editContent.substring(end);
    setEditContent(newContent);

    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatBold = () => insertMarkdown("**", "**");
  const formatItalic = () => insertMarkdown("*", "*");
  const formatUnderline = () => insertMarkdown("<u>", "</u>");
  const formatCode = () => insertMarkdown("`", "`");
  const formatQuote = () => insertMarkdown("> ");
  const formatList = () => insertMarkdown("- ");
  const formatOrderedList = () => insertMarkdown("1. ");
  const formatLink = () => insertMarkdown("[", "](url)");
  const formatImage = () => insertMarkdown("![", "](image-url)");
  const formatHeading = (level: number) =>
    insertMarkdown("#".repeat(level) + " ");

  // Enhanced Markdown renderer
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, i) => {
      const key = `line-${i}`;

      // Headers
      if (line.startsWith("# ")) {
        return (
          <h1
            key={key}
            className="text-3xl font-bold mb-4 text-foreground border-b border-border pb-2"
          >
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={key} className="text-2xl font-bold mb-3 text-foreground">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={key} className="text-xl font-bold mb-2 text-foreground">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h4 key={key} className="text-lg font-bold mb-2 text-foreground">
            {line.substring(5)}
          </h4>
        );
      }

      // Lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={key} className="flex items-start mb-1">
            <span className="mr-2 text-primary">•</span>
            <span className="text-foreground">
              {parseInlineMarkdown(line.substring(2))}
            </span>
          </div>
        );
      }

      // Ordered lists
      if (/^\d+\. /.test(line)) {
        const match = line.match(/^(\d+\. )(.*)/);
        if (match) {
          return (
            <div key={key} className="flex items-start mb-1">
              <span className="mr-2 text-primary font-medium">{match[1]}</span>
              <span className="text-foreground">
                {parseInlineMarkdown(match[2])}
              </span>
            </div>
          );
        }
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={key}
            className="border-l-4 border-primary pl-4 py-2 mb-2 bg-muted/30 italic text-muted-foreground"
          >
            {parseInlineMarkdown(line.substring(2))}
          </blockquote>
        );
      }

      // Code blocks (simple)
      if (line.startsWith("```")) {
        return (
          <div
            key={key}
            className="bg-muted p-3 rounded-md font-mono text-sm mb-2 border border-border"
          >
            <code className="text-foreground">{line.substring(3)}</code>
          </div>
        );
      }

      // Empty lines
      if (line.trim() === "") {
        return <div key={key} className="mb-2"></div>;
      }

      // Regular paragraphs
      return (
        <p key={key} className="mb-2 text-foreground leading-relaxed">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  // Parse inline markdown (bold, italic, code, links)
  const parseInlineMarkdown = (text: string) => {
    // Handle bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Handle italic *text*
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
    // Handle underline <u>text</u>
    text = text.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
    // Handle inline code `code`
    text = text.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono border">$1</code>',
    );
    // Handle links [text](url)
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>',
    );
    // Handle images ![alt](url)
    text = text.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md border border-border my-2" />',
    );

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="border-r border-border p-6 flex flex-col h-full bg-card/30">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Secure Notes
                  </h2>
                  <p className="text-xs text-muted-foreground">Encrypted</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNewNoteDialogOpen(true)}
                className="hover:bg-accent/50"
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
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Notes List */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <div className="border-r border-border h-full bg-card/20">
            <div className="p-6 border-b border-border">
              <h3 className="font-medium text-foreground">
                All Notes ({filteredNotes.length})
              </h3>
            </div>
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="p-2">
                {filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`mb-3 cursor-pointer hover:bg-accent/50 transition-colors duration-200 border-border ${selectedNote?.id === note.id ? "bg-accent/30 border-primary/30" : ""}`}
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
                          <Badge
                            variant="outline"
                            className="text-xs mb-1 mr-1"
                          >
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
          <div className="flex flex-col h-full bg-background">
            {selectedNote ? (
              <>
                <div className="p-6 border-b border-border flex justify-between items-center bg-card/30">
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedNote.title}
                  </h2>
                  <div className="flex gap-2">
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                      >
                        {isPreviewMode ? (
                          <EyeOff className="h-4 w-4 mr-1" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        {isPreviewMode ? "Edit" : "Preview"}
                      </Button>
                    )}
                    {isEditing ? (
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEditClick}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Formatting Toolbar */}
                {isEditing && !isPreviewMode && (
                  <div className="border-b border-border bg-card/20 p-3">
                    <div className="flex flex-wrap gap-1">
                      {/* Text Formatting */}
                      <div className="flex gap-1 mr-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatBold}
                          title="Bold (Ctrl+B)"
                          className="h-8 w-8 p-0"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatItalic}
                          title="Italic (Ctrl+I)"
                          className="h-8 w-8 p-0"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatUnderline}
                          title="Underline (Ctrl+U)"
                          className="h-8 w-8 p-0"
                        >
                          <Underline className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatCode}
                          title="Inline Code"
                          className="h-8 w-8 p-0"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Headings */}
                      <div className="flex gap-1 mr-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => formatHeading(1)}
                          title="Heading 1"
                          className="h-8 px-2 text-xs font-bold"
                        >
                          H1
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => formatHeading(2)}
                          title="Heading 2"
                          className="h-8 px-2 text-xs font-bold"
                        >
                          H2
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => formatHeading(3)}
                          title="Heading 3"
                          className="h-8 px-2 text-xs font-bold"
                        >
                          H3
                        </Button>
                      </div>

                      {/* Lists and Quotes */}
                      <div className="flex gap-1 mr-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatList}
                          title="Bullet List"
                          className="h-8 w-8 p-0"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatOrderedList}
                          title="Numbered List"
                          className="h-8 w-8 p-0"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatQuote}
                          title="Quote"
                          className="h-8 w-8 p-0"
                        >
                          <Quote className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Links and Images */}
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatLink}
                          title="Insert Link"
                          className="h-8 w-8 p-0"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={formatImage}
                          title="Insert Image"
                          className="h-8 w-8 p-0"
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      💡 Tip: Use Markdown syntax for formatting. Select text
                      and click buttons to apply formatting.
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-auto p-6">
                  {isEditing ? (
                    isPreviewMode ? (
                      <div className="prose prose-sm max-w-none min-h-[calc(100vh-16rem)]">
                        {renderMarkdown(editContent)}
                      </div>
                    ) : (
                      <Textarea
                        ref={textareaRef}
                        className="min-h-[calc(100vh-16rem)] w-full p-4 font-mono text-sm leading-relaxed resize-none border-0 focus:ring-0 focus:outline-none bg-transparent"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Start writing your note in Markdown...\n\n# Heading 1\n## Heading 2\n\n**Bold text** and *italic text*\n\n- Bullet point\n1. Numbered list\n\n> Quote\n\n`inline code`\n\n[Link text](url)\n\n![Image alt](image-url)"
                        onKeyDown={(e) => {
                          // Handle keyboard shortcuts
                          if (e.ctrlKey || e.metaKey) {
                            switch (e.key) {
                              case "b":
                                e.preventDefault();
                                formatBold();
                                break;
                              case "i":
                                e.preventDefault();
                                formatItalic();
                                break;
                              case "u":
                                e.preventDefault();
                                formatUnderline();
                                break;
                              case "`":
                                e.preventDefault();
                                formatCode();
                                break;
                            }
                          }
                        }}
                      />
                    )
                  ) : (
                    <div className="prose prose-sm max-w-none min-h-[calc(100vh-12rem)]">
                      {renderMarkdown(selectedNote.content)}
                    </div>
                  )}
                </div>
                <div className="p-3 border-t text-xs text-muted-foreground">
                  Last updated:{" "}
                  {new Date(selectedNote.updated_at).toLocaleString()}
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
                Content (Markdown supported)
              </label>
              <Textarea
                id="note-content"
                placeholder="Write your note content here using Markdown...\n\nExamples:\n# Heading\n**Bold** and *italic*\n- List item\n> Quote\n`code`"
                className="min-h-[200px] font-mono text-sm"
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
