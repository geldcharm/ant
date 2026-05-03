import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../config/queryClient';
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../db/employees';

export function useEmployees() {
  return useQuery({ queryKey: QK.employees, queryFn: listEmployees });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employees }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employees }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employees }),
  });
}
