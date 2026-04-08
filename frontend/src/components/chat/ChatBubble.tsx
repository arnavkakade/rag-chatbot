import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrainCircuit, User } from "lucide-react";

interface Props { role: "user" | "assistant"; content: string; isStreaming?: boolean; }

export default function ChatBubble({ role, content, isStreaming }: Props) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? "bg-brand-600/20" : "bg-emerald-600/20"}`}>
        {isUser ? <User size={16} className="text-brand-400" /> : <BrainCircuit size={16} className="text-emerald-400" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isUser ? "bg-brand-600 text-white rounded-br-md" : "bg-gray-800 text-gray-100 rounded-bl-md"}`}>
        {isUser ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p> : (
          <div className="prose-chat text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {isStreaming && <span className="inline-block w-1.5 h-4 bg-emerald-400 rounded-sm animate-pulse ml-0.5 align-text-bottom" />}
          </div>
        )}
      </div>
    </div>
  );
}
