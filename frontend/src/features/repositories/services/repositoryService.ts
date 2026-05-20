import type {
  RepositoryItem,
  PriorityItem,
  DuplicateGroup,
  LabelRecommendationItem,
} from '@/shared/types/api';
import type { DashboardItem } from '@/shared/types/domain';
import { repositoryApi } from '../api/repository.api';
import { toPriority } from '@/shared/utils/formatting';

export class RepositoryService {
  // Merge API responses into DashboardItems
  static buildDashboardItems(
    items: RepositoryItem[],
    priorities: PriorityItem[],
    recommendations: LabelRecommendationItem[],
    duplicates: DuplicateGroup[],
  ): DashboardItem[] {
    const priorityMap = new Map(priorities.map((p) => [p.itemId, p]));
    const recommendationMap = new Map(recommendations.map((r) => [r.itemId, r.recommendations]));
    const duplicateMap = new Map<number, { groupId: number; similarity: number; siblings: any[] }>();

    for (const group of duplicates) {
      for (const item of group.items) {
        duplicateMap.set(item.itemId, {
          groupId: group.groupId,
          similarity: group.similarity,
          siblings: group.items.filter((i) => i.itemId !== item.itemId),
        });
      }
    }

    return items.map((item) => {
      const priorityData = priorityMap.get(item.id);
      return {
        ...item,
        priority: toPriority(priorityData?.priority),
        priorityReason: priorityData?.reason ?? '',
        recommendedLabels: recommendationMap.get(item.id) ?? [],
        duplicateMeta: duplicateMap.get(item.id),
      };
    });
  }

  // Fetch all repository data
  static async fetchRepositoryData(repoId: number) {
    const [issuesResponse, prsResponse, prioritiesResponse, duplicatesResponse, labelsResponse] =
      await Promise.all([
        repositoryApi.listRepoItems(repoId, { type: 'ISSUE', state: 'OPEN', limit: 100 }),
        repositoryApi.listRepoItems(repoId, { type: 'PULL_REQUEST', state: 'OPEN', limit: 100 }),
        repositoryApi.getPriorities(repoId),
        repositoryApi.getDuplicates(repoId),
        repositoryApi.getLabelRecommendations(repoId),
      ]);

    return {
      items: [...issuesResponse.items, ...prsResponse.items],
      priorities: prioritiesResponse.items,
      duplicates: duplicatesResponse.groups,
      recommendations: labelsResponse.items,
    };
  }

  // Start sync job and return polling info
  static async startSync(repoId: number) {
    return repositoryApi.startSyncJob(repoId);
  }

  // Get latest sync job status
  static async getLatestSyncJob(repoId: number) {
    return repositoryApi.getLatestSyncJob(repoId);
  }

  // Get specific sync job
  static async getSyncJob(repoId: number, jobId: number) {
    return repositoryApi.getSyncJob(repoId, jobId);
  }
}
