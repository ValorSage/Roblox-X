export type FileType = 'Script' | 'LocalScript' | 'ModuleScript' | 'Folder' | 'Model' | 'Part' | 'Tool' | 'Effect' | 'Team';

export interface ExplorerItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  parentId: string | null;
  isOpen?: boolean;
  children?: string[]; // IDs of children
  isSystemItem?: boolean; // Cannot be deleted or renamed
}

export interface ExplorerState {
  items: Record<string, ExplorerItem>;
  rootIds: string[];
}
