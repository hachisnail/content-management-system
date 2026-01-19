import { useEffect, useMemo, useRef } from "react";
import { createRealtimeStore } from "../stores/createRealtimeStore";

const resourceStoreMap = new Map();
const getResourceStore = (resourceName) => {
  if (!resourceStoreMap.has(resourceName)) {
    resourceStoreMap.set(resourceName, createRealtimeStore(resourceName));
  }
  return resourceStoreMap.get(resourceName);
};

const defaultQueryState = { data: [], meta: {}, loading: true, error: null };
const defaultEntityState = { data: null, loading: true, error: null };

export const useRealtimeResource = (
  resourceName,
  { id, queryParams, isEnabled = true, updateStrategy = "auto" } = {}
) => {
  const useStore = getResourceStore(resourceName);

  // Get stable actions from store
  const subscribe = useStore((state) => state.subscribe);
  const unsubscribe = useStore((state) => state.unsubscribe);
  const fetchQuery = useStore((state) => state.fetchQuery);
  const fetchEntity = useStore((state) => state.fetchEntity);

  // 1. Determine Cache Key
  const key = useMemo(() => {
    if (id) return String(id);
    return JSON.stringify(queryParams || {});
  }, [id, queryParams]);

  // 2. Determine which fetch action to use
  const isEntity = !!id;

  // 3. Create Stable Selector
  const selector = useMemo(() => {
    if (isEntity) {
      return (state) => state.entities.get(key) || defaultEntityState;
    }
    return (state) => state.queries.get(key) || defaultQueryState;
  }, [isEntity, key]);

  // 4. Select Data
  const { data, meta, loading, error } = useStore(selector);

  // 5. Subscription & Fetch Effect
  useEffect(() => {
    if (!isEnabled) return;

    // A. Subscribe (Increments ref count)
    subscribe();

    // B. Initial Fetch
    // We use the raw key here to avoid closure staleness
    if (isEntity) {
      fetchEntity(key);
    } else {
      fetchQuery(key);
    }

    // C. Cleanup (Decrements ref count)
    return () => {
      unsubscribe();
    };
  }, [
    isEnabled,
    resourceName,
    key,
    isEntity,
    subscribe,
    unsubscribe,
    fetchEntity,
    fetchQuery,
  ]);

  if (isEntity) {
    return { data, loading, error };
  }
  return { data, meta, loading, error };
};
