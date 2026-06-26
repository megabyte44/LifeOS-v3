'use client';

import { useState } from 'react';
import { Code2, Copy, Check, Maximize2 } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import type { Note } from '@/types';

interface NoteContentViewerProps {
  note: Note;
  compact?: boolean;
}

// Parse content to extract code blocks
function parseContentWithCode(content: string) {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index).trim();
      if (textContent) {
        parts.push({ type: 'text', content: textContent });
      }
    }
    
    const codeContent = match[2] || '';
    const language = match[1] || '';
    if (codeContent.trim()) {
      parts.push({ type: 'code', content: codeContent.trim(), language });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    const textContent = content.slice(lastIndex).trim();
    if (textContent) {
      parts.push({ type: 'text', content: textContent });
    }
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }
  
  return parts;
}

// Code block component with proper horizontal scroll
const CodeBlock = ({ code, language }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');
  
  return (
    <div className={cn(
      "my-4 rounded-lg overflow-hidden border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900",
      fullscreen && "fixed inset-4 z-50 flex flex-col"
    )}>
      {/* Header with language and buttons */}
      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {language && (
            <div className="text-xs font-semibold text-purple-400 flex items-center gap-2">
              <Code2 className="h-3 w-3" />
              {language}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="ml-1.5 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={() => setFullscreen(!fullscreen)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">{fullscreen ? 'Exit' : 'Expand'}</span>
          </Button>
        </div>
      </div>
      
      {/* CRITICAL: This wrapper enables horizontal scroll on mobile */}
      <div className={cn(
        "overflow-x-auto overflow-y-visible w-full",
        fullscreen ? "flex-1" : "max-h-[500px] overflow-y-auto"
      )}>
        <div className="flex min-w-max">
          {/* Line numbers - sticky on left */}
          <div className="flex-shrink-0 bg-slate-950/90 px-3 py-4 text-slate-500 text-xs font-mono select-none border-r border-slate-700 sticky left-0 z-10">
            {lines.map((_, i) => (
              <div key={i} className="leading-6 text-right min-w-[2rem]">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Code content - scrolls horizontally */}
          <pre className="flex-1 p-4 min-w-0">
            <code 
              className="font-mono text-sm text-slate-100 block whitespace-pre"
              style={{ textShadow: '0 0 2px rgba(168, 85, 247, 0.4)' }}
            >
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

// Main component
export function NoteContentViewer({ note, compact = false }: NoteContentViewerProps) {
  // TEXT TYPE
  if (note.type === 'text') {
    const parts = parseContentWithCode(String(note.content));
    return (
      <div className="space-y-4">
        {parts.map((part, idx) => (
          part.type === 'code' ? (
            <CodeBlock key={idx} code={part.content} language={part.language} />
          ) : (
            <div key={idx} className="overflow-x-auto">
              <p className="whitespace-pre-wrap break-words">{part.content}</p>
            </div>
          )
        ))}
      </div>
    );
  }
  
  // MARKDOWN TYPE
  if (note.type === 'markdown') {
    const content = String(note.content);
    const parts = parseContentWithCode(content);
    
    if (parts.some(p => p.type === 'code')) {
      return (
        <div className="space-y-4">
          {parts.map((part, idx) => (
            part.type === 'code' ? (
              <CodeBlock key={idx} code={part.content} language={part.language} />
            ) : (
              <div key={idx} className="overflow-x-auto">
                <MarkdownRenderer content={part.content} />
              </div>
            )
          ))}
        </div>
      );
    } else {
      return (
        <div className="overflow-x-auto">
          <MarkdownRenderer content={content} />
        </div>
      );
    }
  }
  
  // SNIPPET TYPE (Code with input/output)
  if (note.type === 'snippet' && typeof note.content === 'object' && 'code' in note.content) {
    return (
      <div className="space-y-4">
        {note.content.language && (
          <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-2">
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
            <div className="overflow-x-auto rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
              <pre className="text-sm">
                <code className="text-blue-900 dark:text-blue-100 whitespace-pre">
                  {note.content.input}
                </code>
              </pre>
            </div>
          </div>
        )}
        
        {note.content.output && (
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">📤</span>
              Output
            </div>
            <div className="overflow-x-auto rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
              <pre className="text-sm">
                <code className="text-green-900 dark:text-green-100 whitespace-pre">
                  {note.content.output}
                </code>
              </pre>
            </div>
          </div>
        )}
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold">Code</span>
          </div>
          <CodeBlock code={note.content.code} language={note.content.language} />
        </div>
      </div>
    );
  }
  
  // CHECKLIST TYPE
  if (note.type === 'checklist' && Array.isArray(note.content)) {
    return (
      <ul className="space-y-3">
        {note.content.map((item: { text: string; completed: boolean }, index: number) => (
          <li key={index} className="flex items-start gap-3">
            <Checkbox checked={item.completed} disabled className="mt-1" />
            <span className={cn("flex-1", item.completed && 'line-through text-muted-foreground')}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  
  return <p className="text-muted-foreground">Unsupported note type</p>;
}
