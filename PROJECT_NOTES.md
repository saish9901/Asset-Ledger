# Global Asset Ledger — Project Notes

A complete, plain-English explanation of how this project works, every technology used,
and every architectural decision made during the refactor.

---

## What Is This App?

A **fintech-style asset management dashboard** that displays a large dataset of 1,000,000 fake
financial assets (stocks, bonds, crypto, real estate, etc.) in a high-performance, searchable,
filterable table/card view.

The key engineering challenge: **render 1,000,000 rows without freezing the browser.**

The solution: **don't render 1,000,000 rows.** Fetch 50 at a time, and only render what's visible.

---

## Folder Structure (Post-Refactor)

```
src/
  App.jsx               ← root: initialises worker, shows loading screen, then LedgerContent
  main.jsx              ← entry point, sets up React + TanStack Query
  index.css             ← global styles + Tailwind import
  utils.js              ← formatCurrency, formatDate helpers

  workers/
    ledgerWorker.js     ← Web Worker: generates 1M dataset + handles all queries off main thread

  components/           ← all UI components, flat (no sub-folders)
    Navbar.jsx
    SearchBar.jsx
    FilterPanel.jsx     ← both the desktop sidebar form AND mobile drawer
    AssetCard.jsx       ← one card for mobile view
    LedgerTable.jsx     ← the desktop table
    SkeletonLoader.jsx  ← placeholder UI while data loads
    LedgerView.jsx      ← decides what to show: skeleton / error / cards / table

  services/
    api.js              ← sends QUERY message to worker, returns 50-record slice
    workerManager.js    ← Promise wrapper around the Web Worker (singleton)
    mockData.js         ← static constants only (countries, types, statuses)

  store/
    useLedgerStore.js   ← Zustand: stores search query, filters, sort

  hooks/
    useAssets.js        ← TanStack Query: fetches paginated data, debounces search
```

---

## Technology Deep-Dive

### 1. React + Vite (the base)

**React** is the UI framework. Every piece of UI is a component — a JavaScript function
that returns HTML-like JSX.

**Vite** is the build tool. It compiles JSX, bundles files, and runs the dev server
(`npm run dev`). It's extremely fast compared to older tools like Webpack.

**Why JavaScript not TypeScript?**  
Simpler setup, faster iteration, still uses JSX types via `@types/react` for editor hints.

---

### 2. Tailwind CSS (styling)

Instead of writing `.css` files, you write utility classes directly in JSX:
```jsx
<div className="text-white bg-black rounded-lg px-4 py-2">
```

Every class is a single CSS rule. Tailwind generates only the CSS you actually use.

**In this project:**
- Monochrome black/white fintech theme
- Responsive: `hidden lg:flex` means "hidden on mobile, flex on desktop"
- Custom theme tokens defined in `index.css` (colors, fonts)

---

### 3. Zustand (UI State)

**What it does:** Stores the current search query, active filters, sort order, and whether
the mobile filter drawer is open.

**Think of it as:** A global variable store that any component can read or write.

**Why not useState in App?**  
`useState` would require passing values down through props to every child component (prop drilling).
Zustand lets `SearchBar`, `FilterPanel`, and `LedgerTable` all talk to each other without
passing props.

```
useLedgerStore.js contains:
  searchQuery    ← what the user typed
  filters        ← type, country, region, status, date range, valuation range
  sort           ← "valuation_desc", "name_asc", etc.
  isFilterDrawerOpen ← is the mobile bottom sheet visible?
```

**Rule after refactor:** Zustand = UI state ONLY. It never stores fetched data.

**`getActiveFilterCount(filters)`** — A plain function (not inside the store) that counts
how many filters are currently active. Used to show the badge number on the filter button.

---

### 4. TanStack Query (Server/Data State)

**What it does:** Manages the lifecycle of data fetched from the API — loading, caching,
pagination, retries on error.

**Why not fetch in useState + useEffect?**  
You'd have to manually handle: loading state, error state, caching, refetching,
pagination cursors, retrying failed requests. TanStack Query does all of this for you.

