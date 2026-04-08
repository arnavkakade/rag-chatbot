import { create } from "zustand";
import type { Conversation, Message } from "../types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  sources: { filename: string; page: number; distance: number }[];
  selectedDocumentIds: string[];
  setConversations: (c: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (m: Message[]) => void;
  addMessage: (m: Message) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreamContent: (chunk: string) => void;
  resetStream: () => void;
  setSources: (s: { filename: string; page: number; distance: number }[]) => void;
  toggleDocumentSelection: (id: string) => void;
  clearDocumentSelection: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [], activeConversationId: null, messages: [],
  isStreaming: false, streamingContent: "", sources: [], selectedDocumentIds: [],
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  appendStreamContent: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  resetStream: () => set({ streamingContent: "", sources: [] }),
  setSources: (sources) => set({ sources }),
  toggleDocumentSelection: (id) => set((s) => ({
    selectedDocumentIds: s.selectedDocumentIds.includes(id)
      ? s.selectedDocumentIds.filter((d) => d !== id)
      : [...s.selectedDocumentIds, id],
  })),
  clearDocumentSelection: () => set({ selectedDocumentIds: [] }),
}));
