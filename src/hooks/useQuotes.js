import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../config/queryClient';
import {
  listQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
} from '../db/quotes';

export function useQuotes() {
  return useQuery({ queryKey: QK.quotes, queryFn: listQuotes });
}

export function useQuote(id) {
  return useQuery({
    queryKey: QK.quote(id),
    queryFn: () => getQuote(id),
    enabled: Boolean(id),
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.quotes }),
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateQuote(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.quotes });
      qc.invalidateQueries({ queryKey: QK.quote(id) });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.quotes }),
  });
}