**The key hook: `useInfiniteQuery`**

```
useInfiniteQuery works like this:
  - First render:  fetch page 1  (cursor = 0,  items 0–49)
  - User scrolls:  fetch page 2  (cursor = 50, items 50–99)
  - User scrolls:  fetch page 3  (cursor = 100, items 100–149)
  - etc.
```

Each page is cached. If the user changes a filter, the cache is invalidated and
fetching starts fresh from page 1.

**`queryKey: ['assets', debouncedSearch, filters, sort]`**  
This is the cache key. Whenever search/filters/sort change, TanStack Query knows to
refetch. When they're the same, it returns the cached result instantly.

**staleTime: 30s** — Cached data is considered fresh for 30 seconds. No refetch during that window.  
**gcTime: 5min** — Unused pages are garbage collected after 5 minutes.  
**retry: 2** — On failure, retry twice before showing the error state.

---

### 5. Axios (HTTP client)

**What it does:** Makes HTTP requests (normally to a real server).

**In this project:** We're not making real network requests. Axios is declared as a
dependency to show familiarity with it, but `api.js` simulates the network with
`setTimeout` delays and random errors instead of actual Axios calls.

> In a real app: replace the `delay()` simulation with `axios.get('/api/assets', { params })`

---

### 6. @faker-js/faker (Data Generation)

**What it does:** Generates realistic fake data — names, companies, dates, etc.

**Where it runs:** Inside `src/workers/ledgerWorker.js` — a Web Worker background thread.
Faker never touches the main thread.

**How pool-based generation works:**

Naively calling Faker once per record × 1,000,000 records = 3,000,000 Faker calls → 8–9 seconds.
Instead:

```js
// Step 1: Build pools — Faker called only 20,000 times total
const companies = Array.from({ length: 10_000 }, () => faker.company.name());
const people    = Array.from({ length: 10_000 }, () => faker.person.fullName());

// Step 2: In the 1M loop — just array index lookups (no Faker)
name: pick(companies) + ' ' + assetType  // instant array lookup
owner: pick(people)                       // instant array lookup
acquisitionDate: randomDate()             // Math.random() only, no Faker
```

**Result:** 1,000,000 records generated in ~1 second — and it all happens in the background.

The dataset lives in the worker's memory (`_dataset`). It is never sent to the main thread.
Only 50-record slices are postMessage'd back per query.

---

### 7. react-window (Virtualization)

**The problem:** If you have 50,000 visible items and put them all in the DOM,
the browser has to paint 50,000 nodes. This is extremely slow.

**The solution:** Only render what's actually visible on screen. If your screen shows
10 cards, only 10 `<div>` elements exist in the DOM at any time.

**How react-window works:**
```
Container height: 800px
Card height: 200px
→ Only 4 cards visible
→ Only 4–6 card <div>s are in the DOM (4 visible + overscan buffer)
→ As you scroll, old cards are removed and new ones are added
```

**In this project (v2 API):**
```jsx
<List
  defaultHeight={height}     // measured container height
  rowCount={rowCount}        // total number of rows
  rowHeight={CARD_HEIGHT}    // 200px per card
  rowComponent={Row}         // the component that renders each card
  rowProps={{ items, isFetchingNextPage }}  // extra data passed to Row
  onRowsRendered={onRowsRendered}           // fires when visible rows change
/>
```

**Only used on mobile (cards).** Desktop uses a plain `<table>` with native scroll —
the table already handles this efficiently because table rows are simpler DOM nodes.

---

<!-- ### 8. Boneyard UI (Skeleton Loading)

**What it does:** Provides JSON-based fixtures that describe the layout of UI components
for generating skeleton (loading placeholder) screens.

**The `bones/` folder** contains JSON files that describe the shape of:
- `desktop-table.bones.json` — the table row layout
- `mobile-card-list.bones.json` — the card list layout
- `stat-card.bones.json` — stat card layout

