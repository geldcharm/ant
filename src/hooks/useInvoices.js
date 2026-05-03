import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../config/queryClient';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../db/invoices';

export function useInvoices() {
  return useQuery({ queryKey: QK.invoices, queryFn: listInvoices });
}

export function useInvoice(id) {
  return useQuery({
    queryKey: QK.invoice(id),
    queryFn: () => getInvoice(id),
    enabled: Boolean(id),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.invoices }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.invoices });
      qc.invalidateQueries({ queryKey: QK.invoice(id) });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.invoices }),
  });
}
