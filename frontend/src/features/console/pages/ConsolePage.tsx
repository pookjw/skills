import { useEffect, useMemo, useRef } from 'react';
import { authApi } from '@/features/auth/api/auth.api';
import { repositoryApi } from '@/features/repositories/api/repository.api';
import { itemsApi } from '@/features/items/api/items.api';
import { RepositoryService } from '@/features/repositories/services/repositoryService';
import { ProjectService } from '@/features/projects/services/projectService';
import { useConsoleState } from '@/shared/hooks/useConsoleState';
import { ApiError } from '@/infrastructure/http/client';
import {
  formatErrorMessage,
  formatDateLabel,
  formatRelativeTime,
  toBucketPriority,
  initials,
  normalizeSysLabel,
  sysLabelClass,
  labelTagClass,
} from '@/shared/utils/formatting';
import { buildListItems } from '@/shared/utils/filtering';
import { pickGradient } from '@/shared/constants/design';
import type { DashboardItem, ItemPriority } from '@/shared/types/domain';
import '@/styles/console.css';

const PRIORITY_RANK: Record<ItemPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNASSIGNED: 0,
};

export function ConsolePage() {
  const state = useConsoleState();
  const syncPollingTimerRef = useRef<number | null>(null);

  const selectedRepo = useMemo(
    () => state.connectedRepos.find((repo) => repo.id === state.selectedRepoId) ?? null,
    [state.connectedRepos, state.selectedRepoId],
  );

  const selectedRepoProjects = useMemo(() => {
    if (!state.selectedRepoId) return [];
    return state.repoProjects
      .filter((project) => project.repoId === state.selectedRepoId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [state.repoProjects, state.selectedRepoId]);

  const activeProject = useMemo(
    () => selectedRepoProjects.find((project) => project.id === state.activeProjectId) ?? null,
    [selectedRepoProjects, state.activeProjectId],
  );

  const projectMatchScore = (item: DashboardItem, project: any): number => {
    return ProjectService.calculateMatchScore(item, project);
  };

  // Load projects from storage on mount
  useEffect(() => {
    const cachedProjects = ProjectService.loadProjectsFromStorage();
    if (cachedProjects.length > 0) {
      state.setRepoProjects(cachedProjects);
    }

    void loadHealth();
    void bootstrap();
  }, []);

  // Save projects to storage when they change
  useEffect(() => {
    ProjectService.saveProjectsToStorage(state.repoProjects);
  }, [state.repoProjects]);

  // Handle selected repo changes
  useEffect(() => {
    if (!state.selectedRepoId) {
      stopSyncPolling();
      state.setItems([]);
      state.setPriorities([]);
      state.setDuplicates([]);
      state.setLabelRecommendations([]);
      state.setAnalysisSummary(null);
      state.setSyncJob(null);
      state.setDetailItemId(null);
      state.setLabelFilter(null);
      return;
    }

    state.setDetailItemId(null);
    void withAction('repo-load', async () => {
      await refreshRepositoryData(state.selectedRepoId!);
      try {
        const latestJob = await repositoryApi.getLatestSyncJob(state.selectedRepoId!);
        state.setSyncJob(latestJob);
        if (latestJob.status === 'QUEUED' || latestJob.status === 'RUNNING') {
          stopSyncPolling();
          syncPollingTimerRef.current = window.setTimeout(() => {
            void pollSyncJob(state.selectedRepoId!, latestJob.jobId);
          }, 700);
        }
      } catch (jobError) {
        if (jobError instanceof ApiError && jobError.statusCode === 404) {
          state.setSyncJob(null);
          return;
        }
        throw jobError;
      }
    });
  }, [state.selectedRepoId]);

  // Cleanup sync polling on unmount
  useEffect(() => {
    return () => {
      stopSyncPolling();
    };
  }, []);

  // Validate active project
  useEffect(() => {
    if (!state.selectedRepoId) {
      state.setActiveProjectId('');
      return;
    }

    const hasActive = state.repoProjects.some(
      (project) => project.id === state.activeProjectId && project.repoId === state.selectedRepoId,
    );
    if (!hasActive) {
      state.setActiveProjectId('');
    }
  }, [state.selectedRepoId, state.activeProjectId, state.repoProjects]);

  // Handle document click for dropdown
  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('.nav-right')) {
        state.setDropdownOpen(false);
      }
    }

    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  // Utility functions
  async function withAction(actionName: string, run: () => Promise<void>) {
    state.setPendingAction(actionName);
    state.setError(null);
    try {
      await run();
    } catch (actionError) {
      state.setError(formatErrorMessage(actionError));
    } finally {
      state.setPendingAction(null);
    }
  }

  function stopSyncPolling() {
    if (syncPollingTimerRef.current !== null) {
      window.clearTimeout(syncPollingTimerRef.current);
      syncPollingTimerRef.current = null;
    }
  }

  async function pollSyncJob(repoId: number, jobId: number) {
    try {
      const latest = await repositoryApi.getSyncJob(repoId, jobId);
      state.setSyncJob(latest);

      if (latest.status === 'QUEUED' || latest.status === 'RUNNING') {
        syncPollingTimerRef.current = window.setTimeout(() => {
          void pollSyncJob(repoId, jobId);
        }, 1500);
        return;
      }

      stopSyncPolling();
      if (latest.status === 'SUCCEEDED') {
        await refreshRepositoryData(repoId);
        await loadConnectedRepos(repoId);
        state.setNotice(
          `sync 완료: fetched=${latest.totalFetched}, open=${latest.openCount}, closed=${latest.closedCount}`,
        );
      } else if (latest.status === 'FAILED') {
        state.setError(latest.errorMessage ?? 'Sync job failed');
      }
    } catch (pollError) {
      stopSyncPolling();
      state.setSyncJob(null);
      state.setError(formatErrorMessage(pollError));
    }
  }

  async function startRepositorySync(repoId: number) {
    stopSyncPolling();
    const job = await repositoryApi.startSyncJob(repoId);
    state.setSyncJob(job);
    state.setNotice('sync 시작: GitHub issues/PR을 가져오는 중입니다.');
    syncPollingTimerRef.current = window.setTimeout(() => {
      void pollSyncJob(repoId, job.jobId);
    }, 700);
  }

  async function loadHealth() {
    try {
      await authApi.getHealth();
      state.setHealth('ok');
    } catch {
      state.setHealth('down');
    }
  }

  async function bootstrap() {
    try {
      const currentUser = await authApi.getMe();
      state.setMe(currentUser);
      await Promise.all([loadGitHubRepos(), loadConnectedRepos()]);
    } catch (bootstrapError) {
      if (bootstrapError instanceof ApiError && bootstrapError.statusCode === 401) {
        state.setMe(null);
        return;
      }
      state.setError(formatErrorMessage(bootstrapError));
    }
  }

  async function refreshRepositoryData(repoId: number) {
    const data = await RepositoryService.fetchRepositoryData(repoId);
    state.setItems(data.items);
    state.setPriorities(data.priorities);
    state.setDuplicates(data.duplicates);
    state.setLabelRecommendations(data.recommendations);
  }

  async function loadConnectedRepos(preferredRepoId?: number | null): Promise<number | null> {
    const response = await repositoryApi.listConnectedRepos();
    state.setConnectedRepos(response.items);

    const currentId = preferredRepoId ?? state.selectedRepoId;
    let nextSelected: number | null = null;

    if (response.items.length > 0) {
      if (currentId && response.items.some((repo) => repo.id === currentId)) {
        nextSelected = currentId;
      } else {
        nextSelected = response.items[0].id;
      }
    }

    state.setSelectedRepoId(nextSelected);
    return nextSelected;
  }

  async function loadGitHubRepos() {
    const response = await repositoryApi.listGitHubRepos();
    state.setGitHubRepos(response.items);
  }

  async function startGitHubLogin() {
    await withAction('login', async () => {
      const login = await authApi.getGitHubLoginUrl();
      window.location.href = login.redirectUrl;
    });
  }

  async function logout() {
    await withAction('logout', async () => {
      stopSyncPolling();
      await authApi.logout();
      state.setDropdownOpen(false);
      state.setMe(null);
      state.setConnectedRepos([]);
      state.setGitHubRepos([]);
      state.setSelectedRepoId(null);
      state.setItems([]);
      state.setPriorities([]);
      state.setDuplicates([]);
      state.setLabelRecommendations([]);
      state.setAnalysisSummary(null);
      state.setSyncJob(null);
      state.setDetailItemId(null);
      state.setNotice('로그아웃 완료');
    });
  }

  async function connectRepo(fullName: string) {
    const trimmed = fullName.trim();
    if (!trimmed) return;

    await withAction('connect-repo', async () => {
      const connected = await repositoryApi.connectRepo(trimmed);
      const nextRepoId = await loadConnectedRepos(connected.id);
      if (nextRepoId) {
        await startRepositorySync(nextRepoId);
      }
      state.setConnectFullName('');
      state.setShowAddRepoForm(false);
    });
  }

  async function disconnectRepo(repoId: number) {
    await withAction('disconnect-repo', async () => {
      if (state.selectedRepoId === repoId) {
        stopSyncPolling();
      }
      await repositoryApi.disconnectRepo(repoId);
      await loadConnectedRepos();
      state.setNotice('저장소 연결 해제 완료');
    });
  }

  async function closeItem(itemId: number) {
    await withAction('close-item', async () => {
      await itemsApi.closeItem(itemId);
      state.setDetailItemId(null);
      state.setNotice('항목이 Close되었습니다.');
      if (state.selectedRepoId) {
        await refreshRepositoryData(state.selectedRepoId);
      }
    });
  }

  async function analyzeRepo(repoId: number) {
    await withAction('analyze', async () => {
      const result = await repositoryApi.analyzeRepo(repoId);
      state.setAnalysisSummary(result);
      state.setNotice(`분석 완료: ${result.analyzedItems} items, ${result.duplicateGroups} groups`);
    });
  }

  // Computed values
  const mergedItems = useMemo<DashboardItem[]>(() => {
    return RepositoryService.buildDashboardItems(
      state.items,
      state.priorities,
      state.labelRecommendations,
      state.duplicates,
    );
  }, [state.items, state.priorities, state.labelRecommendations, state.duplicates]);

  const projectScopedItems = useMemo(() => {
    if (!activeProject) return mergedItems;
    return mergedItems.filter((item) => projectMatchScore(item, activeProject) >= 0.2);
  }, [mergedItems, activeProject]);

  const issueItems = useMemo(
    () => projectScopedItems.filter((item) => item.type === 'ISSUE'),
    [projectScopedItems],
  );

  const prItems = useMemo(
    () => projectScopedItems.filter((item) => item.type === 'PULL_REQUEST'),
    [projectScopedItems],
  );

  const filteredIssues = useMemo(
    () =>
      buildListItems(issueItems, {
        search: state.issueSearch,
        chips: state.issueChips,
        reviewerOnly: state.issueReviewerOnly,
        sort: state.issueSort,
        labelFilter: state.labelFilter,
      }),
    [issueItems, state.issueSearch, state.issueChips, state.issueReviewerOnly, state.issueSort, state.labelFilter],
  );

  const filteredPrs = useMemo(
    () =>
      buildListItems(prItems, {
        search: state.prSearch,
        chips: state.prChips,
        reviewerOnly: state.prReviewerOnly,
        sort: state.prSort,
        labelFilter: state.labelFilter,
      }),
    [prItems, state.prSearch, state.prChips, state.prReviewerOnly, state.prSort, state.labelFilter],
  );

  const labelStats = useMemo(() => {
    const map = new Map<string, { label: string; observed: number; recommended: number }>();

    projectScopedItems.forEach((item) => {
      (item.labels ?? []).forEach((label) => {
        const key = label.toLowerCase();
        const prev = map.get(key) ?? { label, observed: 0, recommended: 0 };
        prev.observed += 1;
        map.set(key, prev);
      });

      item.recommendedLabels.forEach((rec) => {
        const key = rec.label.toLowerCase();
        const prev = map.get(key) ?? { label: rec.label, observed: 0, recommended: 0 };
        prev.recommended += 1;
        map.set(key, prev);
      });
    });

    return Array.from(map.values()).sort((left, right) => {
      const leftTotal = left.observed + left.recommended;
      const rightTotal = right.observed + right.recommended;
      if (rightTotal !== leftTotal) return rightTotal - leftTotal;
      return left.label.localeCompare(right.label);
    });
  }, [projectScopedItems]);

  const priorityCounts = useMemo(() => {
    const counts: Record<ItemPriority, number> = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      UNASSIGNED: 0,
    };
    projectScopedItems.forEach((item) => {
      counts[item.priority] += 1;
    });
    return counts;
  }, [projectScopedItems]);

  const detailItem = useMemo(
    () => mergedItems.find((item) => item.id === state.detailItemId) ?? null,
    [mergedItems, state.detailItemId],
  );

  const syncJobRunning = state.syncJob?.status === 'QUEUED' || state.syncJob?.status === 'RUNNING';
  const syncProgressUnknown = syncJobRunning && state.syncJob?.progressPercent === undefined;
  const syncProgressPercent =
    state.syncJob?.progressPercent ??
    (state.syncJob?.status === 'SUCCEEDED' ? 100 : state.syncJob?.status === 'FAILED' ? 0 : 35);
  const repoHasNeverSynced = Boolean(selectedRepo && !selectedRepo.lastSyncedAt && !syncJobRunning);
  const syncFailedMessage = state.syncJob?.status === 'FAILED' ? state.syncJob.errorMessage : null;

  function renderEmptyList(kind: 'issues' | 'pull requests') {
    let message = `No ${kind} found`;
    if (!selectedRepo) {
      message = 'Repository를 먼저 선택하세요';
    } else if (syncJobRunning) {
      message = `GitHub ${kind}를 가져오는 중입니다`;
    } else if (syncFailedMessage) {
      message = `Sync failed: ${syncFailedMessage}`;
    } else if (repoHasNeverSynced) {
      message = '아직 sync된 데이터가 없습니다. Repository 화면에서 Sync Issues/PRs를 실행하세요.';
    }

    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text2)' }}>
        {message}
      </div>
    );
  }

  // Render functions
  function renderListItem(item: DashboardItem) {
    const bucket = toBucketPriority(item.priority);
    const rawLabels = item.labels ?? [];
    const sysLabels = rawLabels
      .map((label) => normalizeSysLabel(label))
      .filter((label): label is Exclude<ReturnType<typeof normalizeSysLabel>, null> => Boolean(label));
    const customLabels = rawLabels.filter((label) => !normalizeSysLabel(label)).slice(0, 2);

    const convCount = item.recommendedLabels.length + (item.duplicateMeta?.siblings.length ?? 0);

    return (
      <div
        key={item.id}
        className={`issue-item ${item.duplicateMeta ? 'dup-group' : ''}`}
        onClick={() => state.setDetailItemId(item.id)}
        style={{ cursor: 'pointer' }}
      >
        <div className="issue-left">
          <div className="issue-title-row">
            <span className={`priority-dot ${bucket}`} />
            <span className="issue-number">#{item.number}</span>
            <span className="issue-title">{item.title}</span>
            {customLabels.map((label) => (
              <span key={`${item.id}-${label}`} className="label-custom-inline">
                {label}
              </span>
            ))}
            {item.duplicateMeta && <span className="badge-dup-sm">⚠ Duplicate</span>}
          </div>
          <div className="issue-summary">
            {item.priorityReason.length > 180
              ? `${item.priorityReason.slice(0, 180)}...`
              : item.priorityReason}
          </div>
          <div className="issue-meta-row">
            <span>{formatRelativeTime(item.updatedAtOnGitHub)}</span>
            {sysLabels.map((label) => (
              <span key={`${item.id}-${label}`} className={`sys-label ${sysLabelClass(label)}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="issue-right">
          <span className="issue-conv-badge">{convCount}</span>
        </div>
      </div>
    );
  }

  if (!state.me) {
    return (
      <div id="screen-login" className="screen active">
        <div className="login-box">
          <div className="login-header">
            <div>
              <div className="login-logo">
                <svg width="48" height="48" viewBox="0 0 42 42" fill="none">
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0969da" />
                      <stop offset="100%" stopColor="#8250df" />
                    </linearGradient>
                  </defs>
                  <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg)" opacity="0.92" />
                  <path d="M13 16 L29 16M13 21 L25 21M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1>TidyX</h1>
              <p>GitHub Issue 분석 및 자동 레이블링 시스템</p>
            </div>
          </div>

          <div className="login-divider">또는</div>

          <button className="btn-github" onClick={() => void startGitHubLogin()}>
            GitHub으로 계속하기
          </button>

          {state.error && <p className="error" style={{ marginTop: 12 }}>{state.error}</p>}
        </div>
      </div>
    );
  }

  if (state.detailItemId && detailItem) {
    const bucket = toBucketPriority(detailItem.priority);
    const statusClass = detailItem.state === 'OPEN' ? 'status-open' : 'status-closed';
    const statusText = detailItem.state === 'OPEN' ? 'OPEN' : 'CLOSED';

    const observedLabels = detailItem.labels ?? [];
    const recommendedLabels = detailItem.recommendedLabels.map((label) => label.label);
    const allObserved = observedLabels.length > 0 ? observedLabels : ['needs-triage'];

    return (
      <div id="screen-detail" className="screen active">
        <nav className="detail-topnav">
          <a className="nav-logo" onClick={() => state.setDetailItemId(null)} style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
              <defs>
                <linearGradient id="lg-det" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0969da" />
                  <stop offset="100%" stopColor="#8250df" />
                </linearGradient>
              </defs>
              <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg-det)" opacity="0.92" />
              <path d="M13 16 L29 16M13 21 L25 21M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="nav-logo-wordmark">
              Tidy<span>X</span>
            </span>
          </a>
          <div className="nav-divider" />
          <button className="detail-back" onClick={() => state.setDetailItemId(null)}>
            ← 목록으로 돌아가기
          </button>
        </nav>

        <div className="detail-body">
          <div className="detail-main">
            <div className="detail-title-row">
              <span className={`priority-dot ${bucket}`} style={{ marginTop: 6 }} />
              <div className="detail-title">{detailItem.title}</div>
            </div>

            <div className="detail-meta">
              <span className={`status-badge ${statusClass}`}>● {statusText}</span>
              <span>#{detailItem.number}</span>
              <span>by <strong>{selectedRepo?.owner ?? state.me?.login}</strong></span>
              <span>{formatDateLabel(detailItem.updatedAtOnGitHub)}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {allObserved.map((label) => (
                  <span key={`obs-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {detailItem.duplicateMeta && (
              <div className="dup-banner">
                <div className="dup-banner-text">
                  ⚠ 이 항목은 duplicate group #{detailItem.duplicateMeta.groupId}로 분류되었습니다.
                </div>
                {detailItem.state === 'OPEN' && (
                  <button className="btn-close-iss" onClick={() => void closeItem(detailItem.id)}>
                    이 항목 Close
                  </button>
                )}
              </div>
            )}

            <div className="detail-body-text">
              {detailItem.priorityReason}
            </div>
          </div>

          <div className="detail-sidebar">
            <div className="ds-section">
              <div className="ds-title">Labels</div>
              <div className="ds-label-wrap">
                {allObserved.map((label) => (
                  <span key={`sidebar-obs-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                    {label}
                  </span>
                ))}
              </div>

              <div className="ds-title" style={{ marginTop: 14 }}>AI 추천 Labels</div>
              <div className="ds-label-wrap">
                {recommendedLabels.length > 0 ? (
                  recommendedLabels.map((label) => (
                    <span key={`sidebar-rec-${label}`} className={`label-tag ${labelTagClass(normalizeSysLabel(label) ?? label)}`}>
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="label-tag label-custom">추천 라벨 없음</span>
                )}
              </div>
            </div>

            <div className="ds-section">
              <div className="ds-title">Project</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{activeProject?.name ?? '미지정'}</div>
            </div>

            <div className="ds-section">
              <div className="ds-title">Priority</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span className={`priority-dot ${bucket}`} style={{ width: 9, height: 9 }} />
                <span>{detailItem.priority}</span>
              </div>
            </div>

            <div className="ds-section" style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <a className="btn-github-link" href={detailItem.url} target="_blank" rel="noreferrer">
                GitHub에서 보기 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const issueCountText = issueItems.length.toLocaleString();
  const prCountText = prItems.length.toLocaleString();

  return (
    <div id="screen-console" className="screen active">
      <nav className="topnav">
        <a className="nav-logo" onClick={() => state.setCurrentPage('issues')} style={{ cursor: 'pointer' }}>
          <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
            <defs>
              <linearGradient id="lg-nav" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0969da" />
                <stop offset="100%" stopColor="#8250df" />
              </linearGradient>
            </defs>
            <path d="M21 2 L37 11 L37 31 L21 40 L5 31 L5 11 Z" fill="url(#lg-nav)" opacity="0.92" />
            <path d="M13 16 L29 16M13 21 L25 21M13 26 L27 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="nav-logo-wordmark">
            Tidy<span>X</span>
          </span>
        </a>

        <div className="nav-divider" />

        <button className="nav-repo-selector" onClick={() => state.setCurrentPage('repository')}>
          {selectedRepo?.fullName ?? 'Repository 선택'} ▾
        </button>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${state.currentPage === 'issues' ? 'active' : ''}`}
            onClick={() => state.setCurrentPage('issues')}
          >
            Issues <span className="tab-count">{issueCountText}</span>
          </button>
          <button
            className={`nav-tab ${state.currentPage === 'pullrequests' ? 'active' : ''}`}
            onClick={() => state.setCurrentPage('pullrequests')}
          >
            Pull Requests <span className="tab-count">{prCountText}</span>
          </button>
          <button
            className={`nav-tab ${state.currentPage === 'projects' ? 'active' : ''}`}
            onClick={() => state.setCurrentPage('projects')}
          >
            Projects
          </button>
          <button
            className={`nav-tab ${state.currentPage === 'labels' ? 'active' : ''}`}
            onClick={() => state.setCurrentPage('labels')}
          >
            Labels
          </button>
          <button
            className={`nav-tab ${state.currentPage === 'summary' ? 'active' : ''}`}
            onClick={() => state.setCurrentPage('summary')}
          >
            Summary
          </button>
        </div>

        <div className="nav-right">
          <div className="nav-btn">API: {state.health}</div>
          <div className="nav-avatar" onClick={() => state.setDropdownOpen((prev) => !prev)} style={{ cursor: 'pointer' }}>
            {state.me && initials(state.me.login)}
          </div>

          <div className={`dropdown ${state.dropdownOpen ? 'open' : ''}`}>
            <div className="dropdown-item" onClick={() => { state.setCurrentPage('profile'); state.setDropdownOpen(false); }}>
              <span>👤</span>내 프로필
            </div>
            <div className="dropdown-item" onClick={() => { state.setCurrentPage('repository'); state.setDropdownOpen(false); }}>
              <span>📁</span>Repository 관리
            </div>
            <div className="dropdown-divider" />
            <div className="dropdown-item" onClick={() => void logout()}>
              <span>🚪</span>로그아웃
            </div>
          </div>
        </div>
      </nav>

      <div className="content">
        {state.notice && <p className="notice" style={{ margin: '14px 24px 0' }}>{state.notice}</p>}
        {state.error && <p className="error" style={{ margin: '14px 24px 0' }}>{state.error}</p>}
        {state.pendingAction && (
          <p className="muted" style={{ margin: '10px 24px 0', fontSize: 12 }}>
            진행 중: {state.pendingAction}
          </p>
        )}

        {state.currentPage === 'issues' && (
          <div className="page active" id="page-issues">
            <div className="page-header">
              <div className="page-title">Issues</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search issues..."
                  value={state.issueSearch}
                  onChange={(e) => state.setIssueSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-chips">
              <button
                className={`chip ${state.issueChips.high ? 'active' : ''}`}
                onClick={() => state.setIssueChips((prev) => ({ ...prev, high: !prev.high }))}
              >
                🔴 High
              </button>
              <button
                className={`chip ${state.issueChips.mid ? 'active' : ''}`}
                onClick={() => state.setIssueChips((prev) => ({ ...prev, mid: !prev.mid }))}
              >
                🟡 Mid
              </button>
              <button
                className={`chip ${state.issueChips.low ? 'active' : ''}`}
                onClick={() => state.setIssueChips((prev) => ({ ...prev, low: !prev.low }))}
              >
                ⚪ Low
              </button>
            </div>

            <div className="issue-list">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((item) => renderListItem(item))
              ) : (
                renderEmptyList('issues')
              )}
            </div>
          </div>
        )}

        {state.currentPage === 'pullrequests' && (
          <div className="page active" id="page-pullrequests">
            <div className="page-header">
              <div className="page-title">Pull Requests</div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search pull requests..."
                  value={state.prSearch}
                  onChange={(e) => state.setPrSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-chips">
              <button
                className={`chip ${state.prChips.high ? 'active' : ''}`}
                onClick={() => state.setPrChips((prev) => ({ ...prev, high: !prev.high }))}
              >
                🔴 High
              </button>
              <button
                className={`chip ${state.prChips.mid ? 'active' : ''}`}
                onClick={() => state.setPrChips((prev) => ({ ...prev, mid: !prev.mid }))}
              >
                🟡 Mid
              </button>
              <button
                className={`chip ${state.prChips.low ? 'active' : ''}`}
                onClick={() => state.setPrChips((prev) => ({ ...prev, low: !prev.low }))}
              >
                ⚪ Low
              </button>
            </div>

            <div className="issue-list">
              {filteredPrs.length > 0 ? (
                filteredPrs.map((item) => renderListItem(item))
              ) : (
                renderEmptyList('pull requests')
              )}
            </div>
          </div>
        )}

        {state.currentPage === 'labels' && (
          <div className="page active" id="page-labels">
            <div className="page-header">
              <div className="page-title">Labels</div>
            </div>

            <div className="labels-container">
              {labelStats.map((stat) => {
                const sys = normalizeSysLabel(stat.label) ?? 'Docs';
                const swatch =
                  sys === 'Bugfix'
                    ? '#cf222e'
                    : sys === 'Feature'
                      ? '#0550ae'
                      : sys === 'Release'
                        ? '#1a7f37'
                        : sys === 'Version Up'
                          ? '#8250df'
                          : '#9a6700';

                return (
                  <div key={stat.label} className="label-row">
                    <div className="label-swatch" style={{ background: swatch }} />
                    <button className="label-name-btn" onClick={() => state.setLabelFilter(stat.label)}>
                      {stat.label}
                    </button>
                    <div className="label-desc">
                      observed {stat.observed} · recommended {stat.recommended}
                    </div>
                  </div>
                );
              })}

              {labelStats.length === 0 && (
                <div className="label-row">
                  <div className="label-desc">label 데이터가 없습니다.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {state.currentPage === 'summary' && (
          <div className="page active" id="page-summary">
            <div className="page-header">
              <div className="page-title">Summary</div>
              <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text2)' }}>
                {selectedRepo?.fullName ?? 'Repository 미선택'}
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-card-title">전체 Issues</div>
                <div className="stat-number">{issueItems.length}</div>
                <div className="stat-label">Open Issues</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-title">전체 Pull Requests</div>
                <div className="stat-number">{prItems.length}</div>
                <div className="stat-label">Open Pull Requests</div>
              </div>

              <div className="summary-card" style={{ gridColumn: 'span 2' }}>
                <div className="summary-card-title">Priority 분포</div>
                <div className="bar-chart">
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => {
                    const count = priorityCounts[priority];
                    const maxPriority = Math.max(...Object.values(priorityCounts), 1);
                    const width = `${(count / maxPriority) * 100}%`;
                    const color =
                      priority === 'HIGH' ? '#cf222e' : priority === 'MEDIUM' ? '#d4a72c' : '#c4c9d0';
                    return (
                      <div key={priority} className="bar-row">
                        <span className="bar-label">
                          {priority === 'HIGH' ? '🔴 High' : priority === 'MEDIUM' ? '🟡 Mid' : '⚪ Low'}
                        </span>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width, background: color }} />
                        </div>
                        <span className="bar-val">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {state.currentPage === 'repository' && (
          <div className="page active" id="page-repository">
            <div className="page-header">
              <div className="page-title">Repository</div>
            </div>

            <div className="repo-section">
              <h3>Connected Repositories</h3>
              <div className="repo-list">
                {state.connectedRepos.map((repo) => (
                  <div key={repo.id} className="repo-item">
                    <div className="repo-info">
                      <div className="repo-name">{repo.fullName}</div>
                      <div className="repo-meta">
                        {repo.isPrivate ? '🔒 Private' : '🌐 Public'} · Last synced: {formatRelativeTime(repo.lastSyncedAt)}
                      </div>
                    </div>
                    <div className="repo-actions">
                      <button
                        className={`btn-repo ${state.selectedRepoId === repo.id ? 'active' : ''}`}
                        onClick={() => state.setSelectedRepoId(repo.id)}
                      >
                        {state.selectedRepoId === repo.id ? '✓ Selected' : 'Select'}
                      </button>
                      <button className="btn-sm btn-sm-danger" onClick={() => void disconnectRepo(repo.id)}>
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {state.selectedRepoId && (
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button
                    className="btn-add"
                    disabled={syncJobRunning}
                    onClick={() =>
                      void withAction('sync', async () => {
                        await startRepositorySync(state.selectedRepoId!);
                      })
                    }
                  >
                    {syncJobRunning ? 'Syncing...' : 'Sync Issues/PRs'}
                  </button>
                  <button className="btn-add" onClick={() => void analyzeRepo(state.selectedRepoId!)}>
                    📊 Analyze
                  </button>
                </div>
              )}
            </div>

            <div className="repo-section">
              <h3>Add Repository</h3>
              {!state.showAddRepoForm ? (
                <button className="btn-add" onClick={() => state.setShowAddRepoForm(true)}>
                  + Add Repository
                </button>
              ) : (
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="owner/repo or GitHub URL"
                    value={state.connectFullName}
                    onChange={(e) => state.setConnectFullName(e.target.value)}
                  />
                  <button className="btn-primary" onClick={() => void connectRepo(state.connectFullName)}>
                    Connect
                  </button>
                  <button className="btn-secondary" onClick={() => state.setShowAddRepoForm(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {state.currentPage === 'projects' && (
          <div className="page active" id="page-projects">
            <div className="page-header">
              <div className="page-title">Projects</div>
            </div>

            {state.selectedRepoId ? (
              <div className="projects-container">
                {selectedRepoProjects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-card-title">{project.name}</div>
                    <div className="project-card-desc">{project.description}</div>
                    <div className="project-card-actions">
                      <button className="btn-sm btn-sm-switch" onClick={() => state.setActiveProjectId(project.id)}>
                        {state.activeProjectId === project.id ? '✓ Active' : 'Set Active'}
                      </button>
                    </div>
                  </div>
                ))}

                {selectedRepoProjects.length === 0 && (
                  <div className="project-card">
                    <div className="project-card-title">등록된 Project가 없습니다</div>
                    <div className="project-card-desc">프로젝트를 추가해보세요.</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="project-card">
                <div className="project-card-title">Active Repository를 먼저 선택하세요</div>
              </div>
            )}
          </div>
        )}

        {state.currentPage === 'profile' && (
          <div className="page active" id="page-profile">
            <div className="page-header">
              <div className="page-title">Profile</div>
            </div>

            {state.me && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: pickGradient(state.me.login), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                    {initials(state.me.login)}
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{state.me.login}</div>
                    {state.me.email && <div style={{ fontSize: 14, color: 'var(--text2)' }}>{state.me.email}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {state.syncJob && (
          <div style={{ margin: '0 24px 24px' }}>
            <div className="sync-progress-wrap">
              <p className="muted mini-text">
                job #{state.syncJob.jobId} · {state.syncJob.status}
              </p>
              <div className="sync-progress-track">
                <div
                  className={`sync-progress-fill ${syncJobRunning ? 'running' : ''}`}
                  style={{ width: `${Math.max(4, Math.min(100, syncProgressPercent))}%` }}
                />
              </div>
              <p className="muted mini-text">
                {syncProgressUnknown ? 'estimating…' : `${syncProgressPercent}%`}
              </p>
              {state.syncJob.errorMessage && <p className="error sync-error">{state.syncJob.errorMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
