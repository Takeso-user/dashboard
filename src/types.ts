export type CellType = 'active' | 'na';

export interface RoadmapCell {
  type: CellType;
  checked?: boolean;
  percentage?: number; // 0 - 100
}

export interface RoadmapColumn {
  id: string;
  title: string;
}

export interface RoadmapRow {
  id: string;
  title: string;
  category?: string;
  cells: Record<string, RoadmapCell>; // columnId -> RoadmapCell
}

export interface RoadmapData {
  title: string;
  description?: string;
  columns: RoadmapColumn[];
  rows: RoadmapRow[];
}
