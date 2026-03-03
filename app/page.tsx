'use client'

import React, { useState, useEffect } from 'react'
import { Explorer } from '@/components/Explorer'
import { Editor } from '@/components/Editor'
import { ExplorerState, ExplorerItem } from '@/types/explorer'
import { motion, AnimatePresence } from 'motion/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Menu, X, Play, Terminal, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'roblox_explorer_state'

interface Log {
  type: 'info' | 'error' | 'warn';
  message: string;
  timestamp: string;
}

const INITIAL_STATE: ExplorerState = {
  items: {
    'workspace': { id: 'workspace', name: 'Workspace', type: 'Folder', parentId: null, isOpen: true, children: [], isSystemItem: true },
    'replicated-first': { id: 'replicated-first', name: 'ReplicatedFirst', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
    'replicated-storage': { id: 'replicated-storage', name: 'ReplicatedStorage', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
    'server-script-service': { id: 'server-script-service', name: 'ServerScriptService', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
    'starter-pack': { id: 'starter-pack', name: 'StarterPack', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
    'starter-player-scripts': { id: 'starter-player-scripts', name: 'StarterPlayerScripts', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
    'starter-character-scripts': { id: 'starter-character-scripts', name: 'StarterCharacterScripts', type: 'Folder', parentId: null, isOpen: false, children: [], isSystemItem: true },
  },
  rootIds: [
    'workspace', 
    'replicated-first',
    'replicated-storage', 
    'server-script-service', 
    'starter-pack',
    'starter-player-scripts', 
    'starter-character-scripts'
  ],
}

export default function Home() {
  const [state, setState] = useState<ExplorerState>(INITIAL_STATE)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [isExplorerOpen, setIsExplorerOpen] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [isOutputOpen, setIsOutputOpen] = useState(false)

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ExplorerState
        
        // CLEAN RULE: Remove any invalid items that might be in localStorage from older versions
        const validTypes = ['Script', 'LocalScript', 'ModuleScript', 'Folder', 'Tool'];
        const cleanedItems: Record<string, ExplorerItem> = {};
        
        // First pass: copy only valid types and core folders
        Object.keys(parsed.items).forEach(id => {
          const item = parsed.items[id];
          if (validTypes.includes(item.type) || item.isSystemItem) {
            cleanedItems[id] = item;
          }
        });

        // Second pass: remove children references that no longer exist
        Object.keys(cleanedItems).forEach(id => {
          const item = cleanedItems[id];
          if (item.children) {
            item.children = item.children.filter(childId => cleanedItems[childId]);
          }
        });

        // Check if core folders exist, if not, merge with INITIAL_STATE or reset
        const hasCoreFolders = parsed.rootIds.includes('workspace') && parsed.rootIds.includes('server-script-service')
        
        setTimeout(() => {
          if (!hasCoreFolders) {
            setState(INITIAL_STATE)
          } else {
            setState({
              ...parsed,
              items: cleanedItems
            })
          }
        }, 0)
      } catch (e) {
        console.error('Failed to parse saved state', e)
      }
    }
    setTimeout(() => {
      setIsMounted(true)
    }, 0)
  }, [])

  // Sync explorer state with mobile status on first load or resize
  useEffect(() => {
    if (isMounted && !hasInitialized && isMobile !== undefined) {
      const timer = setTimeout(() => {
        setIsExplorerOpen(!isMobile)
        setHasInitialized(true)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isMobile, hasInitialized, isMounted])

  // Also handle screen resizing after initialization
  useEffect(() => {
    if (isMounted && hasInitialized && isMobile !== undefined) {
      const timer = setTimeout(() => {
        setIsExplorerOpen(!isMobile)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isMobile, hasInitialized, isMounted])

  // Save to localStorage
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isMounted])

  const handleUpdateState = (newState: ExplorerState) => {
    setState(newState)
  }

  const handleContentChange = (id: string, content: string) => {
    setState(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: { ...prev.items[id], content }
      }
    }))
  }

  const runScript = (id: string) => {
    const item = state.items[id];
    if (!item || !item.content) return;

    setIsOutputOpen(true);
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { type: 'info', message: `Running ${item.name}...`, timestamp }]);

    // Simulated execution: search for print and error
    const lines = item.content.split('\n');
    lines.forEach(line => {
      const printMatch = line.match(/print\s*\((.*)\)/);
      const errorMatch = line.match(/error\s*\((.*)\)/);
      const warnMatch = line.match(/warn\s*\((.*)\)/);

      if (printMatch) {
        setLogs(prev => [...prev, { type: 'info', message: printMatch[1].replace(/['"]/g, ''), timestamp }]);
      }
      if (errorMatch) {
        setLogs(prev => [...prev, { type: 'error', message: errorMatch[1].replace(/['"]/g, ''), timestamp }]);
      }
      if (warnMatch) {
        setLogs(prev => [...prev, { type: 'warn', message: warnMatch[1].replace(/['"]/g, ''), timestamp }]);
      }
    });

    setLogs(prev => [...prev, { type: 'info', message: `${item.name} finished execution.`, timestamp }]);
  };

  const selectedItem = selectedId ? state.items[selectedId] : null

  if (!isMounted) {
    return <div className="h-screen w-full bg-[#1e1e1e]" />
  }

  return (
    <main className="flex h-screen w-full overflow-hidden font-sans bg-[#1e1e1e] relative">
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button 
          onClick={() => setIsExplorerOpen(!isExplorerOpen)}
          className="fixed bottom-10 right-6 z-50 w-12 h-12 bg-[#007acc] rounded-full shadow-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          {isExplorerOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Main Content Area (Editor + Output) */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Editor 
          item={selectedItem} 
          items={state.items}
          onContentChange={handleContentChange} 
          onRun={runScript}
        />
        
        {/* Output Panel */}
        <AnimatePresence>
          {isOutputOpen && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: isMobile ? '40%' : '30%' }}
              exit={{ height: 0 }}
              className="bg-[#1e1e1e] border-t border-[#333] flex flex-col overflow-hidden z-20"
            >
              <div className="h-8 bg-[#252526] border-b border-[#333] flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <Terminal className="w-3 h-3" />
                  Output
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setLogs([])}
                    className="text-[10px] text-gray-500 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => setIsOutputOpen(false)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <div className="text-gray-600 italic p-2">No output to display</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={cn(
                      "flex gap-3 py-0.5 border-b border-white/5",
                      log.type === 'error' ? "text-red-400" : log.type === 'warn' ? "text-yellow-400" : "text-gray-300"
                    )}>
                      <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div className="h-6 bg-[#007acc] text-white text-[10px] flex items-center px-3 gap-4 shrink-0 z-30">
          <div className="flex items-center gap-1 truncate">
            <span className="opacity-70">Selected:</span>
            <span className="truncate">{selectedItem?.name || 'None'}</span>
          </div>
          <button 
            onClick={() => setIsOutputOpen(!isOutputOpen)}
            className={cn(
              "flex items-center gap-1 px-2 h-full hover:bg-white/10 transition-colors",
              isOutputOpen && "bg-white/20"
            )}
          >
            <Terminal className="w-3 h-3" />
            Output
          </button>
          {!isMobile && (
            <div className="flex items-center gap-1">
              <span className="opacity-70">Type:</span>
              <span>{selectedItem?.type || 'N/A'}</span>
            </div>
          )}
          <div className="ml-auto opacity-70 whitespace-nowrap">
            Roblox Studio Mobile v1.2
          </div>
        </div>
      </div>

      {/* Sidebar (Explorer) */}
      <AnimatePresence mode="wait">
        {isExplorerOpen && (
          <motion.div
            initial={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
            animate={isMobile ? { x: 0 } : { width: 288, opacity: 1 }}
            exit={isMobile ? { x: '100%' } : { width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "h-full bg-[#252526] border-l border-[#333] shadow-xl z-40",
              isMobile ? "fixed inset-y-0 right-0 w-[85%]" : "relative"
            )}
          >
            <Explorer 
              state={state}
              selectedId={selectedId}
              onSelectItem={(id) => {
                setSelectedId(id);
                if (isMobile && state.items[id]?.type !== 'Folder') {
                  setIsExplorerOpen(false);
                }
              }}
              onUpdateState={handleUpdateState}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isMobile && isExplorerOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsExplorerOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
        />
      )}
    </main>
  )
}
