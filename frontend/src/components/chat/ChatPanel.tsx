import { useEffect, useRef, useState } from "react";
import { BrainCircuit } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useSSEChat } from "../../hooks/useSSEChat";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import SourcesPanel from "./SourcesPanel";

export default function ChatPanel() {
  const { messages, isStreaming, streamingContent, sources } = useChatStore();
  const { send, cancel } = useSSEChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showSources, setShowSources] = useState(true);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);
  useEffect(() => { if (sources.length > 0) setShowSources(true); }, [sources]);

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-600/20 to-emerald-600/20 flex items-center justify-center mb-6"><BrainCircuit className="w-10 h-10 text-brand-400" /></div>
            <h2 className="text-xl font-semibold text-gray-200 mb-2">Ask anything about your documents</h2>
            <p className="text-gray-500 text-sm text-center max-w-md">Upload PDFs in the Documents panel, then ask questions. The AI will search your documents and provide referenced answers.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {["Summarize the key findings", "What are the main recommendations?", "Compare section 2 and section 4", "List all mentioned deadlines"].map((q) => (
                <button key={q} onClick={() => send(q)} className="text-left text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl px-4 py-3 transition-colors">{q}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((msg) => <ChatBubble key={msg.id} role={msg.role} content={msg.content} />)}
            {isStreaming && streamingContent && <ChatBubble role="assistant" content={streamingContent} isStreaming />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      {showSources && sources.length > 0 && <SourcesPanel sources={sources} onClose={() => setShowSources(false)} />}
      <ChatInput onSend={send} onCancel={cancel} isStreaming={isStreaming} />
    </div>
  );
}
