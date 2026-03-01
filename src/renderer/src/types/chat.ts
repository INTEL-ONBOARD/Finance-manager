export type ConversationKind = 'group' | 'dm'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  body: string
  sentAt: string // ISO 8601
}

export interface ConversationMeta {
  id: string
  kind: ConversationKind
  participantIds: string[]
  participantNames: string[]
  lastMessage: string
  lastMessageAt: string
}

export interface ChatUser {
  id: string
  name: string
  email: string
  avatar?: string | null
}
