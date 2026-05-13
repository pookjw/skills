import { request } from '@/infrastructure/http/client';
import type { AuthMe, GitHubLoginResponse } from '@/shared/types/api';

export const authApi = {
  getHealth: () =>
    request<{ status: string; service: string; timestamp: string }>('/health', {
      method: 'GET',
    }),

  getGitHubLoginUrl: () =>
    request<GitHubLoginResponse>('/auth/github/login', { method: 'GET' }),

  getMe: () =>
    request<AuthMe>('/auth/me', { method: 'GET' }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
};
