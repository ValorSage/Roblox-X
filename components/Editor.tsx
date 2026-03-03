'use client'

import React, { useState, useMemo } from 'react'
import { ExplorerItem } from '@/types/explorer'
import { Play, Share2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorProps {
  item: ExplorerItem | null;
  items: Record<string, ExplorerItem>;
  onContentChange: (id: string, content: string) => void;
  onRun: (id: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ item, items, onContentChange, onRun }) => {
  const [showDeps, setShowDeps] = useState(false);

  const dependencies = useMemo(() => {
    if (!item || !item.content) return [];
    // Simple regex to find require("ModuleName") or require('ModuleName')
    const matches = item.content.matchAll(/require\s*\(\s*['"](.*?)['"]\s*\)/g);
    const names = Array.from(matches).map(m => m[1]);
    
    // Resolve names to actual items in the explorer
    return names.map(name => {
      const foundItem = Object.values(items).find(it => it.name === name && it.type === 'ModuleScript');
      return {
        name,
        id: foundItem?.id,
        found: !!foundItem
      };
    });
  }, [item, items]);

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
      <div className="h-9 bg-[#2d2d2d] border-b border-[#333] flex items-center px-4 gap-4 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">{item.name}</span>
          <span className="text-[10px] bg-[#3c3c3c] px-1.5 py-0.5 rounded text-gray-500 uppercase whitespace-nowrap">{item.type}</span>
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
          <button 
            onClick={() => onRun(item.id)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#007acc] hover:bg-[#0062a3] text-white rounded text-[10px] font-bold transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            RUN
          </button>
          <button 
            onClick={() => setShowDeps(!showDeps)}
            className={cn(
              "p-1.5 rounded hover:bg-white/10 transition-colors relative",
              showDeps && "bg-white/10"
            )}
            title="Dependencies"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-400" />
            {dependencies.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border border-[#2d2d2d]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col">
        {showDeps && (
          <div className="absolute top-0 right-0 w-64 m-2 bg-[#252526] border border-[#333] shadow-2xl z-10 rounded-md overflow-hidden flex flex-col">
            <div className="p-2 bg-[#2d2d2d] border-b border-[#333] text-[10px] font-bold uppercase text-gray-400 flex items-center gap-2">
              <Share2 className="w-3 h-3" />
              Dependency Graph
            </div>
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {dependencies.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic">No ModuleScripts required</div>
              ) : (
                dependencies.map((dep, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-2 text-[11px] p-1.5 rounded border transition-colors",
                    dep.found ? "text-gray-300 bg-white/5 border-white/5" : "text-red-400 bg-red-400/5 border-red-400/20"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      dep.found ? "bg-yellow-500" : "bg-red-500"
                    )} />
                    <span className="truncate flex-1">{dep.name}</span>
                    {!dep.found && <span className="text-[8px] uppercase font-bold opacity-60">Missing</span>}
                  </div>
                ))
              )}
            </div>
            <div className="p-2 bg-[#1e1e1e] text-[9px] text-gray-500 flex items-center gap-1">
              <Info className="w-2.5 h-2.5" />
              Detected via require() statements
            </div>
          </div>
        )}

        <textarea
          className="flex-1 w-full bg-transparent text-gray-300 p-4 font-mono text-sm outline-none resize-none leading-relaxed md:text-base"
          value={item.content || ''}
          onChange={(e) => onContentChange(item.id, e.target.value)}
          spellCheck={false}
          placeholder="-- Write your code here...&#10;-- Example:&#10;-- print('Hello World')&#10;-- error('Something went wrong')&#10;-- require('MyModule')"
        />
      </div>
    </div>
  );
};