**The `SkeletonLoader.jsx`** component renders the actual skeleton shimmer UI using
hand-crafted JSX that matches the real components. The bones JSON files serve as
the layout reference/fixture definitions.

**What skeleton loading looks like:**
```
While data is fetching → show grey animated shimmer blocks where content will appear
Data arrives          → swap shimmer blocks with real content
```

The shimmer animation is a CSS gradient that slides left to right:
```css
.skeleton {
  background: linear-gradient(90deg, #111 25%, #1c1c1c 50%, #111 75%);
  animation: shimmer 1.6s infinite;
}
``` -->

---

## How Data Flows (The Full Picture)

```
1. App starts
   └─ generateDataset(200000) runs once → 200k asset objects in memory

2. User opens the app
   └─ useAssets() runs
      └─ useInfiniteQuery fetches page 1 (cursor=0, limit=50)
         └─ fetchAssets() in api.js
            └─ workerManager.query() → postMessage to Web Worker
            └─ Worker runs: search → filter → sort → slice(0, 50)
            └─ Worker postMessages back: { items: [...50 assets], nextCursor: 50, total: 1000000 }
      └─ LedgerView renders:
         - Mobile: react-window List (only visible cards in DOM)
         - Desktop: LedgerTable (full table, but only 50 rows)

3. User scrolls to bottom
   └─ LoadMoreSentinel becomes visible (intersection observer fires)
   └─ fetchNextPage() called
      └─ useInfiniteQuery fetches page 2 (cursor=50, limit=50)
      └─ Worker processes QUERY → returns items 50–99
      └─ New 50 items appended to allItems array
      └─ LedgerView re-renders with 100 items

4. User types "Goldman" in search
   └─ Zustand: searchQuery = "Goldman"
   └─ SearchBar shows spinner (isSearching = true)
   └─ useAssets waits 350ms (debounce)
   └─ debouncedSearch = "Goldman"
   └─ queryKey changes → TanStack Query refetches
      └─ Worker scans full 1M dataset for "Goldman" matches
      └─ Returns matching items, paginated
   └─ Skeleton shown (isPlaceholderData && isFetching)
   └─ LedgerView re-renders with filtered results

5. User selects "Equity" in the filter panel
   └─ Zustand: filters.type = "Equity"
   └─ queryKey changes → TanStack Query refetches
      └─ Worker filters 1M records for type === "Equity"
      └─ Returns only equity assets, sorted globally
   └─ Skeleton shown during processing
   └─ LedgerView re-renders with filtered results
```

---

## The Refactor — What Changed and Why

### Before: 5 component sub-folders for 8 components
```
components/
  filters/FilterDrawer.jsx
  layout/Navbar.jsx
  layout/Sidebar.jsx
  ledger/AssetCard.jsx
  ledger/LedgerTable.jsx
  ledger/VirtualizedList.jsx
  search/SearchBar.jsx
  ui/SkeletonLoader.jsx
```

**Problem:** A reviewer opening the project has to navigate through 5 folders to find 8 files.
The nesting adds zero value — these are all independent components.

**After:** One flat `components/` folder. Open folder, see all components immediately.

---

### Before: `filterHelpers.js` was a separate file

`api.js` called `applyFiltersAndSearch()` and `paginateResults()` from `filterHelpers.js`.

**Problem:** The data pipeline (search → filter → sort → paginate) was split across two files.
To understand how the API worked, you had to read two files.

**After:** All logic merged into `api.js` in one function called `queryDataset()`.
One file, one place, complete picture.

---

### Before: Double debounce

`SearchBar.jsx` imported `useDebounce` to show a loading spinner.
`useAssets.js` imported `useDebounce` to delay the query.

**Problem:** Two separate debounce timers running in parallel. Confusing and wasteful.

**After:**
- Debounce lives only in `useAssets.js` (where it actually matters — for query firing)
- `useAssets` exposes `isSearching: searchQuery !== debouncedSearch`
- `App.jsx` passes `isSearching` as a prop to `SearchBar`
- `SearchBar` uses that prop to show the spinner. No debounce logic in the component.

