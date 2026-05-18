import type { DashboardItem, ListSort, ListFilters, BucketPriority, ItemPriority } from '../types/domain';

const PRIORITY_RANK: Record<ItemPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  UNASSIGNED: 0,
};

export function buildListItems(
  items: DashboardItem[],
  options: ListFilters,
): DashboardItem[] {
  const search = options.search.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const bucket: BucketPriority = item.priority === 'HIGH' ? 'high' : item.priority === 'MEDIUM' ? 'mid' : 'low';
    if (!options.chips[bucket]) return false;

    if (options.reviewerOnly) return false;

    if (options.labelFilter) {
      const lower = options.labelFilter.toLowerCase();
      const observed = (item.labels ?? []).some((label) => label.toLowerCase() === lower);
      const recommended = item.recommendedLabels.some((label) => label.label.toLowerCase() === lower);
      if (!observed && !recommended) return false;
    }

    if (search) {
      const haystack = [
        item.title,
        item.priorityReason,
        ...(item.labels ?? []),
        ...item.recommendedLabels.map((label) => label.label),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  return filtered.sort((left, right) => {
    if (options.sort === 'priority-desc') {
      const diff = PRIORITY_RANK[right.priority] - PRIORITY_RANK[left.priority];
      if (diff !== 0) return diff;
    }

    if (options.sort === 'priority-asc') {
      const diff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
      if (diff !== 0) return diff;
    }

    const leftTime = new Date(left.updatedAtOnGitHub).getTime();
    const rightTime = new Date(right.updatedAtOnGitHub).getTime();

    if (options.sort === 'newest') {
      if (leftTime !== rightTime) return rightTime - leftTime;
    }

    if (options.sort === 'oldest') {
      if (leftTime !== rightTime) return leftTime - rightTime;
    }

    if (options.sort === 'comments') {
      const leftConv = left.recommendedLabels.length + (left.duplicateMeta?.siblings.length ?? 0);
      const rightConv = right.recommendedLabels.length + (right.duplicateMeta?.siblings.length ?? 0);
      if (leftConv !== rightConv) return rightConv - leftConv;
    }

    return right.number - left.number;
  });
}
