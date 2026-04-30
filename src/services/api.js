import { workerManager } from './workerManager.js';

// ~3% random failure rate — demonstrates error handling + TanStack Query retries.
// Lives on the main thread (before the worker call) so it doesn't affect worker state.
function maybeThrowError() {
  if (Math.random() < 0.03) {
    throw new Error('Network error: Request failed. Please retry.');
  }
}

/**
 * fetchAssets — the single API function for the ledger.
 *
 * Sends a QUERY message to the Web Worker and returns the result.
 * The worker runs: search → filter → sort → paginate entirely on its thread.
 * Only the requested 50-record slice is sent back to the main thread.
 *
 * "To swap to a real backend: replace workerManager.query() with axios.get('/api/assets', { params })."
 */
export async function fetchAssets({
  cursor  = 0,
  limit   = 50,
  search  = '',
  filters = {},
  sort    = '',
} = {}) {
  maybeThrowError();
  return workerManager.query({ cursor, limit, search, filters, sort });
}
