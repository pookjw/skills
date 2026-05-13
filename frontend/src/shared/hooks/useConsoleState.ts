import { useState } from 'react';
import type {
  ConsolePageName,
  DashboardItem,
  ListFilters,
  RepoProject,
} from '@/shared/types/domain';
import type {
  ConnectedRepo,
  RepositoryItem,
  PriorityItem,
  DuplicateGroup,
  LabelRecommendationItem,
  AnalyzeRepositoryResponse,
  SyncJobResponse,
} from '@/shared/types/api';

export function useConsoleState() {
  // Health and auth state
  const [health, setHealth] = useState<'ok' | 'down' | 'checking'>('checking');
  const [me, setMe] = useState<{ userId: number; login: string; email?: string; avatarUrl?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Repository state
  const [githubRepos, setGitHubRepos] = useState<Array<{ id: number; fullName: string; isPrivate: boolean; defaultBranch: string }>>([]);
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [connectFullName, setConnectFullName] = useState('');
  const [showAddRepoForm, setShowAddRepoForm] = useState(false);

  // Data state
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [labelRecommendations, setLabelRecommendations] = useState<LabelRecommendationItem[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState<AnalyzeRepositoryResponse | null>(null);
  const [syncJob, setSyncJob] = useState<SyncJobResponse | null>(null);

  // Project state
  const [repoProjects, setRepoProjects] = useState<RepoProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [projectDescriptionInput, setProjectDescriptionInput] = useState('');

  // UI state
  const [currentPage, setCurrentPage] = useState<ConsolePageName>('issues');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [detailItemId, setDetailItemId] = useState<number | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);

  // Filters
  const [issueSearch, setIssueSearch] = useState('');
  const [prSearch, setPrSearch] = useState('');
  const [issueSort, setIssueSort] = useState<'priority-desc' | 'priority-asc' | 'newest' | 'oldest' | 'comments'>('priority-desc');
  const [prSort, setPrSort] = useState<'priority-desc' | 'priority-asc' | 'newest' | 'oldest' | 'comments'>('priority-desc');
  const [issueChips, setIssueChips] = useState({ high: true, mid: true, low: true });
  const [prChips, setPrChips] = useState({ high: true, mid: true, low: true });
  const [issueReviewerOnly, setIssueReviewerOnly] = useState(false);
  const [prReviewerOnly, setPrReviewerOnly] = useState(false);

  return {
    health,
    setHealth,
    me,
    setMe,
    notice,
    setNotice,
    error,
    setError,
    pendingAction,
    setPendingAction,
    githubRepos,
    setGitHubRepos,
    connectedRepos,
    setConnectedRepos,
    selectedRepoId,
    setSelectedRepoId,
    connectFullName,
    setConnectFullName,
    showAddRepoForm,
    setShowAddRepoForm,
    items,
    setItems,
    priorities,
    setPriorities,
    duplicates,
    setDuplicates,
    labelRecommendations,
    setLabelRecommendations,
    analysisSummary,
    setAnalysisSummary,
    syncJob,
    setSyncJob,
    repoProjects,
    setRepoProjects,
    activeProjectId,
    setActiveProjectId,
    projectNameInput,
    setProjectNameInput,
    projectDescriptionInput,
    setProjectDescriptionInput,
    currentPage,
    setCurrentPage,
    dropdownOpen,
    setDropdownOpen,
    detailItemId,
    setDetailItemId,
    labelFilter,
    setLabelFilter,
    issueSearch,
    setIssueSearch,
    prSearch,
    setPrSearch,
    issueSort,
    setIssueSort,
    prSort,
    setPrSort,
    issueChips,
    setIssueChips,
    prChips,
    setPrChips,
    issueReviewerOnly,
    setIssueReviewerOnly,
    prReviewerOnly,
    setPrReviewerOnly,
  };
}
