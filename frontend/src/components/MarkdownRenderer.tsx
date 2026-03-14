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
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted/70 px-1.5 py-0.5 rounded text-[12px] font-mono text-foreground/80">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">$1</a>');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Fenced code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          closeList();
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          codeLines = [];
        } else {
          inCodeBlock = false;
          const escaped = codeLines.map(escapeHtml).join('\n');
          const langLabel = codeLang
            ? `<div class="flex items-center justify-between px-4 py-2 border-b border-white/5 text-[11px] text-white/40"><span>${escapeHtml(codeLang)}</span><button onclick="(function(btn){var code=btn.closest('.code-block-wrapper').querySelector('code');navigator.clipboard.writeText(code.textContent);btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy'},1500)})(this)" class="hover:text-white/70 transition-colors cursor-pointer">Copy</button></div>`
            : `<div class="flex items-center justify-end px-4 py-2 border-b border-white/5"><button onclick="(function(btn){var code=btn.closest('.code-block-wrapper').querySelector('code');navigator.clipboard.writeText(code.textContent);btn.textContent='Copied!';setTimeout(function(){btn.textContent='Copy'},1500)})(this)" class="text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer">Copy</button></div>`;
          output.push(
            `<div class="code-block-wrapper rounded-xl bg-[#1e1e1e] dark:bg-[#0d0d0d] my-3 overflow-hidden">${langLabel}<pre class="p-4 overflow-x-auto"><code class="text-[13px] font-mono leading-relaxed text-[#d4d4d4]">${escaped}</code></pre></div>`
          );
          codeLines = [];
        }
        continue;
      }
      if (inCodeBlock) { codeLines.push(line); continue; }

      // Headings
      if (line.startsWith('### ')) {
        closeList();
        output.push(`<h3 class="text-base font-semibold mt-5 mb-1.5">${inlineFormat(line.slice(4))}</h3>`);
        continue;
      }
      if (line.startsWith('## ')) {
        closeList();
        output.push(`<h2 class="text-lg font-semibold mt-5 mb-1.5">${inlineFormat(line.slice(3))}</h2>`);
        continue;
      }
      if (line.startsWith('# ')) {
        closeList();
        output.push(`<h1 class="text-xl font-bold mt-5 mb-2">${inlineFormat(line.slice(2))}</h1>`);
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        closeList();
        output.push('<hr class="my-4 border-border/30" />');
        continue;
      }

      // Numbered list
      const olMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        if (inUl) { output.push('</ul>'); inUl = false; }
        if (!inOl) { output.push('<ol class="list-decimal pl-5 my-2 space-y-1">'); inOl = true; }
        output.push(`<li class="text-sm leading-relaxed">${inlineFormat(olMatch[2])}</li>`);
        continue;
      }

      // Unordered list
      const ulMatch = line.match(/^[-*]\s+(.*)/);
      if (ulMatch) {
        if (inOl) { output.push('</ol>'); inOl = false; }
        if (!inUl) { output.push('<ul class="list-disc pl-5 my-2 space-y-1">'); inUl = true; }
        output.push(`<li class="text-sm leading-relaxed">${inlineFormat(ulMatch[1])}</li>`);
        continue;
      }

      // Blank line
      if (line.trim() === '') {
        if (inUl || inOl) {
          continue;
        }
        output.push('<div class="h-3"></div>');
        continue;
      }

      // Paragraph
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
