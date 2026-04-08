export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Document {
  id: string;
  filename: string;
  file_size: number;
  page_count: number;
  status: "processing" | "ready" | "failed";
  error_message?: string;
  created_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface SSEConversationEvent { id: string; title: string; }
export interface SSETokenEvent { content: string; }
export interface SSESourcesEvent { filename: string; page: number; distance: number; }
export interface SSEDoneEvent { message_id: string; }