---

### Before: `useDebounce.js` was a separate file

**Problem:** A 17-line utility used in exactly one place (useAssets) shouldn't be its own file.

**After:** The 6-line debounce logic is inlined directly inside `useAssets.js` with a comment
explaining what it does. One less file, zero loss of clarity.

---

### Before: `Sidebar.jsx` was a separate file (17 lines)

```jsx
const Sidebar = () => (
  <aside className="hidden lg:flex ...">
    <FilterPanel />
  </aside>
);
```

**Problem:** This is just a styled wrapper. It's not reusable, not complex, not worth its own file.

**After:** The `<aside>` markup is written directly in `App.jsx`. One less file, layout is obvious.

---

### Before: `FilterDrawer.jsx` and `FilterPanel` were separate exports in the same file

**Problem:** The file lived at `components/filters/FilterDrawer.jsx` but exported both `FilterPanel`
(used in Sidebar) and `FilterDrawer` (used in App). The location didn't match its purpose.

**After:** Renamed to `FilterPanel.jsx` and moved to the flat `components/` folder.
- `export const FilterPanel` — the form content (used in desktop sidebar)
- `export default FilterDrawer` — the mobile bottom-sheet wrapper

---

### Before: Hand-rolled virtual scroller instead of react-window

The original `VirtualizedList.jsx` had a custom `useVirtualCards` hook that used
`position: absolute` + `translateY` to manually render only visible cards.

**Problem:** react-window was in `package.json` but not actually used. That's misleading.
The custom implementation was also more complex and harder to explain.

**After:** `LedgerView.jsx` uses `react-window`'s `List` component properly.
Cleaner, battle-tested, and actually uses the declared dependency.

> **Note:** This project uses react-window **v2** which has a different API from v1:
> - v1: `<FixedSizeList itemCount={n} itemSize={h}>{Row}</FixedSizeList>`
> - v2: `<List rowCount={n} rowHeight={h} rowComponent={Row} rowProps={data} />`

---

### Before: `fetchAssetById` and `fetchStats` existed in api.js

**Problem:** Neither was used anywhere in the app. Dead code confuses reviewers.

**After:** Removed. `api.js` has exactly one export: `fetchAssets()`.

---

### Before: `useStats` hook existed in useAssets.js

**Problem:** `useStats` fetched aggregate numbers (total assets, active assets, etc.)
that were never displayed in the UI.

**After:** Removed. `hooks/useAssets.js` has exactly one export: `useAssets()`.

---

### Before: `StatCardSkeleton` in SkeletonLoader.jsx

**Problem:** There are no stat cards in the UI. Dead code.

**After:** Removed.

---

### Before: `generateDataset(200000)` in a setTimeout at module scope of App.jsx

```js
// Old code
let datasetReady = false;
setTimeout(() => {
  generateDataset(200000);
  datasetReady = true;
}, 0);
```

**Problem:** `setTimeout(..., 0)` doesn't actually defer meaningfully. The `datasetReady`
flag was never read anywhere. It's confusing noise.

**After:**
```js
// New code — clean, direct, honest
generateDataset(200000);
```

Called once at module scope. Synchronous. Happens before any component mounts.
No fake async wrapper needed.

---

### Before: `activeFilterCount` was a Zustand getter

```js
get activeFilterCount() {
  const f = get().filters;
  let count = 0;
  if (f.type) count++;
  // ...
  return count;
}
```

**Problem:** JavaScript getters on Zustand state objects are non-standard and behave
unexpectedly with Zustand's proxy-based subscriptions. They also can't be tested
as plain functions.

**After:**
```js
// In useLedgerStore.js — a plain exported function
export function getActiveFilterCount(filters) {
  let count = 0;
  if (filters.type) count++;
  // ...
  return count;
}

// In App.jsx
const filters = useLedgerStore((s) => s.filters);
const activeFilterCount = getActiveFilterCount(filters);
```

Pure function. Easy to test. Easy to understand.

---

### Before: `HeroBanner` and `LedgerToolbar` were memo components inside App.jsx

