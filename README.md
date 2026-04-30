# Global Asset Ledger

A frontend asset management dashboard that processes **1,000,000 fake financial assets** with global search, filtering, sorting, and infinite scroll — all without freezing the browser.

The core engineering challenge is handled by a **Web Worker**: all heavy computation (dataset generation, search, filter, sort) runs in a background thread. The main thread only handles UI and rendering.

---

## Tech Stack

| What it does | Technology |
|---|---|
| UI framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| UI state (search, filters) | Zustand |
| Data fetching + pagination | TanStack Query |
| Virtualized list (mobile) | react-window |
| Fake data generation | @faker-js/faker |
| Infinite scroll trigger | react-intersection-observer |
| Icons | lucide-react |
| Off-thread computation | Web Worker (native browser API) |

---

## Architecture

### The big picture

```
Browser loads → HTML spinner shown immediately
     ↓
React mounts → shows "Initialising Global Ledger..." screen
     ↓
Web Worker starts in background thread
     ↓
Worker builds name pools (20k Faker calls), then generates 1,000,000 records
     ↓
Worker sends INIT_COMPLETE → React shows full app
     ↓
User searches/filters/sorts → Zustand updates instantly
     ↓
TanStack Query debounces 350ms → calls fetchAssets()
     ↓
api.js sends QUERY message to worker → worker runs full pipeline
     ↓
Worker: search → filter → sort → slice 50 records → postMessage slice back
     ↓
TanStack Query caches the 50-record page
     ↓
react-window renders only the cards currently visible on screen
```

### Thread separation

| Thread | Responsibility |
|---|---|
| **Main thread** | UI rendering, inputs, state updates, page transitions |
| **Worker thread** | Dataset generation, search, filter, sort, pagination |

Only 50 records ever cross the thread boundary per request. The full 1M dataset stays in worker memory — it is never sent to the main thread.

### Why not load all 1,000,000 records on the main thread?

1M records on the main thread = 8–9 second freeze, gigabytes of memory, crashed mobile browsers.

This app solves it at two levels:
- **Generation is off-thread** — the Web Worker builds the dataset while the UI is already showing
- **Rendering is minimal** — react-window keeps only ~7 card DOM elements alive at any time, regardless of how many records have loaded

---

## Folder Structure

```
src/
  App.jsx                  ← root: initialises worker, shows loading screen, then LedgerContent
  main.jsx                 ← React entry point, sets up TanStack Query
  index.css                ← global styles + Tailwind
  utils.js                 ← formatCurrency, formatDate helpers

  workers/
    ledgerWorker.js        ← Web Worker: generates dataset + handles all queries

  components/
    Navbar.jsx             ← top bar with logo + timestamp
    SearchBar.jsx          ← search input (spinner while debouncing)
    FilterPanel.jsx        ← filter + sort form (desktop sidebar & mobile drawer)
    AssetCard.jsx          ← one card shown on mobile
    LedgerTable.jsx        ← sortable table shown on desktop
    SkeletonLoader.jsx     ← shimmer placeholders while data loads
    LedgerView.jsx         ← decides what to render: skeleton / error / cards / table

  services/
    api.js                 ← sends QUERY to worker, returns 50-record slice
    workerManager.js       ← Promise wrapper around the Web Worker
    mockData.js            ← static filter option constants (countries, types, etc.)

  store/
    useLedgerStore.js      ← Zustand: search query, filters, sort, drawer state

  hooks/
    useAssets.js           ← TanStack Query infinite scroll hook + debounce
```

---

## Performance Details

### 1. Web Worker (off-thread computation)
All heavy work runs in `ledgerWorker.js` — a background thread that never touches the UI. Dataset generation, search, filter, and sort all happen there. The main thread receives only the 50 records it asked for.

### 2. Pool-based Generation
Instead of calling Faker 3,000,000 times (once per field × 1M records = 8–9 seconds), the worker calls Faker 20,000 times to build name pools, then uses `Math.random()` array lookups for the main loop. Date generation uses `Math.random() + Date` — no Faker. Result: 1M records in ~1 second, entirely off the main thread.

### 3. Virtualization (react-window)
Only the cards visible on screen exist in the DOM. Regardless of how many records have loaded, only ~7 card elements exist in the browser at any time.

### 4. Debounced Search (350ms)
The search input updates Zustand on every keystroke, but the worker only receives a QUERY message 350ms after the user stops typing. This prevents flooding the worker pipeline on every key press.

### 5. Infinite Scroll + Cursor Pagination
`useInfiniteQuery` loads 50 records at a time. An `IntersectionObserver` at the bottom of the list triggers the next page automatically. The worker uses cursor (index) pagination — each response includes a `nextCursor` for the next request.

### 6. Skeleton Loading (first load + filter changes)
Skeleton shimmer placeholders show on first load (`isLoading`) and also whenever a filter/sort/search change is processing. The second case is handled by detecting `isPlaceholderData && isFetching` — TanStack Query's `keepPreviousData` keeps old results visible, but when detected, the skeleton replaces them so the user gets visual feedback.

### 7. Previous Data Preserved During Re-queries
`placeholderData: keepPreviousData` in TanStack Query means old results stay on screen while the worker processes a new filter/sort. This prevents the list from flashing empty between queries.

---

## Worker Message Protocol

```js
// Main thread → Worker
{ type: 'INIT',  payload: { count: 1000000 } }
{ type: 'QUERY', payload: { search, filters, sort, cursor, limit }, id: 'q_...' }

// Worker → Main thread
{ type: 'INIT_COMPLETE',  payload: { total: 1000000 } }
{ type: 'QUERY_RESULT',   payload: { items, nextCursor, total }, id: 'q_...' }
{ type: 'QUERY_ERROR',    payload: { error: '...' }, id: 'q_...' }
```

Each QUERY gets a unique `id` so concurrent requests resolve independently without race conditions.

---

## State Management

Three separate layers, each with a distinct role:

| Layer | Tool | Handles |
|---|---|---|
| UI state | **Zustand** | Search text, active filters, sort mode, drawer open/closed |
| Server state | **TanStack Query** | Page cache, loading/error status, retries, placeholderData |
| Computation | **Web Worker** | Full dataset, search/filter/sort/paginate logic |

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> On first load the app shows "Initialising Global Ledger…" while the Web Worker builds 1,000,000 records in the background (~1s). The main thread is never blocked — you can interact with the page immediately. You'll see two timers in the browser console: `[worker] Pool build: Xms` and `[worker] Dataset generation: Xms`.

## Building for Production

```bash
npm run build
npm run preview
```

> Vite bundles `ledgerWorker.js` as a separate chunk (`~414KB`). The main app bundle is only `~45KB`.
