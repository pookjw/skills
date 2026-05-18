// Auth types
export type AuthMe = {
  userId: number;
  login: string;
  email?: string;
  avatarUrl?: string;
};

export type GitHubLoginResponse = {
  state: string;
  redirectUrl: string;
};

// Repository types
export type GitHubRepo = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch: string;
};

export type GitHubRepoListResponse = {
  items: GitHubRepo[];
  total: number;
};

export type ConnectedRepo = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  defaultBranch?: string;
  lastSyncedAt?: string;
};

export type ConnectedRepoListResponse = {
  items: ConnectedRepo[];
  total: number;
};

export type SyncRepositoryResponse = {
  repositoryId: number;
  totalFetched: number;
  openCount: number;
  closedCount: number;
  syncedAt: string;
};

export type SyncJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type SyncJobResponse = {
  jobId: number;
  repositoryId: number;
  status: SyncJobStatus;
  progressPercent?: number;
  totalPages?: number;
  processedPages: number;
  totalFetched: number;
  openCount: number;
  closedCount: number;
  errorMessage?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// Item types
export type RepositoryItem = {
  id: number;
  number: number;
  type: 'ISSUE' | 'PULL_REQUEST';
  state: 'OPEN' | 'CLOSED';
  title: string;
  url: string;
  labels?: string[];
  updatedAtOnGitHub: string;
};

export type RepositoryItemsResponse = {
  items: RepositoryItem[];
  total: number;
  limit?: number;
  offset?: number;
};

export type CloseItemResponse = {
  itemId: number;
  state: 'CLOSED';
  closedAt: string;
};

// Analysis types
export type AnalyzeRepositoryResponse = {
  repositoryId: number;
  analyzedItems: number;
  duplicateGroups: number;
  llmUsed: boolean;
  analyzedAt: string;
};

export type DuplicateGroupItem = {
  itemId: number;
  number: number;
  type: string;
  title: string;
  url: string;
};

export type DuplicateGroup = {
  groupId: number;
  similarity: number;
  items: DuplicateGroupItem[];
};

export type DuplicateGroupsResponse = {
  groups: DuplicateGroup[];
  totalGroups: number;
};

export type PriorityItem = {
  itemId: number;
  number: number;
  type: string;
  priority: string;
  reason: string;
  title: string;
};

export type PrioritiesResponse = {
  items: PriorityItem[];
  total: number;
};

export type LabelRecommendation = {
  label: string;
  reason: string;
  score: number;
};

export type LabelRecommendationItem = {
  itemId: number;
  title: string;
  recommendations: LabelRecommendation[];
};

export type LabelRecommendationsResponse = {
  items: LabelRecommendationItem[];
  total: number;
};
