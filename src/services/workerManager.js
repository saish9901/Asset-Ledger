/**
 * workerManager.js — Promise-based communication layer for ledgerWorker.
 *
 * The worker lives in a background thread. This module gives the rest of the
 * app a clean async API: call init() once, then call query() for every search.
 *
 * Internally it uses a pending-request Map so multiple concurrent queries
 * (e.g. rapid page fetches) resolve independently without race conditions.
 */

import LedgerWorker from '../workers/ledgerWorker.js?worker';

class WorkerManager {
  constructor() {
    this._worker = new LedgerWorker();
    this._pending = new Map();   // id → { resolve, reject }
    this._initResolve = null;
    this._ready = false;

    this._worker.onmessage = ({ data }) => {
      const { type, payload, id } = data;

      if (type === 'INIT_COMPLETE') {
        this._ready = true;
        if (this._initResolve) {
          this._initResolve({ total: payload.total });
          this._initResolve = null;
        }
        return;
      }

      if (type === 'QUERY_RESULT') {
        const entry = this._pending.get(id);
        if (entry) {
          this._pending.delete(id);
          entry.resolve(payload);
        }
        return;
      }

      if (type === 'QUERY_ERROR') {
        const entry = this._pending.get(id);
        if (entry) {
          this._pending.delete(id);
          entry.reject(new Error(payload.error));
        }
        return;
      }
    };

    this._worker.onerror = (err) => {
      console.error('[WorkerManager] Unhandled worker error:', err);
    };
  }

  /**
   * Start dataset generation in the worker.
   * Returns a Promise that resolves once INIT_COMPLETE is received.
   */
  init(count = 1_000_000) {
    return new Promise((resolve) => {
      this._initResolve = resolve;
      this._worker.postMessage({ type: 'INIT', payload: { count } });
    });
  }

  /**
   * Send a query to the worker. Returns a Promise<{items, nextCursor, total}>.
   * Rejects immediately if the worker is not yet ready.
   */
  query(params) {
    if (!this._ready) {
      return Promise.reject(new Error('Worker not ready — call init() first.'));
    }
    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this._pending.set(id, { resolve, reject });
      this._worker.postMessage({ type: 'QUERY', payload: params, id });
    });
  }

  get ready() {
    return this._ready;
  }
}

// Singleton — one worker per app session
export const workerManager = new WorkerManager();
