import { useCallback, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { useTemplatesStore } from '../stores/templates-store';

export function useTemplates() {
  const utils = trpc.useUtils();
  const templates = useTemplatesStore((state) => state.templates);
  const isLoading = useTemplatesStore((state) => state.isLoading);
  const error = useTemplatesStore((state) => state.error);
  const hasFetched = useTemplatesStore((state) => state.hasFetched);
  const setTemplates = useTemplatesStore((state) => state.setTemplates);
  const setLoading = useTemplatesStore((state) => state.setLoading);
  const setError = useTemplatesStore((state) => state.setError);
  const setHasFetched = useTemplatesStore((state) => state.setHasFetched);

  const refresh = useCallback(async () => {
    if (useTemplatesStore.getState().isLoading) {
      return useTemplatesStore.getState().templates;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await utils.client.listWhatsAppTemplates.query();
      setTemplates(data);
      setHasFetched(true);
      return data;
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Failed to load templates';
      setError(message);
      throw fetchError;
    } finally {
      setLoading(false);
    }
  }, [setError, setHasFetched, setLoading, setTemplates, utils.client.listWhatsAppTemplates]);

  useEffect(() => {
    if (hasFetched) {
      return;
    }

    void refresh();
  }, [hasFetched, refresh]);

  return {
    templates,
    isLoading: isLoading && !hasFetched,
    isRefreshing: isLoading && hasFetched,
    error,
    hasFetched,
    refresh,
  };
}
