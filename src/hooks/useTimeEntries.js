import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../config/queryClient';
import {
  listTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '../db/timeEntries';

export function useTimeEntries() {
  return useQuery({ queryKey: QK.timeEntries, queryFn: listTimeEntries });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.timeEntries }),
  });
}

export function useUpdateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTimeEntry(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.timeEntries }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.timeEntries }),
  });
}
