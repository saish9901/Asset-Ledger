# Global Asset Ledger

**Institutional-grade frontend asset management platform** — built to simulate and manage 100,000+ financial asset records with zero lag, enterprise-quality UX, and production-ready performance architecture.

---

## Overview

Global Asset Ledger is a frontend engineering showcase demonstrating how to handle **massive datasets** in the browser without sacrificing speed or responsiveness. It simulates a real financial platform with cursor-paginated API calls, debounced search, virtualized rendering, and a premium monochrome UI inspired by fintech leaders like Bloomberg Terminal and Stripe Dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Data Fetching | TanStack Query (infinite queries) |
| Virtualization | react-window |
| Data Generation | @faker-js/faker |
| Intersection | react-intersection-observer |
| Icons | lucide-react |

---

## Architecture

```
faker mock generation (100,000 records)
         ↓
  mockData.js (singleton dataset, generated once)
         ↓
  api.js (simulated backend — pagination, search, filter, sort, 300–700ms delay, ~3% error rate)
         ↓
  TanStack Query (infinite queries, cache, staleTime, retry)
         ↓
  Zustand (search query, filters, sort, drawer state)
         ↓
  VirtualizedList (react-window for mobile, native scroll for desktop)
         ↓
  AssetCard (mobile) / LedgerTable (desktop)
```

### Why not load the full dataset at once?

Loading 100,000 records into the DOM would freeze the browser for seconds and consume hundreds of MB of memory. Instead:

- The dataset is **generated once** in memory using a singleton pattern
- A **simulated API layer** chunks data into pages of 50 records via cursor pagination
- TanStack Query manages **page caching** and only re-fetches when cache is stale
- **Only the visible rows render** thanks to react-window virtualization

---

## Performance Techniques

### 1. Virtualization (react-window)
Only the DOM nodes for currently-visible rows/cards are mounted. A list of 100,000 items renders as fast as a list of 20. `FixedSizeList` is used for O(1) scroll performance.

### 2. Debounced Search (350ms)
The search input is debounced by 350ms before triggering a new TanStack Query key. This prevents a new API call on every keystroke while still feeling instant.

### 3. Infinite Scroll
`useInfiniteQuery` loads 50 records at a time. An `IntersectionObserver` sentinel at the list bottom triggers `fetchNextPage()` when the user approaches the end — zero button clicks required.

### 4. Chunked / Cursor Pagination
`api.js` slices the dataset via `cursor` + `limit` parameters, mimicking a real database cursor. This means only 50 records travel through the filter/search pipeline per request.

### 5. Memoization
- All components wrapped in `React.memo`
- Callbacks stabilized with `useCallback`
- Derived values computed with `useMemo`
- Zustand selectors prevent unnecessary re-renders via selector pattern

### 6. Skeleton Loading
`SkeletonLoader.jsx` provides shimmer skeletons for:
- Asset cards (mobile)
- Table rows (desktop)
- Stat widgets (hero section)

Never a blank state — perceived performance is instant.

### 7. Dataset Singleton
`generateDataset()` runs once and is cached in module scope. Subsequent calls return the reference. Generation happens in a `setTimeout(0)` to avoid blocking the initial render.

---

## Simulated API Strategy

`api.js` exposes:

```js
fetchAssets({ cursor, limit, search, filters, sort })
fetchStats()
fetchAssetById(id)
```

Each call:
- Waits 300–700ms (artificial network delay)
- Has a ~3% chance of throwing an error (retry simulation)
- Applies search → filter → sort → pagination on the in-memory dataset

This mirrors a production REST API contract exactly, so swapping to a real backend requires only changing `api.js`.

---

## Folder Structure

```
src/
├── components/
│   ├── filters/FilterDrawer.jsx   — Mobile bottom sheet + desktop FilterPanel
│   ├── layout/Navbar.jsx          — Sticky top navbar
│   ├── layout/Sidebar.jsx         — Desktop sticky sidebar
│   ├── ledger/AssetCard.jsx       — Mobile asset card
│   ├── ledger/LedgerTable.jsx     — Desktop sortable table
│   ├── ledger/VirtualizedList.jsx — react-window virtualized renderer
│   ├── search/SearchBar.jsx       — Debounced search with clear/spinner
│   └── ui/SkeletonLoader.jsx      — All skeleton loading states
├── hooks/
│   ├── useAssets.js               — TanStack Query infinite hook
│   └── useDebounce.js             — Generic debounce hook
├── services/
│   ├── api.js                     — Simulated API layer
│   └── mockData.js                — 100k record faker generator
├── store/
│   └── ledgerStore.js             — Zustand UI state
└── utils/
    ├── filterHelpers.js           — Pure filter/sort/paginate functions
    └── formatCurrency.js          — Intl currency & date formatters
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> **Note:** First load generates 100,000 records in ~100–200ms (browser). Subsequent navigations use the cache.

---

## Building for Production

```bash
npm run build
npm run preview
```