```jsx
const HeroBanner = memo(function HeroBanner() { ... });
const LedgerToolbar = memo(function LedgerToolbar({ total, items, activeFilterCount }) { ... });
```

**Problem:** `memo` is for preventing re-renders of list items or expensive components.
These are static-ish sections of a layout — they don't need memoization. Wrapping them
in `memo` adds complexity without benefit.

**After:** They're just plain JSX sections inside the `App` return statement.
Simpler to read, no performance difference in practice.

---

## Component Reference

| Component | What it renders |
|---|---|
| `Navbar` | Top bar with logo + UTC timestamp |
| `SearchBar` | Search input with spinner + clear button |
| `FilterPanel` | Sort dropdown + all filter controls (type, status, region, country, valuation, dates) |
| `FilterDrawer` (default export of FilterPanel.jsx) | Mobile bottom sheet that wraps FilterPanel |
| `AssetCard` | One asset card for mobile view |
| `LedgerTable` | The full data table for desktop, with sortable columns |
| `SkeletonLoader` | Shimmer placeholders: AssetCardSkeleton, TableRowSkeleton, CardSkeletonList, TableSkeletonList |
| `LedgerView` | Top-level display logic: routes to skeleton/error/empty/mobile/desktop |

---

## Hook Reference

| Hook/Function | What it does |
|---|---|
| `useAssets()` | Reads Zustand state, debounces search, runs infinite query, flattens pages |
| `useLedgerStore` | Zustand store accessor — reads search/filters/sort/drawer state |
| `getActiveFilterCount(filters)` | Counts how many filters are non-default |

---

## Service Reference

| File | What it does |
|---|---|
| `api.js → fetchAssets()` | Sends QUERY to worker, applies ~3% error simulation |
| `workerManager.js` | Promise wrapper: `init(count)` + `query(params)` + pending-request map |
| `ledgerWorker.js` | Background thread: builds dataset, handles INIT + QUERY messages |
| `mockData.js` | Static constants: ALL_COUNTRIES, ALL_ASSET_TYPES, ALL_STATUSES, ALL_REGIONS |
| `utils.js → formatCurrency()` | `1234567` → `"$1,234,567"` |
| `utils.js → formatDate()` | `"2024-01-15"` → `"Jan 15, 2024"` |

---

## How to Explain This in an Interview

**"How does performance work with 1,000,000 records?"**

> "All heavy computation runs in a Web Worker — a background browser thread separate from
> the UI. The worker generates 1M records using pool-based Faker calls (~1s), holds the
> full dataset in its own memory, and handles every search, filter, sort, and paginate
> request. The main thread receives only 50 records per request. On screen, react-window
> ensures only the visible card elements exist in the DOM at any time."

**"How does search work?"**

> "The search input writes to Zustand on every keystroke. useAssets debounces it by 350ms,
> then changes the TanStack Query key — triggering a QUERY message to the worker. The worker
> scans all 1,000,000 in-memory records for matches and returns the first 50. TanStack Query
> caches the result."

**"What's the data flow?"**

> "User input → Zustand → TanStack Query reads the key → fetchAssets() → workerManager.query()
> → postMessage to Web Worker → Worker: search → filter → sort → slice(50) → postMessage back
> → TanStack Query caches it → LedgerView renders via react-window or table."

**"Why Zustand AND TanStack Query? Isn't that redundant?"**

> "They handle different types of state. Zustand manages UI state: what the user has typed,
> which filters are selected, whether the mobile drawer is open. TanStack Query manages server
> state: the fetched data, cache lifetime, loading status, error state, and pagination cursors.
> Mixing these two concerns into one solution makes both harder to reason about."

**"Why a Web Worker?"**

> "Without the worker, generating and querying 1M records on the main thread blocks UI
> rendering — the browser freezes for seconds on sort or initial load. The Web Worker runs
> on a separate OS thread, so heavy computation never competes with React's rendering cycle.
> The only data that crosses the thread boundary is the 50-record slice per request."
