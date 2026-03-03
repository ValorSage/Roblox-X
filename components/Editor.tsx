'use client'

import React from 'react'
import { ExplorerItem } from '@/types/explorer'

interface EditorProps {
  item: ExplorerItem | null;
  onContentChange: (id: string, content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ item, onContentChange }) => {
  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-gray-500 italic">
        Select a script to edit
      </div>
    );
  }

  if (item.type === 'Folder' || item.type === 'Model' || item.type === 'Part' || item.type === 'Tool' || item.type === 'Effect' || item.type === 'Team') {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-gray-500 italic">
        {item.type}s cannot be edited directly
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
      <div className="h-9 bg-[#2d2d2d] border-b border-[#333] flex items-center px-4 gap-2 shrink-0 overflow-x-auto no-scrollbar">
        <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{item.name}</span>
        <span className="text-[10px] bg-[#3c3c3c] px-1.5 py-0.5 rounded text-gray-500 uppercase whitespace-nowrap">{item.type}</span>
      </div>
      <textarea
        className="flex-1 w-full bg-transparent text-gray-300 p-4 font-mono text-sm outline-none resize-none leading-relaxed md:text-base"
        value={item.content || ''}
        onChange={(e) => onContentChange(item.id, e.target.value)}
        spellCheck={false}
        placeholder="-- Write your code here..."
      />
    </div>
  );
};
