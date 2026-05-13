import type { ItemPriority, BucketPriority } from '../types/domain';
import { ApiError } from '../../infrastructure/http/client';

export function formatErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return `${error.statusCode}${error.errorCode ? ` (${error.errorCode})` : ''}: ${error.message}`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export function formatDateLabel(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return '-';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '-';
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / (1000 * 60)));
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}주 전`;
  return new Date(ts).toLocaleDateString();
}

export function toPriority(value: string | undefined): ItemPriority {
  if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW') return value;
  return 'UNASSIGNED';
}

export function toBucketPriority(priority: ItemPriority): BucketPriority {
  if (priority === 'HIGH') return 'high';
  if (priority === 'MEDIUM') return 'mid';
  return 'low';
}

export function initials(input: string): string {
  const words = input
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);
  if (words.length === 0) return 'U';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function normalizeSysLabel(label: string): 'Bugfix' | 'Feature' | 'Release' | 'Version Up' | 'Docs' | null {
  const lower = label.toLowerCase();
  if (lower.includes('bug')) return 'Bugfix';
  if (lower.includes('feature') || lower.includes('enhancement')) return 'Feature';
  if (lower.includes('release')) return 'Release';
  if (lower.includes('version')) return 'Version Up';
  if (lower.includes('doc')) return 'Docs';
  return null;
}

export function sysLabelClass(label: string): string {
  if (label === 'Bugfix') return 'sys-bugfix';
  if (label === 'Feature') return 'sys-feature';
  if (label === 'Release') return 'sys-release';
  if (label === 'Version Up') return 'sys-versionup';
  return 'sys-docs';
}

export function labelTagClass(label: string): string {
  if (label === 'Bugfix') return 'label-bugfix';
  if (label === 'Feature') return 'label-feature';
  if (label === 'Release') return 'label-release';
  if (label === 'Version Up') return 'label-versionup';
  if (label === 'Docs') return 'label-docs';
  return 'label-custom';
}
