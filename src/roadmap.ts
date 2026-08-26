import { RoadmapData, RoadmapColumn, RoadmapRow, RoadmapCell } from './types';

export class RoadmapManager {
  private data: RoadmapData;
  private isEditMode: boolean = false;
  private onStateChangeCallbacks: Array<() => void> = [];

  constructor() {
    this.data = {
      title: 'Roadmap',
      description: 'Project Milestones & Delivery Dashboard',
      columns: [],
      rows: [],
    };
  }

  public subscribe(callback: () => void) {
    this.onStateChangeCallbacks.push(callback);
  }

  private notify() {
    this.onStateChangeCallbacks.forEach(cb => cb());
  }

  public getData(): RoadmapData {
    return this.data;
  }

  public getEditMode(): boolean {
    return this.isEditMode;
  }

  public setEditMode(editMode: boolean) {
    this.isEditMode = editMode;
    this.notify();
  }

  public toggleEditMode(): boolean {
    this.isEditMode = !this.isEditMode;
    this.notify();
    return this.isEditMode;
  }

  public async loadInitialData(): Promise<void> {
    try {
      const response = await fetch('/api/roadmap');
      if (response.ok) {
        const json = await response.json();
        if (json && json.columns && json.columns.length > 0) {
          this.data = json;
          this.notify();
          return;
        }
      }
    } catch (err) {
      console.warn('Could not load from API, trying localStorage fallback:', err);
    }

    // LocalStorage fallback
    const local = localStorage.getItem('roadmap_data');
    if (local) {
      try {
        this.data = JSON.parse(local);
        this.notify();
        return;
      } catch (err) {
        console.error('Failed to parse local storage data', err);
      }
    }

    // Default template fallback
    this.data = this.getDefaultTemplate();
    this.notify();
  }

