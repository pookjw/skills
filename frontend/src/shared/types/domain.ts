import type { RepositoryItem, LabelRecommendation, DuplicateGroup } from './api';

// Domain types
export type ConsolePageName =
  | 'issues'
  | 'pullrequests'
  | 'projects'
  | 'labels'
  | 'summary'
  | 'profile'
  | 'repository';

export type ItemPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNASSIGNED';
export type BucketPriority = 'high' | 'mid' | 'low';
export type ListSort = 'priority-desc' | 'priority-asc' | 'newest' | 'oldest' | 'comments';

export type RepoProject = {
  id: string;
  repoId: number;
  name: string;
  description: string;
  createdAt: string;
};

export type DashboardItem = RepositoryItem & {
  priority: ItemPriority;
  priorityReason: string;
  recommendedLabels: LabelRecommendation[];
  duplicateMeta?: {
    groupId: number;
    similarity: number;
    siblings: Array<{ itemId: number; number: number; type: string; title: string; url: string }>;
  };
};

export type ListFilters = {
  search: string;
  chips: { high: boolean; mid: boolean; low: boolean };
  reviewerOnly: boolean;
  sort: ListSort;
  labelFilter: string | null;
};
