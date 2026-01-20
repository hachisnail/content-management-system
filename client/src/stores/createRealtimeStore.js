import { create } from "zustand";
import api from "@/lib/api";
import socket from "@/lib/socket";
import axios from "axios";

// Configuration
const POLL_INTERVAL_MS = 10000;
const DEBOUNCE_MS = 150;

// Helper: Random delay between 0 and 2000ms to prevent thundering herd
const getJitter = () => Math.floor(Math.random() * 2000);

export const createRealtimeStore = (resourceName) => {
  return create((set, get) => ({
    queries: new Map(),
    entities: new Map(),
    isSubscribed: false,
    subscriberCount: 0,
    pollingInterval: null,

    abortControllers: new Map(),
    fetchDebounceTimeout: null,

    // --- DATA FETCHING (With AbortController) ---

    fetchQuery: async (queryString, { silent = false } = {}) => {
      // 1. Cancel previous pending request for this specific query
      const activeControllers = new Map(get().abortControllers);
      if (activeControllers.has(queryString)) {
        activeControllers.get(queryString).abort();
      }

      const controller = new AbortController();
      activeControllers.set(queryString, controller);
      set({ abortControllers: activeControllers });

      const existing = get().queries.get(queryString) || {};

      if (!silent) {
        set((state) => ({
          queries: new Map(state.queries).set(queryString, {
            ...existing,
            loading: true,
          }),
        }));
      }

      try {
        const queryParams = JSON.parse(queryString);

        const response = await api.get(`/${resourceName}`, {
          params: queryParams,
          signal: controller.signal,
        });

        const data = response?.data || response?.rows || response || [];
        const meta =
          response?.meta ||
          (response?.count !== undefined
            ? { totalItems: response.count }
            : { totalItems: data.length });

        if (controller.signal.aborted) return;

        set((state) => ({
          queries: new Map(state.queries).set(queryString, {
            data,
            meta,
            loading: false,
            error: null,
          }),
        }));
      } catch (error) {
        // Correctly ignore cancellations
        if (axios.isCancel(error) || error.name === "CanceledError") return;

        set((state) => ({
          queries: new Map(state.queries).set(queryString, {
            ...existing,
            loading: false,
            error: error.message,
          }),
        }));
      } finally {
        const currentControllers = new Map(get().abortControllers);
        currentControllers.delete(queryString);
        set({ abortControllers: currentControllers });
      }
    },

    fetchEntity: async (id, { silent = false } = {}) => {
      const idStr = String(id);
      const activeControllers = new Map(get().abortControllers);

      if (activeControllers.has(idStr)) {
        activeControllers.get(idStr).abort();
      }

      const controller = new AbortController();
      activeControllers.set(idStr, controller);
      set({ abortControllers: activeControllers });

      const existing = get().entities.get(idStr) || {};
      if (!silent) {
        set((state) => ({
          entities: new Map(state.entities).set(idStr, {
            ...existing,
            loading: true,
          }),
        }));
      }

      try {
        const data = await api.get(`/${resourceName}/${idStr}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        set((state) => ({
          entities: new Map(state.entities).set(idStr, {
            data,
            loading: false,
            error: null,
          }),
        }));
      } catch (error) {
        // FIX: Added check for "CanceledError" to properly ignore aborted requests
        if (axios.isCancel(error) || error.name === "CanceledError") return;

        set((state) => ({
          entities: new Map(state.entities).set(idStr, {
            ...existing,
            loading: false,
            error: error.message,
          }),
        }));
      }
    },

    // --- DEBOUNCING ---
    scheduleRefetch: () => {
      const { fetchDebounceTimeout, refetchAllData } = get();
      if (fetchDebounceTimeout) clearTimeout(fetchDebounceTimeout);

      const timeout = setTimeout(() => {
        refetchAllData();
        set({ fetchDebounceTimeout: null });
      }, DEBOUNCE_MS);

      set({ fetchDebounceTimeout: timeout });
    },

    refetchAllData: () => {
      get().queries.forEach((_value, key) =>
        get().fetchQuery(key, { silent: true })
      );
      get().entities.forEach((_value, key) =>
        get().fetchEntity(key, { silent: true })
      );
    },

    // --- SOCKET EVENT HANDLERS ---
    handleCreated: () => get().scheduleRefetch(),

    handleUpdated: (updatedItem) => {
      const idStr = String(updatedItem.id);
      // Optimistic Update
      if (get().entities.has(idStr)) {
        set((state) => {
          const existing = state.entities.get(idStr) || {};
          return {
            entities: new Map(state.entities).set(idStr, {
              ...existing,
              data: { ...existing.data, ...updatedItem },
            }),
          };
        });
      }
      get().scheduleRefetch();
    },

    handleDeleted: (deletedItem) => {
      const idStr = String(deletedItem.id || deletedItem);
      if (get().entities.has(idStr)) {
        set((state) => {
          const newEntities = new Map(state.entities);
          newEntities.delete(idStr);
          return { entities: newEntities };
        });
      }
      get().scheduleRefetch();
    },

    // --- CONNECTION HANDLERS ---
    handleConnect: () => {
      console.log(
        `[Store: ${resourceName}] Socket Connected. Stopping Fallback Polling.`
      );
      get().stopPolling();

      const emitFn = socket.emitSafe || socket.emit.bind(socket);
      emitFn("subscribe_resource", resourceName);

      get().refetchAllData();
    },

    handleDisconnect: () => {
      console.warn(
        `[Store: ${resourceName}] Socket Disconnected. Starting Fallback Polling...`
      );
      get().startPolling();
    },

    // --- POLLING MECHANISM (WITH JITTER) ---
    startPolling: () => {
      const { pollingInterval, refetchAllData } = get();
      if (pollingInterval) return;

      refetchAllData();

      const scheduleNext = () => {
        const nextDelay = POLL_INTERVAL_MS + getJitter();
        const id = setTimeout(() => {
          refetchAllData();
          scheduleNext();
        }, nextDelay);

        set({ pollingInterval: id });
      };

      scheduleNext();
    },

    stopPolling: () => {
      const { pollingInterval } = get();
      if (pollingInterval) {
        clearTimeout(pollingInterval);
        set({ pollingInterval: null });
      }
    },

    // --- SUBSCRIPTION MANAGER ---
    subscribe: () => {
      const count = get().subscriberCount;
      set({ subscriberCount: count + 1 });

      if (count === 0 && !get().isSubscribed) {
        console.log(`[Store: ${resourceName}] Initializing...`);
        const {
          handleCreated,
          handleUpdated,
          handleDeleted,
          handleConnect,
          handleDisconnect,
          startPolling,
        } = get();

        socket.on(`${resourceName}_created`, handleCreated);
        socket.on(`${resourceName}_updated`, handleUpdated);
        socket.on(`${resourceName}_deleted`, handleDeleted);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        if (socket.connected) {
          const emitFn = socket.emitSafe || socket.emit.bind(socket);
          emitFn("subscribe_resource", resourceName);
        } else {
          startPolling();
        }

        set({ isSubscribed: true });
      }
    },

    unsubscribe: () => {
      const count = get().subscriberCount;
      if (count <= 0) return;
      set({ subscriberCount: count - 1 });

      if (count - 1 === 0) {
        console.log(`[Store: ${resourceName}] Cleaning up...`);
        const {
          handleCreated,
          handleUpdated,
          handleDeleted,
          handleConnect,
          handleDisconnect,
          stopPolling,
          fetchDebounceTimeout,
        } = get();

        stopPolling();
        if (fetchDebounceTimeout) clearTimeout(fetchDebounceTimeout);

        socket.off(`${resourceName}_created`, handleCreated);
        socket.off(`${resourceName}_updated`, handleUpdated);
        socket.off(`${resourceName}_deleted`, handleDeleted);
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);

        if (socket.connected) {
          const emitFn = socket.emitSafe || socket.emit.bind(socket);
          emitFn("unsubscribe_resource", resourceName);
        }
        set({ isSubscribed: false });
      }
    },
  }));
};
