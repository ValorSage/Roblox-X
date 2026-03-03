'use client'

import React, { useState, useEffect } from 'react'
import { 
  Folder, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit2,
  MoreVertical,
  Search,
  Box,
  Package,
  Wrench,
  Sparkles,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExplorerItem, FileType, ExplorerState } from '@/types/explorer'

interface ExplorerProps {
  state: ExplorerState;
  onSelectItem: (id: string) => void;
  selectedId: string | null;
  onUpdateState: (newState: ExplorerState) => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

const ROBLOX_RULES: Record<string, FileType[]> = {
  'workspace': ['Model', 'Part', 'Folder'],
  'server-script-service': ['Script', 'Folder'],
  'server-storage': ['Script', 'ModuleScript', 'Folder'],
  'replicated-storage': ['ModuleScript', 'Folder'],
  'starter-gui': ['LocalScript', 'Folder'],
  'starter-player-scripts': ['LocalScript', 'Folder'],
  'starter-character-scripts': ['LocalScript', 'Folder'],
  'default': ['Folder']
};

interface AddMenuProps {
  parentId: string;
  items: Record<string, ExplorerItem>;
  onAdd: (parentId: string | null, type: FileType) => void;
  getIcon: (type: FileType) => React.ReactNode;
}

const AddMenu: React.FC<AddMenuProps> = ({ parentId, items, onAdd, getIcon }) => {
  const getServiceId = (id: string): string | null => {
    const item = items[id];
    if (!item) return null;
    if (ROBLOX_RULES[id]) return id;
    if (item.parentId) return getServiceId(item.parentId);
    return null;
  };

  const serviceId = getServiceId(parentId);
  const allowedTypes = serviceId ? ROBLOX_RULES[serviceId] : ROBLOX_RULES['default'];
  const parentName = items[parentId]?.name || 'Folder';
  
  if (allowedTypes.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-1 bg-[#2d2d2d] border border-[#444] rounded shadow-xl z-50 py-2 px-3 min-w-[150px] text-[10px] text-gray-500 italic">
        No items allowed in {parentName}
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-full mt-1 bg-[#2d2d2d] border border-[#444] rounded shadow-xl z-50 py-1 min-w-[120px]">
      {allowedTypes.map(type => (
        <button
          key={type}
          className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#094771] flex items-center gap-2 text-gray-200"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(parentId, type);
          }}
        >
          {getIcon(type)}
          {type}
        </button>
      ))}
    </div>
  );
};

export const Explorer: React.FC<ExplorerProps> = ({ 
  state, 
  onSelectItem, 
  selectedId,
  onUpdateState 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const item = state.items[id];
    if (item.type !== 'Folder') return;

    const newState = {
      ...state,
      items: {
        ...state.items,
        [id]: { ...item, isOpen: !item.isOpen }
      }
    };
    onUpdateState(newState);
  };

  const addItem = (parentId: string | null, type: FileType) => {
    const id = generateId();
    let defaultName = `New ${type}`;
    if (type === 'Folder') defaultName = 'New Folder';
    if (type === 'Part') defaultName = 'Part';
    if (type === 'Model') defaultName = 'Model';
    if (type === 'Tool') defaultName = 'Tool';
    if (type === 'Effect') defaultName = 'Effect';
    if (type === 'Team') defaultName = 'Team';

    const newItem: ExplorerItem = {
      id,
      name: defaultName,
      type,
      parentId,
      content: (type === 'Script' || type === 'LocalScript' || type === 'ModuleScript') ? '' : undefined,
      isOpen: type === 'Folder' ? true : undefined,
      children: type === 'Folder' ? [] : undefined,
    };

    const newItems = { ...state.items, [id]: newItem };
    let newRootIds = [...state.rootIds];

    if (parentId) {
      const parent = newItems[parentId];
      newItems[parentId] = {
        ...parent,
        children: [...(parent.children || []), id],
        isOpen: true
      };
    } else {
      newRootIds.push(id);
    }

    onUpdateState({ items: newItems, rootIds: newRootIds });
    setEditingId(id);
    setEditValue(newItem.name);
    setShowAddMenu(null);
  };

  const deleteItem = (id: string) => {
    const item = state.items[id];
    const newItems = { ...state.items };
    delete newItems[id];

    let newRootIds = [...state.rootIds];
    if (item.parentId) {
      const parent = newItems[item.parentId];
      newItems[item.parentId] = {
        ...parent,
        children: parent.children?.filter(childId => childId !== id)
      };
    } else {
      newRootIds = newRootIds.filter(rootId => rootId !== id);
    }

    // Recursively delete children if it's a folder
    const deleteChildren = (childIds?: string[]) => {
      childIds?.forEach(childId => {
        const child = newItems[childId];
        delete newItems[childId];
        deleteChildren(child.children);
      });
    };
    deleteChildren(item.children);

    onUpdateState({ items: newItems, rootIds: newRootIds });
  };

  const startRename = (id: string) => {
    setEditingId(id);
    setEditValue(state.items[id].name);
  };

  const finishRename = () => {
    if (editingId && editValue.trim()) {
      const newState = {
        ...state,
        items: {
          ...state.items,
          [editingId]: { ...state.items[editingId], name: editValue.trim() }
        }
      };
      onUpdateState(newState);
    }
    setEditingId(null);
  };

  const getIcon = (type: FileType, id?: string) => {
    if (id) {
      switch (id) {
        case 'workspace': return <span className="text-sm">🧱</span>;
        case 'server-script-service': return <span className="text-sm">🖥️</span>;
        case 'server-storage': return <span className="text-sm">📦</span>;
        case 'replicated-storage': return <span className="text-sm">🔁</span>;
        case 'starter-gui': return <span className="text-sm">🖼️</span>;
        case 'starter-player-scripts': return <span className="text-sm">📜</span>;
        case 'starter-character-scripts': return <span className="text-sm">🧍</span>;
      }
    }

    switch (type) {
      case 'Folder':
        return <Folder className="w-4 h-4 text-yellow-500/80 fill-yellow-500/20" />;
      case 'Script':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'LocalScript':
        return <FileCode className="w-4 h-4 text-green-400" />;
      case 'ModuleScript':
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'Model':
        return <Package className="w-4 h-4 text-blue-300" />;
      case 'Part':
        return <Box className="w-4 h-4 text-gray-400" />;
      case 'Tool':
        return <Wrench className="w-4 h-4 text-gray-300" />;
      case 'Effect':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Team':
        return <Users className="w-4 h-4 text-white" />;
    }
  };

  const renderItem = (id: string, depth: number = 0) => {
    const item = state.items[id];
    if (!item) return null;

    // Search logic: show if item matches OR if any child matches
    const matchesSearch = (itemId: string): boolean => {
      const it = state.items[itemId];
      if (!it) return false;
      if (it.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
      if (it.children) {
        return it.children.some(childId => matchesSearch(childId));
      }
      return false;
    };

    if (searchQuery && !matchesSearch(id)) {
      return null;
    }

    const isSelected = selectedId === id;
    const isEditing = editingId === id;
    const shouldBeOpen = searchQuery ? (item.type === 'Folder' && matchesSearch(id)) : item.isOpen;

    return (
      <div key={id} className="flex flex-col">
        <div 
          className={cn(
            "group flex items-center py-1 px-2 cursor-pointer hover:bg-[#37373d] transition-colors",
            isSelected && "bg-[#094771] hover:bg-[#094771]",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'Folder') toggleFolder(id);
            onSelectItem(id);
          }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {item.type === 'Folder' ? (
              shouldBeOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <div className="w-4 shrink-0" />
            )}
            
            {getIcon(item.type, id)}
            
            {isEditing ? (
              <input
                autoFocus
                className="bg-[#3c3c3c] text-white text-sm px-1 outline-none border border-blue-500 w-full"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishRename}
                onKeyDown={(e) => e.key === 'Enter' && finishRename()}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm truncate select-none">{item.name}</span>
            )}
          </div>

          <div className="hidden group-hover:flex items-center gap-1 relative">
            {item.type === 'Folder' && (
              <button 
                onClick={(e) => { e.stopPropagation(); setShowAddMenu(showAddMenu === id ? null : id); }}
                className="p-1 hover:bg-white/10 rounded"
                title="Add..."
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
            {showAddMenu === id && <AddMenu parentId={id} items={state.items} onAdd={addItem} getIcon={(t) => getIcon(t)} />}
            {!item.isSystemItem && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); startRename(id); }}
                  className="p-1 hover:bg-white/10 rounded"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteItem(id); }}
                  className="p-1 hover:bg-white/10 rounded text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>

        {item.type === 'Folder' && shouldBeOpen && item.children?.map(childId => renderItem(childId, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#252526] flex flex-col shadow-xl">
      <div className="p-2 border-b border-[#333] flex items-center justify-between bg-[#2d2d2d] shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Explorer</span>
        <div className="flex gap-1 relative">
          {/* Root adding is disabled for Phase 2 to keep Roblox hierarchy strict */}
        </div>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input 
            type="text"
            placeholder="Search..."
            className="w-full bg-[#3c3c3c] text-xs py-1 pl-7 pr-2 rounded border border-transparent focus:border-[#007acc] outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {state.rootIds.map(id => renderItem(id))}
      </div>
    </div>
  );
};
