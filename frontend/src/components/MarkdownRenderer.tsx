'use client';

import { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className = '' }: MarkdownRendererProps) => {
  const htmlContent = useMemo(() => {
    const lines = content.split('\n');
    const output: string[] = [];
    let inUl = false;
    let inOl = false;
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let codeLang = '';

    const closeList = () => {
      if (inUl) { output.push('</ul>'); inUl = false; }
      if (inOl) { output.push('</ol>'); inOl = false; }
    };

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const inlineFormat = (s: string) =>
      s
        // Bold+italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // ── Fenced code blocks ───────────────────────────────────────────────
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          closeList();
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          codeLines = [];
        } else {
          inCodeBlock = false;
          const escaped = codeLines.map(escapeHtml).join('\n');
          output.push(
            `<pre class="bg-muted rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono whitespace-pre leading-relaxed">${escaped}</pre>`
          );
          codeLines = [];
        }
        continue;
      }
      if (inCodeBlock) { codeLines.push(line); continue; }

      // ── Headings ─────────────────────────────────────────────────────────
      if (line.startsWith('### ')) {
        closeList();
        output.push(`<h3 class="text-base font-semibold mt-4 mb-1">${inlineFormat(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        closeList();
        output.push(`<h2 class="text-lg font-semibold mt-4 mb-1">${inlineFormat(line.slice(3))}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        closeList();
        output.push(`<h1 class="text-xl font-bold mt-4 mb-2">${inlineFormat(line.slice(2))}</h1>`);
        continue;
      }

      // ── Horizontal rule ───────────────────────────────────────────────────
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        closeList();
        output.push('<hr class="my-3 border-border" />');
        continue;
      }

      // ── Numbered list ─────────────────────────────────────────────────────
      const olMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        if (inUl) { output.push('</ul>'); inUl = false; }
        if (!inOl) { output.push('<ol class="list-decimal pl-5 my-1 space-y-0.5">'); inOl = true; }
        output.push(`<li class="text-sm leading-relaxed">${inlineFormat(olMatch[2])}</li>`);
        continue;
      }

      // ── Unordered list ─────────────────────────────────────────────────────
      const ulMatch = line.match(/^[-*]\s+(.*)/);
      if (ulMatch) {
        if (inOl) { output.push('</ol>'); inOl = false; }
        if (!inUl) { output.push('<ul class="list-disc pl-5 my-1 space-y-0.5">'); inUl = true; }
        output.push(`<li class="text-sm leading-relaxed">${inlineFormat(ulMatch[1])}</li>`);
        continue;
      }

      // ── Blank line ────────────────────────────────────────────────────────
      if (line.trim() === '') {
        // Preserve list continuity across markdown spacing lines.
        // Closing here would restart <ol> numbering from 1 on the next item.
        if (inUl || inOl) {
          continue;
        }
        output.push('<div class="h-2"></div>');
        continue;
      }

      // ── Paragraph ────────────────────────────────────────────────────────
      closeList();
      output.push(`<p class="text-sm leading-relaxed">${inlineFormat(line)}</p>`);
    }

    closeList();
    return output.join('');
  }, [content]);

  return (
    <div
      className={`break-words ${className}`}
      style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
