import { useEffect, useMemo } from "react";
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
  { id, queryParams, isEnabled = true } = {}
) => {
  const useStore = getResourceStore(resourceName);
  // Get both subscribe AND unsubscribe actions
  const { subscribe, unsubscribe, fetchQuery, fetchEntity } =
    useStore.getState();

  const key = useMemo(() => {
    if (id) return String(id);
    return JSON.stringify(queryParams || {});
  }, [id, queryParams]);

  const { selector, fetchAction } = useMemo(() => {
    if (id) {
      return {
        selector: (state) => state.entities.get(key) || defaultEntityState,
        fetchAction: () => fetchEntity(key),
      };
    }
    return {
      selector: (state) => state.queries.get(key) || defaultQueryState,
      fetchAction: () => fetchQuery(key),
    };
  }, [id, key, fetchQuery, fetchEntity]);

  const { data, meta, loading, error } = useStore(selector);

  useEffect(() => {
    if (isEnabled) {
      subscribe(); // Increment count
      fetchAction();

      // CLEANUP: Decrement count when this component unmounts or params change
      return () => {
        unsubscribe();
      };
    }
  }, [resourceName, key, isEnabled, subscribe, unsubscribe, fetchAction]);

  if (id) {
    return { data, loading, error };
  }
  return { data, meta, loading, error };
};