  public async persistData(): Promise<boolean> {
    // Save to localStorage as backup
    localStorage.setItem('roadmap_data', JSON.stringify(this.data));

    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data),
      });
      return response.ok;
    } catch (err) {
      console.warn('Failed to persist to server /api/roadmap:', err);
      return false;
    }
  }

  public addColumn(title?: string): string {
    const colNumber = this.data.columns.length + 1;
    const colId = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newCol: RoadmapColumn = {
      id: colId,
      title: title || `Column ${colNumber}`,
    };

    this.data.columns.push(newCol);

    // Initialize cells in existing rows
    this.data.rows.forEach(row => {
      if (!row.cells[colId]) {
        row.cells[colId] = { type: 'active', checked: false, percentage: 0 };
      }
    });

    this.persistData();
    this.notify();
    return colId;
  }

  public deleteColumn(columnId: string) {
    this.data.columns = this.data.columns.filter(c => c.id !== columnId);
    this.data.rows.forEach(row => {
      delete row.cells[columnId];
    });
    this.persistData();
    this.notify();
  }

  public renameColumn(columnId: string, newTitle: string) {
    const col = this.data.columns.find(c => c.id === columnId);
    if (col) {
      col.title = newTitle.trim() || 'Untitled Column';
      this.persistData();
      this.notify();
    }
  }

  public addRow(title?: string, category?: string): string {
    const rowNumber = this.data.rows.length + 1;
    const rowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const cells: Record<string, RoadmapCell> = {};
    this.data.columns.forEach(col => {
      cells[col.id] = { type: 'active', checked: false, percentage: 0 };
    });

    const newRow: RoadmapRow = {
      id: rowId,
      title: title || `New Feature Track ${rowNumber}`,
      category: category || 'Feature',
      cells,
    };

    this.data.rows.push(newRow);
    this.persistData();
    this.notify();
    return rowId;
  }

  public deleteRow(rowId: string) {
    this.data.rows = this.data.rows.filter(r => r.id !== rowId);
    this.persistData();
    this.notify();
  }

  public renameRow(rowId: string, newTitle: string) {
    const row = this.data.rows.find(r => r.id === rowId);
    if (row) {
      row.title = newTitle.trim() || 'Untitled Track';
      this.persistData();
      this.notify();
    }
  }

  public updateRowCategory(rowId: string, category: string) {
    const row = this.data.rows.find(r => r.id === rowId);
    if (row) {
      row.category = category.trim() || 'Feature';
      this.persistData();
      this.notify();
    }
  }

  public toggleCellChecked(rowId: string, columnId: string, isChecked: boolean) {
    const row = this.data.rows.find(r => r.id === rowId);
    if (row && row.cells[columnId] && row.cells[columnId].type === 'active') {
      const cell = row.cells[columnId];
      cell.checked = isChecked;
      if (isChecked) {
        cell.percentage = 100;
      } else if (cell.percentage === 100) {
        cell.percentage = 0;
      }
      this.persistData();
      this.notify();
    }
  }

  public setCellPercentage(rowId: string, columnId: string, percentage: number) {
    const row = this.data.rows.find(r => r.id === rowId);
    if (row && row.cells[columnId] && row.cells[columnId].type === 'active') {
      const cell = row.cells[columnId];
      const boundedPct = Math.max(0, Math.min(100, Math.round(percentage)));
      cell.percentage = boundedPct;
      cell.checked = boundedPct === 100;
      this.persistData();
      this.notify();
    }
  }

  public toggleCellNA(rowId: string, columnId: string) {
    const row = this.data.rows.find(r => r.id === rowId);
    if (!row) return;

    if (!row.cells[columnId]) {
      row.cells[columnId] = { type: 'na' };
    } else if (row.cells[columnId].type === 'active') {
      row.cells[columnId] = { type: 'na' };
    } else {
      row.cells[columnId] = { type: 'active', checked: false, percentage: 0 };
    }

    this.persistData();
    this.notify();
  }

  public loadFromJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
        this.data = parsed;
        this.persistData();
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public resetToDefault() {
    this.data = this.getDefaultTemplate();
    this.persistData();
    this.notify();
  }

  public getMetrics() {
    let totalActiveCells = 0;
    let completedCells = 0;
    let totalPercentageSum = 0;

    this.data.rows.forEach(row => {
      this.data.columns.forEach(col => {
        const cell = row.cells[col.id];
        if (cell && cell.type === 'active') {
          totalActiveCells++;
          const pct = cell.percentage ?? (cell.checked ? 100 : 0);
          totalPercentageSum += pct;
          if (cell.checked || pct === 100) {
            completedCells++;
          }
        }
      });
    });

    const overallPct = totalActiveCells > 0 ? Math.round(totalPercentageSum / totalActiveCells) : 0;

    return {
      overallPct,
      completedCells,
      totalActiveCells,
      totalRows: this.data.rows.length,
      totalCols: this.data.columns.length,
    };
  }

  private getDefaultTemplate(): RoadmapData {
    return {
      title: 'Roadmap',
      description: 'Project milestones, features, and delivery progress',
      columns: [
        { id: 'col_1', title: 'Q1 - Foundation' },
        { id: 'col_2', title: 'Q2 - Core Features' },
        { id: 'col_3', title: 'Q3 - Scaling & Security' },
        { id: 'col_4', title: 'Q4 - Release & Polish' }
      ],
      rows: [
        {
          id: 'row_1',
          title: 'Auth & User Management',
          category: 'Backend',
          cells: {
            col_1: { type: 'active', checked: true, percentage: 100 },
            col_2: { type: 'active', checked: true, percentage: 100 },
            col_3: { type: 'active', checked: false, percentage: 40 },
            col_4: { type: 'na' }
          }
        },
        {
          id: 'row_2',
          title: 'Dynamic Data Table & Grid',
          category: 'Frontend',
          cells: {
            col_1: { type: 'active', checked: true, percentage: 100 },
            col_2: { type: 'active', checked: false, percentage: 75 },
            col_3: { type: 'active', checked: false, percentage: 20 },
            col_4: { type: 'active', checked: false, percentage: 0 }
          }
        },
        {
          id: 'row_3',
          title: 'Playwright E2E Automation',
          category: 'QA',
          cells: {
            col_1: { type: 'na' },
            col_2: { type: 'active', checked: true, percentage: 100 },
            col_3: { type: 'active', checked: false, percentage: 60 },
            col_4: { type: 'active', checked: false, percentage: 0 }
          }
        },
        {
          id: 'row_4',
          title: 'Reporting & Analytics',
          category: 'Analytics',
          cells: {
            col_1: { type: 'na' },
            col_2: { type: 'na' },
            col_3: { type: 'active', checked: false, percentage: 30 },
            col_4: { type: 'active', checked: false, percentage: 10 }
          }
        }
      ]
    };
  }
}
