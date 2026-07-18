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
  unread: boolean;
};

export const chatApi = {
  globalHistory: () => apiClient.get<ChatMessage[]>('/chat/global').then((res) => res.data),
  roomHistory: (roomId: string) => apiClient.get<ChatMessage[]>(`/chat/rooms/${roomId}`).then((res) => res.data),
  conversations: () => apiClient.get<ChatConversation[]>('/chat/dm/conversations').then((res) => res.data),
  directHistory: (userId: string) => apiClient.get<ChatMessage[]>(`/chat/dm/${userId}`).then((res) => res.data),
};
