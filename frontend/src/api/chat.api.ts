import { apiClient } from '@/api/client';

export type ChatChannel = 'GLOBAL' | 'ROOM' | 'DM';
export type ChatMessageType = 'TEXT' | 'SYSTEM';

export type ChatMessage = {
  id: string;
  channel: ChatChannel;
  roomId: string | null;
  roomName: string | null;
  senderId: string;
  senderName: string;
  senderEmail: string;
  receiverId: string | null;
  receiverName: string | null;
  battleRoomId?: string | null;
  battleRoomName?: string | null;
  battleRoomCode?: string | null;
  message: string;
  type: ChatMessageType;
  deleted: boolean;
  read: boolean;
  createdAt: string;
};

export type ChatConversation = {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export const chatApi = {
  globalHistory: () => apiClient.get<ChatMessage[]>('/chat/global').then((res) => res.data),
  roomHistory: (roomId: string) => apiClient.get<ChatMessage[]>(`/chat/rooms/${roomId}`).then((res) => res.data),
  conversations: () => apiClient.get<ChatConversation[]>('/chat/dm/conversations').then((res) => res.data),
  directHistory: (userId: string) => apiClient.get<ChatMessage[]>(`/chat/dm/${userId}`).then((res) => res.data),
  markAsRead: (userId: string) => apiClient.post(`/chat/dm/${userId}/read`).then((res) => res.data),
};
