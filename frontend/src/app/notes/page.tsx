
'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { NoteContentViewer } from '@/components/NoteContentViewer';
import type { Note } from '@/types';
import { useNotes } from '@/hooks/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LayoutGrid, List, Trash2, X, Save, Edit, Loader2, Copy, ArrowUpDown, Code2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
// Removed: useSafeFirestore, db, firebase imports

type Layout = 'grid' | 'list';


// Helper function to parse text and extract code blocks
function parseContentWithCode(content: string) {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  
  // Match code blocks with triple backticks (```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    // Add code block
    const codeContent = match[2] || '';
    const language = match[1] || '';
    if (codeContent.trim()) {
      parts.push({ type: 'code', content: codeContent.trim(), language });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }
  
  // If no code blocks found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }
  
  return parts;
}

function ViewNoteDialog({ note, isOpen, onOpenChange, onEdit, onCopy }: { note: Note | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onEdit: () => void, onCopy: () => void }) {
    if (!note) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-w-[98vw]">
                <DialogHeader>
                    <div className="flex items-center justify-between gap-4">
                        <DialogTitle className="text-2xl font-headline truncate">{note.title}</DialogTitle>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button variant="outline" size="sm" onClick={onCopy}>
                                <Copy className="h-4 w-4 mr-2" />Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="py-4">
                        <NoteContentViewer note={note} />
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function ViewNoteDialogOLD({ note, isOpen, onOpenChange, onEdit, onCopy }: { note: Note | null, isOpen: boolean, onOpenChange: (open: boolean) => void, onEdit: () => void, onCopy: () => void }) {
    if (!note) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-w-[95vw]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-headline">{note.title}</DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onCopy}>
                                <Copy className="h-4 w-4 mr-2" />Copy
                            </Button>
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="py-4 text-base leading-relaxed">{note.type === 'text' && (() => {
                            const parts = parseContentWithCode(String(note.content));
                            return (
                                <div className="space-y-4">
                                    {parts.map((part, idx) => (
                                        part.type === 'code' ? (
                                            <div key={idx}>
                                                {part.language && (
                                                    <div className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                                        <Code2 className="h-3 w-3" />
                                                        {part.language}
                                                    </div>
                                                )}
                                                <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <div className="flex min-w-fit">
                                                            {/* Line Numbers */}
                                                            <div className="bg-slate-950/90 px-3 py-4 text-slate-500 text-xs font-mono select-none border-r border-slate-700 sticky left-0 z-10">
                                                                {part.content.split('\n').map((_, i) => (
                                                                    <div key={i} className="leading-6 text-right whitespace-nowrap min-w-[2rem]">
                                                                        {i + 1}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {/* Code Content */}
                                                            <pre className="flex-1 p-4 overflow-visible">
                                                                <code className="font-mono text-sm text-slate-100 block" style={{
                                                                    textShadow: '0 0 2px rgba(168, 85, 247, 0.4)',
                                                                    whiteSpace: 'pre'
                                                                }}>{part.content}</code>
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={idx} className="overflow-x-auto">
                                                <p className="whitespace-pre-wrap break-words min-w-0">{part.content}</p>
                                            </div>
                                        )
                                    ))}
                                </div>
                            );
                        })()}
                        {note.type === 'markdown' && (() => {
                            const content = String(note.content);
                            const parts = parseContentWithCode(content);
                            
                            // If there are code blocks, render them separately
                            if (parts.some(p => p.type === 'code')) {
                                return (
                                    <div className="space-y-4">
                                        {parts.map((part, idx) => (
                                            part.type === 'code' ? (
                                                <div key={idx}>
                                                    {part.language && (
                                                        <div className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                                            <Code2 className="h-3 w-3" />
                                                            {part.language}
                                                        </div>
                                                    )}
                                                    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                                                        <div className="overflow-x-auto">
                                                            <div className="flex min-w-fit">
                                                                {/* Line Numbers */}
                                                                <div className="bg-slate-950/90 px-3 py-4 text-slate-500 text-xs font-mono select-none border-r border-slate-700 sticky left-0 z-10">
                                                                    {part.content.split('\n').map((_, i) => (
                                                                        <div key={i} className="leading-6 text-right whitespace-nowrap min-w-[2rem]">
                                                                            {i + 1}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {/* Code Content */}
                                                                <pre className="flex-1 p-4 overflow-visible">
                                                                    <code className="font-mono text-sm text-slate-100 block" style={{
                                                                        textShadow: '0 0 2px rgba(168, 85, 247, 0.4)',
                                                                        whiteSpace: 'pre'
                                                                    }}>{part.content}</code>
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div key={idx} className="overflow-x-auto">
                                                    <MarkdownRenderer content={part.content} />
                                                </div>
                                            )
                                        ))}
                                    </div>
                                );
                            } else {
                                // No code blocks, render as regular markdown
                                return (
                                    <div className="overflow-x-auto">
                                        <MarkdownRenderer content={content} />
                                    </div>
                                );
                            }
                        })()}
                        {note.type === 'snippet' && typeof note.content === 'object' && 'code' in note.content && (
                            <div className="space-y-4">
                                {note.content.language && (
                                    <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2">
                                        <Code2 className="h-3 w-3" />
                                        {note.content.language}
                                    </div>
                                )}
                                {note.content.input && (
                                    <div>
                                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span className="text-blue-600 dark:text-blue-400">📥</span>
                                            Input
                                        </div>
                                        <pre className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 rounded-lg overflow-x-auto text-sm">
                                            <code className="text-blue-900 dark:text-blue-100">{note.content.input}</code>
                                        </pre>
                                    </div>
                                )}
                                {note.content.output && (
                                    <div>
                                        <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span className="text-green-600 dark:text-green-400">📤</span>
                                            Output
                                        </div>
                                        <pre className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg overflow-x-auto text-sm">
                                            <code className="text-green-900 dark:text-green-100">{note.content.output}</code>
                                        </pre>
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Code2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-semibold">Code</span>
                                    </div>
                                    <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <div className="flex min-w-fit">
                                                {/* Line Numbers */}
                                                <div className="bg-slate-950/90 px-3 py-4 text-slate-500 text-xs font-mono select-none border-r border-slate-700 sticky left-0 z-10">
                                                    {note.content.code.split('\n').map((_, i) => (
                                                        <div key={i} className="leading-6 text-right whitespace-nowrap min-w-[2rem]">
                                                            {i + 1}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Code Content */}
                                                <pre className="flex-1 p-4 overflow-visible">
                                                    <code className="text-slate-100 font-mono text-sm block" style={{
                                                        textShadow: '0 0 2px rgba(168, 85, 247, 0.4)',
                                                        whiteSpace: 'pre'
                                                    }}>{note.content.code}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {note.type === 'checklist' && Array.isArray(note.content) && (
                            <ul className="space-y-3">
                                {note.content.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Checkbox checked={item.completed} disabled className="mt-1" />
                                        <span className={cn("flex-1", item.completed && 'line-through text-muted-foreground')}>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function NewNoteCard({ onSave, onCancel }: { onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void; onCancel: () => void; }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'text' | 'checklist' | 'markdown' | 'snippet'>('text');
  const [textContent, setTextContent] = useState('');
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; completed: boolean }[]>([{ text: '', completed: false }]);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleAddItem = () => setChecklistItems([...checklistItems, { text: '', completed: false }]);
  const handleItemChange = (index: number, newText: string) => {
    const newItems = [...checklistItems]; newItems[index].text = newText; setChecklistItems(newItems);
  };
  const handleRemoveItem = (index: number) => {
    if (checklistItems.length > 1) setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };
  const handleSaveClick = () => {
    if (!title.trim()) return;
    let content: string | { text: string; completed: boolean }[] | { code: string; input?: string; output?: string; language?: string };
    
    if (type === 'snippet') {
      if (!codeContent.trim()) return;
      content = { 
        code: codeContent,
        ...(codeLanguage.trim() && { language: codeLanguage }),
        ...(codeInput.trim() && { input: codeInput }),
        ...(codeOutput.trim() && { output: codeOutput })
      };
    } else if (type === 'text' || type === 'markdown') {
      content = textContent;
      if (content.trim() === '') return;
    } else {
      content = checklistItems.filter(item => item.text.trim() !== '');
      if (content.length === 0) return;
    }
    
    onSave({ title, content, type });
  };

  return (
    <Card className="flex flex-col h-full border-primary border-2 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
            <Input 
              ref={titleInputRef}
              placeholder="                 Title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="text-2xl font-headline font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto" 
            />
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8"><X className="h-4 w-4" /></Button>
        </div>
        <Select value={type} onValueChange={(v) => setType(v as 'text' | 'checklist' | 'markdown' | 'snippet')}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Note Type" /></SelectTrigger>
            <SelectContent><SelectItem value="text">Text Note</SelectItem><SelectItem value="checklist">Checklist</SelectItem><SelectItem value="markdown">Markdown</SelectItem><SelectItem value="snippet">Code Snippet</SelectItem></SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {(type === 'text' || type === 'markdown') ? (
          <ScrollArea className="flex-grow pr-4">
            <Textarea 
              placeholder={type === 'markdown' ? "Type your markdown here...\n\n# Heading\n**bold** *italic*\n- List item" : "Type your note here..."} 
              className="min-h-[300px] resize-none w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
              value={textContent} 
              onChange={(e) => setTextContent(e.target.value)} 
            />
          </ScrollArea>
        ) : type === 'snippet' ? (
          <div className="flex-grow flex flex-col gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-muted-foreground">
                <Code2 className="h-3 w-3" />
                Language (Optional)
              </label>
              <Input 
                placeholder="e.g., javascript, python, typescript..." 
                className="h-9 text-sm font-mono" 
                value={codeLanguage} 
                onChange={(e) => setCodeLanguage(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <span>📥</span>
                Input (Optional)
              </label>
              <Textarea 
                placeholder="Example input for your code..." 
                className="h-20 resize-none font-mono text-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                value={codeInput} 
                onChange={(e) => setCodeInput(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-green-600 dark:text-green-400">
                <span>📤</span>
                Output (Optional)
              </label>
              <Textarea 
                placeholder="Expected output..." 
                className="h-20 resize-none font-mono text-sm bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                value={codeOutput} 
                onChange={(e) => setCodeOutput(e.target.value)} 
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold mb-1.5 block flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Code2 className="h-4 w-4" />
                Code *
              </label>
              <Textarea 
                placeholder="// Your code here..." 
                className="h-32 resize-none font-mono text-sm bg-gradient-to-br from-slate-900/5 to-slate-800/5 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-300 dark:border-slate-700" 
                value={codeContent} 
                onChange={(e) => setCodeContent(e.target.value)} 
              />
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-grow h-48 pr-4">
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox disabled />
                  <Input value={item.text} onChange={(e) => handleItemChange(index, e.target.value)} placeholder={`List item ${index + 1}`} className="h-8"/>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => handleRemoveItem(index)} disabled={checklistItems.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2"><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter><Button onClick={handleSaveClick} className="w-full"><Save className="mr-2 h-4 w-4"/>Save Note</Button></CardFooter>
    </Card>
  );
}

function EditNoteCard({ note, onSave, onCancel, onDelete }: { note: Note; onSave: (note: Note) => void; onCancel: () => void; onDelete: (noteId: string) => void; }) {
  const [title, setTitle] = useState(note.title);
  const [textContent, setTextContent] = useState(typeof note.content === 'string' ? note.content : '');
  const [codeContent, setCodeContent] = useState(typeof note.content === 'object' && 'code' in note.content ? note.content.code : '');
  const [codeLanguage, setCodeLanguage] = useState(typeof note.content === 'object' && 'code' in note.content ? note.content.language || '' : '');
  const [codeInput, setCodeInput] = useState(typeof note.content === 'object' && 'code' in note.content ? note.content.input || '' : '');
  const [codeOutput, setCodeOutput] = useState(typeof note.content === 'object' && 'code' in note.content ? note.content.output || '' : '');
  const [checklistItems, setChecklistItems] = useState(Array.isArray(note.content) ? [...note.content] : [{ text: '', completed: false }]);

  const handleAddItem = () => setChecklistItems([...checklistItems, { text: '', completed: false }]);
  const handleItemTextChange = (index: number, newText: string) => { const newItems = [...checklistItems]; newItems[index].text = newText; setChecklistItems(newItems); };
  const handleItemCompletionChange = (index: number, isChecked: boolean) => { const newItems = [...checklistItems]; newItems[index].completed = isChecked; setChecklistItems(newItems); };
  const handleRemoveItem = (index: number) => { if (checklistItems.length > 1) setChecklistItems(checklistItems.filter((_, i) => i !== index)); };
  const handleSaveClick = () => {
    if (!title.trim()) return;
    let content: string | { text: string; completed: boolean }[] | { code: string; input?: string; output?: string; language?: string };
    
    if (note.type === 'snippet') {
      if (!codeContent.trim()) return;
      content = { 
        code: codeContent,
        ...(codeLanguage.trim() && { language: codeLanguage }),
        ...(codeInput.trim() && { input: codeInput }),
        ...(codeOutput.trim() && { output: codeOutput })
      };
    } else if (note.type === 'text' || note.type === 'markdown') {
      content = textContent;
      if (content.trim() === '') return;
    } else {
      content = checklistItems.filter(item => item.text.trim() !== '');
      if (content.length === 0) return;
    }
    
    const updatedNote: Note = { ...note, title, content, type: note.type };
    onSave(updatedNote);
  };

  return (
    <Card className="flex flex-col h-full border-primary border-2 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center gap-2"><Input placeholder="Note Title..." value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-headline font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto" /></div>
        <Badge variant="outline" className="capitalize w-fit">{note.type}</Badge>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col min-h-0">
        {(note.type === 'text' || note.type === 'markdown') ? (
           <ScrollArea className="flex-grow pr-4">
             <Textarea 
               placeholder={note.type === 'markdown' ? "Type your markdown here..." : "Type your note here..."} 
               className="min-h-[400px] resize-none w-full rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
               value={textContent} 
               onChange={(e) => setTextContent(e.target.value)} 
             />
           </ScrollArea>
        ) : note.type === 'snippet' ? (
          <ScrollArea className="flex-grow pr-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-muted-foreground">
                  <Code2 className="h-3 w-3" />
                  Language (Optional)
                </label>
                <Input 
                  placeholder="e.g., javascript, python, typescript..." 
                  className="h-9 text-sm font-mono" 
                  value={codeLanguage} 
                  onChange={(e) => setCodeLanguage(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <span>📥</span>
                  Input (Optional)
                </label>
                <Textarea 
                  placeholder="Example input for your code..." 
                  className="min-h-[80px] resize-none font-mono text-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                  value={codeInput} 
                  onChange={(e) => setCodeInput(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2 text-green-600 dark:text-green-400">
                  <span>📤</span>
                  Output (Optional)
                </label>
                <Textarea 
                  placeholder="Expected output..." 
                  className="min-h-[80px] resize-none font-mono text-sm bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                  value={codeOutput} 
                  onChange={(e) => setCodeOutput(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Code2 className="h-4 w-4" />
                  Code *
                </label>
                <Textarea 
                  placeholder="// Your code here..." 
                  className="min-h-[150px] resize-none font-mono text-sm bg-gradient-to-br from-slate-900/5 to-slate-800/5 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-300 dark:border-slate-700" 
                  value={codeContent} 
                  onChange={(e) => setCodeContent(e.target.value)} 
                />
              </div>
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="flex-grow h-48 pr-4">
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={item.completed} onCheckedChange={(checked) => handleItemCompletionChange(index, !!checked)} />
                  <Input value={item.text} onChange={(e) => handleItemTextChange(index, e.target.value)} placeholder={`List item ${index + 1}`} />
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive flex-shrink-0" onClick={() => handleRemoveItem(index)} disabled={checklistItems.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2"><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div><Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(note.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button></div>
        <div className="flex gap-2"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4"/>Save</Button></div>
      </CardFooter>
    </Card>
  );
}

function NoteCard({ note, onEdit, onView, onCopy }: { note: Note; onEdit: () => void; onView: () => void; onCopy: () => void }) {
  return (
    <Card className="flex flex-col group-[.is-grid]:h-96 hover:shadow-lg transition-shadow duration-300 group-[.is-list]:flex-row group-[.is-list]:items-center group-[.is-list]:p-3 min-w-0 overflow-hidden">
      <div onClick={onView} className="cursor-pointer flex-grow flex flex-col min-h-0 min-w-0">
          <CardHeader className="group-[.is-list]:p-0 min-w-0">
            <CardTitle className="font-headline text-lg group-[.is-list]:text-base break-words overflow-wrap-anywhere">{note.title}</CardTitle>
            <div className="text-xs text-muted-foreground pt-1 flex items-center gap-2 group-[.is-list]:hidden"><span>{format(parseISO(note.createdAt), 'MMM d, yyyy')}</span><Badge variant="outline" className="capitalize">{note.type}</Badge></div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col min-h-0 p-4 pt-0 group-[.is-list]:hidden min-w-0">
            <ScrollArea className="flex-grow pr-4 min-w-0">
                {note.type === 'text' && (() => {
                    const parts = parseContentWithCode(String(note.content));
                    const hasCode = parts.some(p => p.type === 'code');
                    
                    if (hasCode) {
                        return (
                            <div className="space-y-2">
                                {parts.slice(0, 2).map((part, idx) => (
                                    part.type === 'code' ? (
                                        <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-700 rounded overflow-auto max-w-full">
                                            <div className="flex min-w-fit">
                                                <div className="bg-slate-950/50 px-2 py-2 text-slate-500 text-xs font-mono select-none border-r border-slate-700 leading-5 sticky left-0 z-10 whitespace-nowrap">
                                                    {part.content.slice(0, 100).split('\n').map((_, i) => (
                                                        <div key={i}>{i + 1}</div>
                                                    ))}
                                                </div>
                                                <pre className="flex-1 p-2">
                                                    <code className="font-mono text-slate-100 text-xs leading-5 whitespace-pre">{part.content.slice(0, 100)}{part.content.length > 100 ? '...' : ''}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <p key={idx} className="text-sm text-muted-foreground line-clamp-3">{part.content}</p>
                                    )
                                ))}
                                {parts.length > 2 && <p className="text-xs text-muted-foreground">...</p>}
                            </div>
                        );
                    } else {
                        return (
                            <div className="overflow-x-auto max-w-full">
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6 break-words overflow-wrap-anywhere max-w-full">{String(note.content)}</p>
                            </div>
                        );
                    }
                })()}
                {note.type === 'markdown' && (() => {
                    const parts = parseContentWithCode(String(note.content));
                    const hasCode = parts.some(p => p.type === 'code');
                    
                    if (hasCode) {
                        return (
                            <div className="space-y-2">
                                {parts.slice(0, 2).map((part, idx) => (
                                    part.type === 'code' ? (
                                        <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-700 rounded overflow-auto max-w-full">
                                            <div className="flex min-w-fit">
                                                <div className="bg-slate-950/50 px-2 py-2 text-slate-500 text-xs font-mono select-none border-r border-slate-700 leading-5 sticky left-0 z-10 whitespace-nowrap">
                                                    {part.content.slice(0, 100).split('\n').map((_, i) => (
                                                        <div key={i}>{i + 1}</div>
                                                    ))}
                                                </div>
                                                <pre className="flex-1 p-2">
                                                    <code className="font-mono text-slate-100 text-xs leading-5 whitespace-pre">{part.content.slice(0, 100)}{part.content.length > 100 ? '...' : ''}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={idx} className="text-sm text-muted-foreground line-clamp-3">
                                            <MarkdownRenderer content={part.content} className="text-sm" />
                                        </div>
                                    )
                                ))}
                                {parts.length > 2 && <p className="text-xs text-muted-foreground">...</p>}
                            </div>
                        );
                    } else {
                        return (
                            <div className="overflow-x-auto max-w-full">
                                <MarkdownRenderer content={String(note.content)} className="text-sm text-muted-foreground line-clamp-6" />
                            </div>
                        );
                    }
                })()}
                {note.type === 'snippet' && typeof note.content === 'object' && 'code' in note.content && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Code2 className="h-5 w-5" />
                      <span className="text-sm font-semibold">Code Snippet</span>
                    </div>
                    {note.content.language && (
                      <div className="text-xs text-muted-foreground">
                        Language: <span className="font-mono font-semibold">{note.content.language}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">
                      Click to view code with {note.content.input ? 'input, ' : ''}{note.content.output ? 'output, and ' : ''}full details
                    </p>
                  </div>
                )}
                {note.type === 'checklist' && Array.isArray(note.content) && (
                  <ul className="space-y-2">{note.content.map((item, index) => (<li key={index} className="flex items-center gap-2"><Checkbox checked={item.completed} disabled /><span className={cn(item.completed && 'line-through text-muted-foreground')}>{item.text}</span></li>))}</ul>
                )}
            </ScrollArea>
          </CardContent>
      </div>
      <CardFooter className="pt-4 flex-shrink-0 group-[.is-list]:p-0 group-[.is-list]:ml-4">
          <div className="flex gap-2 w-full group-[.is-list]:w-auto">
            <Button variant="outline" size="sm" className="group-[.is-list]:hidden w-full" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4 mr-2" />Edit Note
            </Button>
            <Button variant="outline" size="sm" className="group-[.is-grid]:hidden size-8 p-0" onClick={(e) => { e.stopPropagation(); onCopy(); }}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="group-[.is-grid]:hidden size-8 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
      </CardFooter>
    </Card>
  );
}

export default function NotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    notes,
    isLoading,
    addNote: addNoteApi,
    updateNote: updateNoteApi,
    deleteNote: deleteNoteApi,
  } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<Layout>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // Data loaded via useNotes hook


  const handleSaveNote = async (newNoteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addNoteApi(newNoteData);
      setIsAddingNote(false);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Save failed',
        description: 'Could not save note. Please check backend/API and try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateNote = async (updatedNote: Note) => {
    const { id, ...updates } = updatedNote;
    try { await updateNoteApi({ id, updates }); }
    catch (e) { console.error(e); }
    setEditingNoteId(null);
  };

  const handleDeleteNote = async (noteId: string) => {
    try { await deleteNoteApi(noteId); }
    catch (e) { console.error(e); }
    setEditingNoteId(null);
  };
  
  const handleCancelNewNote = () => setIsAddingNote(false);

  const handleCopyNote = async (note: Note) => {
    try {
      let textToCopy = `${note.title}\n\n`;
      
      if (note.type === 'text' || note.type === 'markdown') {
        textToCopy += String(note.content);
      } else if (note.type === 'checklist' && Array.isArray(note.content)) {
        textToCopy += note.content.map(item => `${item.completed ? '☑' : '☐'} ${item.text}`).join('\n');
      } else if (note.type === 'snippet' && typeof note.content === 'object' && 'code' in note.content) {
        if (note.content.language) {
          textToCopy += `Language: ${note.content.language}\n\n`;
        }
        if (note.content.input) {
          textToCopy += `INPUT:\n${note.content.input}\n\n`;
        }
        if (note.content.output) {
          textToCopy += `OUTPUT:\n${note.content.output}\n\n`;
        }
        textToCopy += `CODE:\n${note.content.code}`;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Note copied!",
        description: "The note content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy note content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const filteredAndSortedNotes = notes
    .filter(note => {
      const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
      let contentMatch = false;
      if (typeof note.content === 'string') contentMatch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
      else if (Array.isArray(note.content)) contentMatch = note.content.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()));
      return titleMatch || contentMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else { // title
        return a.title.localeCompare(b.title);
      }
    });
  
  return (
    <AppLayout>
      {isLoading ? (
        <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading notes...</p></div>
      ) : (
      <>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        <header>
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold font-headline">Personal Notes</h1></div>
            <Button onClick={() => { setIsAddingNote(true); setEditingNoteId(null); }} disabled={isAddingNote || !!editingNoteId}><PlusCircle className="mr-2 h-4 w-4" />New Note</Button>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search notes..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/></div>
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'title') => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">A-Z (Title)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={layout === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('grid')}><LayoutGrid className="h-4 w-4" /></Button>
            <Button variant={layout === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('list')}><List className="h-4 w-4" /></Button>
          </div>
        </header>

        <div className={cn('grid group max-w-full overflow-x-hidden', layout === 'grid' ? 'gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 is-grid' : 'gap-4 grid-cols-1 is-list')}>
          {isAddingNote && ( <NewNoteCard onSave={handleSaveNote} onCancel={handleCancelNewNote} /> )}
          {filteredAndSortedNotes.map((note) => (
            editingNoteId === note.id ? (
              <EditNoteCard key={note.id} note={note} onSave={handleUpdateNote} onCancel={() => setEditingNoteId(null)} onDelete={handleDeleteNote} />
            ) : (
              <NoteCard key={note.id} note={note} onView={() => { if (isAddingNote || editingNoteId) return; setViewingNote(note) }} onEdit={() => { if (isAddingNote) setIsAddingNote(false); setEditingNoteId(note.id); }} onCopy={() => handleCopyNote(note)} />
            )
          ))}
        </div>
        {!isAddingNote && !editingNoteId && filteredAndSortedNotes.length === 0 && (
            <div className="text-center py-16 text-muted-foreground"><p>No notes found.</p><p className="text-sm">Click "New Note" to get started.</p></div>
        )}
      </div>
      <ViewNoteDialog 
        note={viewingNote} 
        isOpen={!!viewingNote} 
        onOpenChange={(open) => !open && setViewingNote(null)}
        onEdit={() => {
          if (viewingNote) {
            setEditingNoteId(viewingNote.id);
            setViewingNote(null);
          }
        }}
        onCopy={() => {
          if (viewingNote) {
            handleCopyNote(viewingNote);
          }
        }}
      />
      </>
      )}
    </AppLayout>
  );
}
