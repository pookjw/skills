import { request } from '@/infrastructure/http/client';
import type { CloseItemResponse } from '@/shared/types/api';

export const itemsApi = {
  closeItem: (id: number) =>
    request<CloseItemResponse>(`/items/${id}/close`, {
      method: 'POST',
    }),
};
