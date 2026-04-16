import { useState, useRef, useEffect } from "react";
import { Send, StopCircle, FileText, X, ChevronDown } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { listDocuments } from "../../services/api";
import type { Document } from "../../types";

interface Props { onSend: (m: string) => void; onCancel: () => void; isStreaming: boolean; disabled?: boolean; }

export default function ChatInput({ onSend, onCancel, isStreaming, disabled }: Props) {
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.token);
  const { selectedDocumentIds, toggleDocumentSelection, clearDocumentSelection } = useChatStore();

  const loadDocs = () => {
    if (!token) return;
    listDocuments(token).then((r) => setDocuments(r.documents.filter((d) => d.status === "ready"))).catch(() => {});
  };

  useEffect(() => { loadDocs(); }, [token]);

  // Reload documents when the picker is opened (ensures fresh list)
  useEffect(() => { if (showDocPicker) loadDocs(); }, [showDocPicker]);

  useEffect(() => { if (ref.current) { ref.current.style.height = "auto"; ref.current.style.height = Math.min(ref.current.scrollHeight, 160) + "px"; } }, [message]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowDocPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submit = () => { const t = message.trim(); if (!t || isStreaming || disabled) return; onSend(t); setMessage(""); };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } };

  const selectedDocs = documents.filter((d) => selectedDocumentIds.includes(d.id));

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Document filter bar */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowDocPicker((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              <FileText size={13} />
              {selectedDocumentIds.length === 0 ? "All documents" : `${selectedDocumentIds.length} selected`}
              <ChevronDown size={12} />
            </button>
            {showDocPicker && (
              <div className="absolute bottom-full mb-2 left-0 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-300">Filter by document</span>
                  {selectedDocumentIds.length > 0 && (
                    <button onClick={clearDocumentSelection} className="text-xs text-brand-400 hover:text-brand-300">Clear all</button>
                  )}
                </div>
                {documents.length === 0 ? (
                  <p className="text-xs text-gray-500 px-3 py-3">No ready documents</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    {documents.map((doc) => {
                      const selected = selectedDocumentIds.includes(doc.id);
                      return (
                        <button key={doc.id} onClick={() => toggleDocumentSelection(doc.id)}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-800 transition-colors ${selected ? "bg-gray-800/60" : ""}`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-brand-600 border-brand-600" : "border-gray-600"}`}>
                            {selected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span className="text-xs text-gray-300 truncate">{doc.filename}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          {selectedDocs.map((doc) => (
            <span key={doc.id} className="flex items-center gap-1 text-xs bg-brand-600/20 text-brand-300 border border-brand-600/30 rounded-lg px-2 py-1">
              {doc.filename.length > 24 ? doc.filename.slice(0, 24) + "…" : doc.filename}
              <button onClick={() => toggleDocumentSelection(doc.id)} className="hover:text-white ml-0.5"><X size={11} /></button>
            </span>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <textarea ref={ref} value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={onKey} placeholder="Ask a question about your documents..." rows={1} className="input-field resize-none pr-4 py-3 min-h-[48px] flex-1" disabled={disabled} />
          {isStreaming ? (
            <button onClick={onCancel} className="p-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors shrink-0"><StopCircle size={20} /></button>
          ) : (
            <button onClick={submit} disabled={!message.trim() || disabled} className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-40 shrink-0"><Send size={20} /></button>
          )}
        </div>
        <p className="text-[10px] text-gray-600 text-center mt-2">Responses are generated using RAG from your uploaded documents.</p>
      </div>
    </div>
  );
}
