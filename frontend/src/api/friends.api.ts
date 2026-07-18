import { apiClient } from '@/api/client';

export type FriendStatus = 'NONE' | 'FRIENDS' | 'PENDING_OUTGOING' | 'PENDING_INCOMING' | 'SELF';

export type UserSearchResult = {
  id: string;
  publicId: string;
  name: string;
  email: string | null;
  friendStatus: FriendStatus | null;
};

export type Friend = {
  id: string;
  publicId: string;
  name: string;
  email: string | null;
  avatar: string | null;
  online: boolean;
  friendsSince: string;
};

export type FriendRequestItem = {
  requestId: string;
  user: UserSearchResult;
  createdAt: string;
};

export type FriendRequests = {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
};

export type FriendActionResponse = {
  requestId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  friendId?: string;
  removed?: boolean;
};

export const friendsApi = {
  searchUsers: (query: string) => apiClient.get<UserSearchResult[]>('/users/search', { params: { q: query } }).then((res) => res.data),
  friends: () => apiClient.get<Friend[]>('/friends').then((res) => res.data),
  requests: () => apiClient.get<FriendRequests>('/friends/requests').then((res) => res.data),
  sendRequest: (userId: string) => apiClient.post<FriendActionResponse>(`/friends/requests/${userId}`).then((res) => res.data),
  acceptRequest: (requestId: string) => apiClient.post<FriendActionResponse>(`/friends/requests/${requestId}/accept`).then((res) => res.data),
  rejectRequest: (requestId: string) => apiClient.post<FriendActionResponse>(`/friends/requests/${requestId}/reject`).then((res) => res.data),
  removeFriend: (userId: string) => apiClient.delete<FriendActionResponse>(`/friends/${userId}`).then((res) => res.data),
};
