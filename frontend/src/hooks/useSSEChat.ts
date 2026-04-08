import { useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { sendChatMessage } from "../services/api";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";

export function useSSEChat() {
  const token = useAuthStore((s) => s.token);
  const { activeConversationId, setActiveConversation, addMessage, setIsStreaming, appendStreamContent, resetStream, setSources, setConversations, conversations, selectedDocumentIds } = useChatStore();
  const abortRef = useRef<(() => void) | null>(null);

  const send = useCallback(async (message: string) => {
    if (!token) return;
    if (selectedDocumentIds.length === 0) { toast.error("Please select at least one document"); return; }
    resetStream(); setIsStreaming(true);
    addMessage({ id: crypto.randomUUID(), role: "user", content: message, created_at: new Date().toISOString() });
    const { reader, abort } = sendChatMessage(message, token, activeConversationId ?? undefined, selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined);
    abortRef.current = abort;
    const decoder = new TextDecoder();
    let buffer = "";
    let finalContent = "";
    let currentEvent = "";
    let messageAdded = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("event: ")) { currentEvent = line.slice(7).trim(); }
          else if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (currentEvent === "conversation") {
                setActiveConversation(parsed.id);
                if (!conversations.find((c) => c.id === parsed.id))
                  setConversations([{ id: parsed.id, title: parsed.title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...conversations]);
              } else if (currentEvent === "sources") setSources(parsed);
              else if (currentEvent === "token") { appendStreamContent(parsed.content); finalContent += parsed.content; }
              else if (currentEvent === "done") {
                addMessage({ id: parsed.message_id ?? crypto.randomUUID(), role: "assistant", content: finalContent, created_at: new Date().toISOString() });
                messageAdded = true;
              } else if (currentEvent === "error") {
                toast.error(parsed.message || "Something went wrong");
              }
            } catch {}
          }
        }
      }
      if (finalContent && !messageAdded) addMessage({ id: crypto.randomUUID(), role: "assistant", content: finalContent, created_at: new Date().toISOString() });
    } catch (err: unknown) { if (err instanceof Error && err.name !== "AbortError") console.error(err); }
    finally { setIsStreaming(false); abortRef.current = null; }
  }, [token, activeConversationId, addMessage, appendStreamContent, conversations, resetStream, setActiveConversation, setConversations, setIsStreaming, setSources, selectedDocumentIds]);

  const cancel = useCallback(() => { abortRef.current?.(); setIsStreaming(false); }, [setIsStreaming]);
  return { send, cancel };
}
