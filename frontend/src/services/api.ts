import type {
  TokenResponse, User, DocumentListResponse, Document,
  ConversationListResponse, ConversationDetail, Conversation,
} from "../types";

const BASE = "/api/v1";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Request failed");
  }
  return res.json();
}

export async function signup(email: string, username: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify({ email, username, password }),
  });
  return handleResponse<User>(res);
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify({ email, password }),
  });
  return handleResponse<TokenResponse>(res);
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/me`, { headers: getHeaders(token) });
  return handleResponse<User>(res);
}

export async function uploadDocument(file: File, token: string): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/documents/upload`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
  });
  return handleResponse<Document>(res);
}

export async function listDocuments(token: string): Promise<DocumentListResponse> {
  const res = await fetch(`${BASE}/documents/`, { headers: getHeaders(token) });
  return handleResponse<DocumentListResponse>(res);
}

export async function deleteDocument(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/documents/${id}`, { method: "DELETE", headers: getHeaders(token) });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function listConversations(token: string): Promise<ConversationListResponse> {
  const res = await fetch(`${BASE}/chat/conversations`, { headers: getHeaders(token) });
  return handleResponse<ConversationListResponse>(res);
}

export async function getConversation(id: string, token: string): Promise<ConversationDetail> {
  const res = await fetch(`${BASE}/chat/conversations/${id}`, { headers: getHeaders(token) });
  return handleResponse<ConversationDetail>(res);
}

export async function updateConversationTitle(id: string, title: string, token: string): Promise<Conversation> {
  const res = await fetch(`${BASE}/chat/conversations/${id}`, {
    method: "PATCH", headers: getHeaders(token), body: JSON.stringify({ title }),
  });
  return handleResponse<Conversation>(res);
}

export async function deleteConversation(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/chat/conversations/${id}`, { method: "DELETE", headers: getHeaders(token) });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export function sendChatMessage(
  message: string, token: string, conversationId?: string, documentIds?: string[]
): { reader: ReadableStreamDefaultReader<Uint8Array>; abort: () => void } {
  const controller = new AbortController();
  const bodyObj: Record<string, unknown> = { message };
  if (conversationId) bodyObj.conversation_id = conversationId;
  if (documentIds && documentIds.length > 0) bodyObj.document_ids = documentIds;

  const fetchPromise = fetch(`${BASE}/chat/send`, {
    method: "POST", headers: getHeaders(token),
    body: JSON.stringify(bodyObj), signal: controller.signal,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(ctrl) {
      const res = await fetchPromise;
      if (!res.ok || !res.body) { ctrl.close(); return; }
      const reader = res.body.getReader();
      const push = async () => {
        const { done, value } = await reader.read();
        if (done) { ctrl.close(); return; }
        ctrl.enqueue(value);
        await push();
      };
      await push().catch(() => ctrl.close());
    },
  });

  return { reader: stream.getReader(), abort: () => controller.abort() };
}
