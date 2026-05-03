import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../config/queryClient';
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  addJobAttachment,
  removeJobAttachment,
} from '../db/jobs';

export function useJobs() {
  return useQuery({ queryKey: QK.jobs, queryFn: listJobs });
}

export function useJob(id) {
  return useQuery({
    queryKey: QK.job(id),
    queryFn: () => getJob(id),
    enabled: Boolean(id),
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.jobs }),
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateJob(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QK.jobs });
      qc.invalidateQueries({ queryKey: QK.job(id) });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.jobs }),
  });
}

export function useAddJobAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, kind, file }) => addJobAttachment(jobId, kind, file),
    onSuccess: (_, { jobId }) => qc.invalidateQueries({ queryKey: QK.job(jobId) }),
  });
}

export function useRemoveJobAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, kind, attachmentId }) => removeJobAttachment(jobId, kind, attachmentId),
    onSuccess: (_, { jobId }) => qc.invalidateQueries({ queryKey: QK.job(jobId) }),
  });
}
