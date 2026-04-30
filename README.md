# Global Asset Ledger

A frontend asset management dashboard that displays **200,000 fake financial assets** with search, filters, sorting, and infinite scroll.

Used performance techniques like virtualized rendering, cursor pagination, debounced search, and skeleton loading.

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
| Skeleton loading | Boneyard UI |

---

## How It Works

### The big picture

```
Faker generates 200,000 fake assets (runs once on startup)
          ↓
mockData.js holds them in memory
          ↓
api.js acts as a fake backend — search, filter, sort, then return 50 at a time
          ↓
TanStack Query fetches pages, caches results, handles retries
          ↓
Zustand stores what the user has typed/selected (search, filters, sort)
          ↓
LedgerView picks what to show: skeleton → error → cards (mobile) or table (desktop)
          ↓
react-window only renders the cards that are currently visible on screen
```

### Why not just load all 200,000 records at once?

If you put 200,000 DOM elements on a page, the browser has to paint all of them — even the ones you can't see. That freezes the UI for several seconds and uses hundreds of MB of memory.

Instead, this app does three things:

1. **Fetches 50 records at a time** — the "API" returns a cursor pointing to the next page, just like a real backend would
2. **Only renders what's visible** — react-window keeps just ~5 card elements in the DOM at any time, swapping them as you scroll
3. **Caches pages** — TanStack Query remembers pages you've already loaded, so scrolling back up is instant

---

## Folder Structure

```
src/
  App.jsx                  ← root component, wires everything together
  main.jsx                 ← React entry point, sets up TanStack Query
  index.css                ← global styles + Tailwind
  utils.js                 ← formatCurrency, formatDate helpers

  components/
    Navbar.jsx             ← top bar with logo + timestamp
    SearchBar.jsx          ← search input (spinner while debouncing)
    FilterPanel.jsx        ← filter + sort form (desktop sidebar & mobile drawer)
    AssetCard.jsx          ← one card shown on mobile
    LedgerTable.jsx        ← sortable table shown on desktop
    SkeletonLoader.jsx     ← shimmer placeholders while data loads
    LedgerView.jsx         ← decides what to render: skeleton / error / cards / table

  services/
    api.js                 ← fake API: search → filter → sort → paginate
    mockData.js            ← generates 200,000 fake assets with Faker

  store/
    useLedgerStore.js      ← Zustand: search query, filters, sort, drawer state

  hooks/
    useAssets.js           ← TanStack Query infinite scroll hook + debounce
```

---

## Performance Details

### 1. Virtualization (react-window)
Only the cards visible on screen exist in the DOM. A list of 5,000 loaded cards renders as fast as a list of 5. Works on mobile — desktop uses a plain scrollable table.

### 2. Debounced Search (350ms)
The search input updates Zustand on every keystroke, but the actual API call only fires 350ms after the user stops typing. This prevents flooding the filter pipeline on every key press while still feeling responsive.

### 3. Infinite Scroll
`useInfiniteQuery` loads 50 records at a time. A hidden `IntersectionObserver` element at the bottom of the list triggers the next page load automatically when the user scrolls near the end.

### 4. Cursor Pagination
The fake API uses a `cursor` (a number index) instead of page numbers. Each response includes a `nextCursor` pointing to where the next page starts. This is how real production APIs like Stripe and GitHub work.

### 5. Singleton Dataset
`generateDataset()` runs once and stores the result. Every subsequent call returns the same array reference — no re-generation on re-renders.

### 6. Skeleton Loading
While the first page is loading, `SkeletonLoader.jsx` shows animated shimmer placeholders that match the exact shape of the real cards/rows. The user always sees something — never a blank screen.

---

## API Design

`api.js` exposes one function:

```js
fetchAssets({ cursor, limit, search, filters, sort })
```

Every call:
- Waits 300–700ms to simulate real network latency
- Has a ~3% chance of failing to demonstrate error handling and TanStack Query's automatic retry
- Runs the full pipeline: search → filter → sort → slice the dataset

To connect this to a real backend, replace the contents of `api.js` with actual HTTP calls (e.g. `axios.get('/api/assets', { params })`). Everything else stays the same.

---

## State Management

Two separate tools handle two separate concerns:

| Tool | Handles |
|---|---|
| **Zustand** | UI state — what the user has typed, what filters are selected, whether the mobile drawer is open |
| **TanStack Query** | Server state — fetched data, loading/error status, page cache, retries |

These are kept separate intentionally. Mixing them (e.g. storing fetched data in Zustand) creates hard-to-debug issues where UI state and server state get out of sync.

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

> The app generates 200,000 fake records on first load (~150–200ms). Subsequent visits use the cached dataset.

## Building for Production

```bash
npm run build
npm run preview
```
