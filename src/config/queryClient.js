import { QueryClient } from '@tanstack/react-query';

// One source of truth for caching behaviour. Values tuned for a small
// internal app: data is stale fairly quickly so list views stay fresh
// after mutations on other tabs, but we don't refetch on every focus.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const QK = {
  jobs:        ['jobs'],
  job:         id => ['jobs', id],
  employees:   ['employees'],
  quotes:      ['quotes'],
  quote:       id => ['quotes', id],
  invoices:    ['invoices'],
  invoice:     id => ['invoices', id],
  timeEntries: ['timeEntries'],
};
