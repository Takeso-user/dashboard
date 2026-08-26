import { RoadmapManager } from './roadmap';

document.addEventListener('DOMContentLoaded', async () => {
  const manager = new RoadmapManager();

  // DOM Elements
  const tableHeader = document.getElementById('roadmap-table-header') as HTMLTableRowElement;
  const tableBody = document.getElementById('roadmap-table-body') as HTMLTableSectionElement;
  
  const btnToggleEdit = document.getElementById('btn-toggle-edit') as HTMLButtonElement;
  const editToggleLabel = document.getElementById('edit-toggle-label') as HTMLSpanElement;
  
  const btnAddCol = document.getElementById('btn-add-col') as HTMLButtonElement;
  const btnAddRow = document.getElementById('btn-add-row') as HTMLButtonElement;
  const btnAddRowBottom = document.getElementById('btn-add-row-bottom') as HTMLButtonElement;
  
  const btnSaveDb = document.getElementById('btn-save-db') as HTMLButtonElement;
  const btnExportJson = document.getElementById('btn-export-json') as HTMLButtonElement;
  const inputImportJson = document.getElementById('input-import-json') as HTMLInputElement;
  const btnResetDemo = document.getElementById('btn-reset-demo') as HTMLButtonElement;

  const metricOverallPct = document.getElementById('metric-overall-pct') as HTMLElement;
  const progressBarFill = document.getElementById('progress-bar-fill') as HTMLElement;
  const metricCompletedCount = document.getElementById('metric-completed-count') as HTMLElement;
  const metricRowsCount = document.getElementById('metric-rows-count') as HTMLElement;
  const toastContainer = document.getElementById('toast-container') as HTMLElement;

  // Active popover tracker
  let activePopover: HTMLElement | null = null;

  function showToast(message: string, type: 'success' | 'info' = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function closeActivePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
  }

  document.addEventListener('click', (e) => {
    if (activePopover && !activePopover.contains(e.target as Node)) {
      closeActivePopover();
    }
  });

  function renderMetrics() {
    const metrics = manager.getMetrics();
    metricOverallPct.textContent = `${metrics.overallPct}%`;
    progressBarFill.style.width = `${metrics.overallPct}%`;
    metricCompletedCount.textContent = `${metrics.completedCells} / ${metrics.totalActiveCells}`;
    metricRowsCount.textContent = `${metrics.totalRows}`;
  }

  function renderTable() {
    const data = manager.getData();
    const isEditMode = manager.getEditMode();

    // Toggle edit-mode class on body
    if (isEditMode) {
      document.body.classList.add('edit-mode');
      btnToggleEdit.classList.add('active');
      editToggleLabel.textContent = 'Lock Structure (View Mode)';
    } else {
      document.body.classList.remove('edit-mode');
      btnToggleEdit.classList.remove('active');
      editToggleLabel.textContent = 'Edit Table Structure';
    }

    // 1. Render Header
    tableHeader.innerHTML = '';

    // First column: Track / Feature Name
    const thTrack = document.createElement('th');
    thTrack.className = 'track-col-header';
    thTrack.innerHTML = `
      <div class="col-header-content">
        <span>Feature / Work Track</span>
      </div>
    `;
    tableHeader.appendChild(thTrack);

    // Dynamic Columns
    data.columns.forEach((col) => {
      const th = document.createElement('th');
      th.setAttribute('data-col-id', col.id);
      
      if (isEditMode) {
        th.innerHTML = `
          <div class="col-header-content">
            <span class="col-title-text" contenteditable="true" data-col-id="${col.id}">${escapeHtml(col.title)}</span>
            <div class="col-actions">
              <button class="btn-icon btn-danger delete-col-btn" data-col-id="${col.id}" title="Delete column">🗑️</button>
            </div>
          </div>
        `;
      } else {
        th.innerHTML = `
          <div class="col-header-content">
            <span class="col-title-text">${escapeHtml(col.title)}</span>
          </div>
        `;
      }
      tableHeader.appendChild(th);
    });

    // Plus Add Column button on header row in Edit Mode
    if (isEditMode) {
      const thAdd = document.createElement('th');
      thAdd.style.width = '140px';
      thAdd.innerHTML = `
        <button class="add-col-header-btn" id="btn-add-col-header">
          ➕ Add Column
        </button>
      `;
      tableHeader.appendChild(thAdd);
    }

    // 2. Render Rows & Cells
    tableBody.innerHTML = '';

    data.rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-row-id', row.id);

      // Track Title Cell
      const tdTrack = document.createElement('td');
      tdTrack.className = 'track-cell';
      
      if (isEditMode) {
        tdTrack.innerHTML = `
          <div class="track-content">
            <div class="track-info">
              <span class="track-name" contenteditable="true" data-row-id="${row.id}">${escapeHtml(row.title)}</span>
              <span class="track-badge" contenteditable="true" data-row-cat-id="${row.id}">${escapeHtml(row.category || 'Feature')}</span>
            </div>
            <div class="track-actions">
              <button class="btn-icon btn-danger delete-row-btn" data-row-id="${row.id}" title="Delete row">🗑️</button>
            </div>
          </div>
        `;
      } else {
        tdTrack.innerHTML = `
          <div class="track-content">
            <div class="track-info">
              <span class="track-name">${escapeHtml(row.title)}</span>
              <span class="track-badge">${escapeHtml(row.category || 'Feature')}</span>
            </div>
          </div>
        `;
      }
      tr.appendChild(tdTrack);

      // Dynamic Cells
      data.columns.forEach((col) => {
        const cell = row.cells[col.id] || { type: 'active', checked: false, percentage: 0 };
        const td = document.createElement('td');
        td.className = 'roadmap-cell';
        td.setAttribute('data-row-id', row.id);
        td.setAttribute('data-col-id', col.id);

        if (cell.type === 'na') {
          // N/A Cell
          td.innerHTML = `
            <div class="cell-inner cell-na" title="Right-click to restore">
              <span class="na-badge">N/A</span>
            </div>
          `;
        } else {
          // Active Cell (Checkbox + Percentage badge in corner)
          const pct = cell.percentage ?? (cell.checked ? 100 : 0);
          const isChecked = Boolean(cell.checked);
          
          let pctData = '0';
          if (pct === 100) pctData = '100';
          else if (pct > 0) pctData = 'partial';

          td.innerHTML = `
            <div class="cell-inner">
              <div class="cell-checkbox-wrapper">
                <input type="checkbox" class="cell-checkbox" ${isChecked ? 'checked' : ''} data-row-id="${row.id}" data-col-id="${col.id}" title="Left click to toggle complete">
              </div>
              <div class="cell-percent-badge" data-pct="${pctData}" data-row-id="${row.id}" data-col-id="${col.id}" title="Click to adjust %">${pct}%</div>
            </div>
          `;
        }

        // Context Menu (Right Click) to toggle N/A state
        td.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          closeActivePopover();
          manager.toggleCellNA(row.id, col.id);
        });

        tr.appendChild(td);
      });

      // Empty cell to balance the "Add Column" header when in edit mode
      if (isEditMode) {
        const tdPlaceholder = document.createElement('td');
        tdPlaceholder.style.background = 'transparent';
        tr.appendChild(tdPlaceholder);
      }

      tableBody.appendChild(tr);
    });

    renderMetrics();
    attachEventListeners();
  }

  function attachEventListeners() {
    // Checkbox toggling
    document.querySelectorAll('.cell-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const rowId = target.getAttribute('data-row-id')!;
        const colId = target.getAttribute('data-col-id')!;
        manager.toggleCellChecked(rowId, colId, target.checked);
      });
    });

    // Percentage badge click for quick selection popover
    document.querySelectorAll('.cell-percent-badge').forEach((badge) => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        closeActivePopover();

        const target = e.currentTarget as HTMLElement;
        const rowId = target.getAttribute('data-row-id')!;
        const colId = target.getAttribute('data-col-id')!;

        const popover = document.createElement('div');
        popover.className = 'percentage-popover';

        const percentages = [0, 25, 50, 75, 100];
        percentages.forEach((pct) => {
          const btn = document.createElement('button');
          btn.className = 'pct-opt-btn';
          btn.textContent = `${pct}%`;
          btn.addEventListener('click', (pe) => {
            pe.stopPropagation();
            manager.setCellPercentage(rowId, colId, pct);
            closeActivePopover();
          });
          popover.appendChild(btn);
        });

        // Position popover relative to badge
        const rect = target.getBoundingClientRect();
        popover.style.position = 'fixed';
        popover.style.top = `${rect.bottom + 4}px`;
        popover.style.left = `${Math.max(10, rect.left - 50)}px`;

        document.body.appendChild(popover);
        activePopover = popover;
      });
    });

    // Column rename (contenteditable blur / enter key)
    document.querySelectorAll('.col-title-text[contenteditable="true"]').forEach((el) => {
      el.addEventListener('blur', (e) => {
        const target = e.target as HTMLElement;
        const colId = target.getAttribute('data-col-id')!;
        manager.renameColumn(colId, target.textContent || '');
      });
      el.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      });
    });

    // Delete column
    document.querySelectorAll('.delete-col-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const colId = target.getAttribute('data-col-id')!;
        if (confirm('Are you sure you want to delete this column?')) {
          manager.deleteColumn(colId);
          showToast('Column deleted', 'info');
        }
      });
    });

    // Row rename
    document.querySelectorAll('.track-name[contenteditable="true"]').forEach((el) => {
      el.addEventListener('blur', (e) => {
        const target = e.target as HTMLElement;
        const rowId = target.getAttribute('data-row-id')!;
        manager.renameRow(rowId, target.textContent || '');
      });
      el.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      });
    });

    // Row Category rename
    document.querySelectorAll('.track-badge[contenteditable="true"]').forEach((el) => {
      el.addEventListener('blur', (e) => {
        const target = e.target as HTMLElement;
        const rowId = target.getAttribute('data-row-cat-id')!;
        manager.updateRowCategory(rowId, target.textContent || '');
      });
      el.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
      });
    });

    // Delete row
    document.querySelectorAll('.delete-row-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const rowId = target.getAttribute('data-row-id')!;
        if (confirm('Are you sure you want to delete this row?')) {
          manager.deleteRow(rowId);
          showToast('Row deleted', 'info');
        }
      });
    });

    // Header Add Column button
    const btnAddColHeader = document.getElementById('btn-add-col-header');
    if (btnAddColHeader) {
      btnAddColHeader.addEventListener('click', () => {
        manager.addColumn();
        showToast('New column added', 'success');
      });
    }
  }

  function escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Event Listeners for Top Toolbar Buttons
  btnToggleEdit.addEventListener('click', () => {
    const isEdit = manager.toggleEditMode();
    showToast(isEdit ? 'Visual Edit Mode enabled' : 'Structure locked (View Mode)', 'info');
  });

  btnAddCol.addEventListener('click', () => {
    manager.addColumn();
    showToast('New column added', 'success');
  });

  btnAddRow.addEventListener('click', () => {
    manager.addRow();
    showToast('New track/row added', 'success');
  });

  btnAddRowBottom.addEventListener('click', () => {
    manager.addRow();
    showToast('New track/row added', 'success');
  });

  btnSaveDb.addEventListener('click', async () => {
    const success = await manager.persistData();
    if (success) {
      showToast('Roadmap saved to JSON database', 'success');
    } else {
      showToast('Saved to local storage fallback', 'info');
    }
  });

  btnExportJson.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manager.getData(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'roadmap-data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported roadmap-data.json', 'success');
  });

  inputImportJson.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (manager.loadFromJSON(content)) {
          showToast('Imported roadmap successfully', 'success');
        } else {
          showToast('Invalid JSON file structure', 'info');
        }
      };
      reader.readAsText(target.files[0]);
    }
  });

  btnResetDemo.addEventListener('click', () => {
    if (confirm('Reset roadmap back to demo template?')) {
      manager.resetToDefault();
      showToast('Roadmap reset to demo template', 'info');
    }
  });

  // Subscribe to model changes to trigger re-renders
  manager.subscribe(() => {
    renderTable();
  });

  // Load initial data
  await manager.loadInitialData();
  renderTable();
});
