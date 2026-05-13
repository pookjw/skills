import { request } from '@/infrastructure/http/client';
import type {
  GitHubRepoListResponse,
  ConnectedRepoListResponse,
  ConnectedRepo,
  SyncRepositoryResponse,
  SyncJobResponse,
  RepositoryItemsResponse,
  AnalyzeRepositoryResponse,
  DuplicateGroupsResponse,
  PrioritiesResponse,
  LabelRecommendationsResponse,
} from '@/shared/types/api';

export const repositoryApi = {
  // Repository list operations
  listGitHubRepos: () =>
    request<GitHubRepoListResponse>('/github/repos', { method: 'GET' }),

  listConnectedRepos: () =>
    request<ConnectedRepoListResponse>('/repos', { method: 'GET' }),

  // Repository connection operations
  connectRepo: (fullName: string) =>
    request<ConnectedRepo>('/repos', {
      method: 'POST',
      body: { fullName },
    }),

  disconnectRepo: (id: number) =>
    request<void>(`/repos/${id}`, {
      method: 'DELETE',
    }),

  // Repository sync operations
  syncRepo: (id: number) =>
    request<SyncRepositoryResponse>(`/repos/${id}/sync`, {
      method: 'POST',
    }),

  startSyncJob: (id: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs`, {
      method: 'POST',
    }),

  getLatestSyncJob: (id: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs/latest`, {
      method: 'GET',
    }),

  getSyncJob: (id: number, jobId: number) =>
    request<SyncJobResponse>(`/repos/${id}/sync-jobs/${jobId}`, {
      method: 'GET',
    }),

  // Repository items operations
  listRepoItems: (
    id: number,
    filters: {
      type?: 'ISSUE' | 'PULL_REQUEST';
      state?: 'OPEN' | 'CLOSED';
      limit?: number;
      offset?: number;
    },
  ) => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.state) params.set('state', filters.state);
    if (typeof filters.limit === 'number') params.set('limit', String(filters.limit));
    if (typeof filters.offset === 'number') params.set('offset', String(filters.offset));
    const query = params.toString();
    return request<RepositoryItemsResponse>(
      `/repos/${id}/items${query ? `?${query}` : ''}`,
      {
        method: 'GET',
      },
    );
  },

  // Analysis operations
  analyzeRepo: (id: number) =>
    request<AnalyzeRepositoryResponse>(`/repos/${id}/analyze`, {
      method: 'POST',
    }),

  getDuplicates: (id: number) =>
    request<DuplicateGroupsResponse>(`/repos/${id}/duplicates`, { method: 'GET' }),

  getPriorities: (id: number) =>
    request<PrioritiesResponse>(`/repos/${id}/priorities`, { method: 'GET' }),

  getLabelRecommendations: (id: number) =>
    request<LabelRecommendationsResponse>(`/repos/${id}/label-recommendations`, {
      method: 'GET',
    }),
};
