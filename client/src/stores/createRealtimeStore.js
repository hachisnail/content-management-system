import { create } from "zustand";
import api from "../api";
import socket from "../socket";

// FALLBACK CONFIG: How often to fetch when socket is dead
const POLL_INTERVAL_MS = 10000; // 10 seconds
// Base interval

// Helper for Jitter (Random delay between 0 and 2000ms)
const getJitter = () => Math.floor(Math.random() * 2000);

export const createRealtimeStore = (resourceName) => {
  return create((set, get) => ({
    queries: new Map(),
    entities: new Map(),
    isSubscribed: false,
    subscriberCount: 0,
    pollingInterval: null, // NEW: Track the poll timer

    // --- ACTIONS (Fetch) ---

    fetchQuery: async (queryString, { silent = false } = {}) => {
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
        });
        const data = response?.data || response?.rows || response || [];
        const meta =
          response?.meta ||
          (response?.count !== undefined
            ? { totalItems: response.count }
            : { totalItems: data.length });

        set((state) => ({
          queries: new Map(state.queries).set(queryString, {
            data,
            meta,
            loading: false,
            error: null,
          }),
        }));
      } catch (error) {
        set((state) => ({
          queries: new Map(state.queries).set(queryString, {
            ...existing,
            loading: false,
            error: error.message,
          }),
        }));
      }
    },

    fetchEntity: async (id, { silent = false } = {}) => {
      const idStr = String(id);
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
        const data = await api.get(`/${resourceName}/${idStr}`);
        set((state) => ({
          entities: new Map(state.entities).set(idStr, {
            data,
            loading: false,
            error: null,
          }),
        }));
      } catch (error) {
        set((state) => ({
          entities: new Map(state.entities).set(idStr, {
            ...existing,
            loading: false,
            error: error.message,
          }),
        }));
      }
    },

    refetchAllData: () => {
      const mode = get().pollingInterval ? "Polling" : "Socket";
      console.log(`[Store: ${resourceName}] [${mode}] Refetching data...`);
      get().queries.forEach((_value, key) =>
        get().fetchQuery(key, { silent: true })
      );
      get().entities.forEach((_value, key) =>
        get().fetchEntity(key, { silent: true })
      );
    },

    // --- SOCKET HANDLERS ---

    handleCreated: (newItem) => {
      console.log(
        `%c[Store: ${resourceName}] Created`,
        "color: #22C55E;",
        newItem
      );
      get().queries.forEach((_value, key) =>
        get().fetchQuery(key, { silent: true })
      );
    },

    handleUpdated: (updatedItem) => {
      const idStr = String(updatedItem.id);
      console.log(
        `%c[Store: ${resourceName}] Updated ID: ${idStr}`,
        "color: #3B82F6;",
        updatedItem
      );

      if (get().entities.has(idStr)) {
        set((state) => {
          const existing = state.entities.get(idStr) || {};
          const updatedEntity = { ...existing.data, ...updatedItem };
          return {
            entities: new Map(state.entities).set(idStr, {
              ...existing,
              data: updatedEntity,
            }),
          };
        });
      }
      get().queries.forEach((_value, key) =>
        get().fetchQuery(key, { silent: true })
      );
    },

    handleDeleted: (deletedItem) => {
      const rawId = deletedItem.id || deletedItem;
      const idStr = String(rawId);
      console.log(
        `%c[Store: ${resourceName}] Deleted ID: ${idStr}`,
        "color: #EF4444;",
        deletedItem
      );

      if (get().entities.has(idStr)) {
        set((state) => {
          const newEntities = new Map(state.entities);
          newEntities.delete(idStr);
          return { entities: newEntities };
        });
      }
      get().queries.forEach((_value, key) =>
        get().fetchQuery(key, { silent: true })
      );
    },

    // --- CONNECTION STATE HANDLERS ---

    handleConnect: () => {
      console.log(
        `[Store: ${resourceName}] Socket Connected. Stopping Fallback Polling.`
      );
      get().stopPolling(); // STOP POLLING

      socket.emitSafe("subscribe_resource", resourceName);
      get().refetchAllData();
    },

    handleDisconnect: () => {
      console.warn(
        `[Store: ${resourceName}] Socket Disconnected. Starting Fallback Polling...`
      );
      get().startPolling(); // START POLLING
    },

    // --- POLLING MECHANISM (The Fallback) ---

    startPolling: () => {
      const { pollingInterval, refetchAllData } = get();
      if (pollingInterval) return;

      // Fetch immediately
      refetchAllData();

      // 1. ADD JITTER TO INTERVAL
      // Instead of a fixed setInterval, we use a recursive setTimeout with jitter
      // to prevent "Thundering Herd" problem.

      const scheduleNext = () => {
        const nextDelay = POLL_INTERVAL_MS + getJitter();
        const id = setTimeout(() => {
          refetchAllData();
          // Schedule next run only after this one finishes (or triggers)
          scheduleNext();
        }, nextDelay);

        set({ pollingInterval: id });
      };

      scheduleNext();
    },

    stopPolling: () => {
      const { pollingInterval } = get();
      if (pollingInterval) {
        clearTimeout(pollingInterval); // Changed from clearInterval
        set({ pollingInterval: null });
      }
    },

    stopPolling: () => {
      const { pollingInterval } = get();
      if (pollingInterval) {
        clearInterval(pollingInterval);
        set({ pollingInterval: null });
      }
    },

    // --- SUBSCRIPTION MANAGER ---

    subscribe: () => {
      const currentCount = get().subscriberCount;
      set({ subscriberCount: currentCount + 1 });

      if (currentCount === 0 && !get().isSubscribed) {
        console.log(`[Store: ${resourceName}] Initializing...`);

        const {
          handleCreated,
          handleUpdated,
          handleDeleted,
          handleConnect,
          handleDisconnect,
          startPolling,
        } = get();

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect); // Listen for drops
        socket.on(`${resourceName}_created`, handleCreated);
        socket.on(`${resourceName}_updated`, handleUpdated);
        socket.on(`${resourceName}_deleted`, handleDeleted);

        if (socket.connected) {
          socket.emitSafe("subscribe_resource", resourceName);
        } else {
          // If starting offline, enable polling immediately
          console.log(
            `[Store: ${resourceName}] Started offline. Enabling polling.`
          );
          startPolling();
          // Queue subscription for later
          socket.emitSafe("subscribe_resource", resourceName);
        }

        set({ isSubscribed: true });
      }
    },

    unsubscribe: () => {
      const currentCount = get().subscriberCount;
      if (currentCount <= 0) return;

      set({ subscriberCount: currentCount - 1 });

      if (currentCount - 1 === 0) {
        console.log(`[Store: ${resourceName}] Cleaning up...`);

        const {
          handleCreated,
          handleUpdated,
          handleDeleted,
          handleConnect,
          handleDisconnect,
          stopPolling,
        } = get();

        stopPolling(); // CRITICAL: Stop the timer if user leaves page

        if (socket.connected) socket.emit("unsubscribe_resource", resourceName);

        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off(`${resourceName}_created`, handleCreated);
        socket.off(`${resourceName}_updated`, handleUpdated);
        socket.off(`${resourceName}_deleted`, handleDeleted);

        set({ isSubscribed: false });
      }
    },
  }));
};
