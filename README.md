# 🗺️ Roadmap Dynamic Dashboard

A lightweight, modern dynamic **Roadmap Dashboard** built with **TypeScript**, **HTML/CSS**, **JSON database persistence**, and **Playwright E2E testing**. Designed as a standalone subproject matching a modern Jira / Linear dashboard experience.

---

## ✨ Features

- **📊 Dynamic Roadmap Grid**:
  - Add, delete, and rename columns (Milestones / Quarters / Sprints) dynamically.
  - Add, delete, and rename rows (Feature tracks, workstreams, categories).
- **🔲 Interactive Cells**:
  - **Checkbox**: Click to toggle task completion (0% ↔ 100%).
  - **Corner Percentage Badge**: Displays completion percent (0% - 100%). Clicking opens a quick-selection popover (`0%`, `25%`, `50%`, `75%`, `100%`).
  - **Right-Click Action**: Instantly converts any cell to `n/a` (or restores it back to active state).
- **🔒 Visual Edit Mode Toggle**:
  - **Edit Mode**: Allows structural modifications (adding/deleting/renaming columns and rows).
  - **View Mode (Locked)**: Locks the grid layout to prevent accidental structural changes while keeping cell interactions fluid and responsive.
- **💾 JSON Persistence**:
  - Real-time save and load directly from `data/roadmap.json`.
  - Built-in `Export JSON`, `Import JSON`, and `Reset Demo` controls.
  - LocalStorage offline durability backup.
- **⚡ Zero Bloat & High Aesthetics**:
  - Built with native TypeScript & Vanilla CSS.
  - Sleek dark theme, subtle glassmorphism, smooth animations, and progress metrics.
- **🧪 Playwright E2E Suite**:
  - Automated tests verifying cell interactions, right-click N/A state, edit mode locks, dynamic column/row additions, and API persistence.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Dev Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build & Run Standalone Server
```bash
npm run build
npm run server
```

---

## 🧪 Running Playwright Tests

Make sure Playwright browsers are installed:
```bash
npx playwright install chromium
```

Run tests in headless mode:
```bash
npm test
```

Run tests in interactive UI mode:
```bash
npm run test:ui
```

---

## 📂 Project Structure

```
├── data/
│   └── roadmap.json         # JSON database storing columns, rows, and cell states
├── src/
│   ├── app.ts               # DOM controller, event handling, popovers & toasts
│   ├── roadmap.ts           # State manager, calculation & API sync
│   ├── types.ts             # TypeScript interfaces (RoadmapData, RoadmapRow, etc.)
│   └── styles/
│       └── main.css         # Modern styling & design system
├── tests/
│   └── roadmap.spec.ts      # Playwright E2E test suite
├── index.html               # Main application template
├── server.ts                # Express backend server
├── vite.config.ts           # Vite bundler & dev API middleware
├── tsconfig.json            # TypeScript configuration
└── package.json             # Scripts & dependencies
```

---

## 🖱️ Cell Shortcuts & Interactions

| Action | Result |
| :--- | :--- |
| **Left-Click Checkbox** | Toggle between 100% (complete) and 0% (unstarted) |
| **Click % Badge** | Open percentage quick-selector (`0%`, `25%`, `50%`, `75%`, `100%`) |
| **Right-Click Cell** | Switch cell to `N/A` or restore back to active |
| **Toggle Edit Mode** | Unlock / Lock column and row structural editing |