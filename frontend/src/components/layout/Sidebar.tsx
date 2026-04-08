import { useEffect, useState } from "react";
import { MessageSquarePlus, FileText, Trash2, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { listConversations, deleteConversation, getConversation } from "../../services/api";
import toast from "react-hot-toast";

interface SidebarProps { onShowDocuments: () => void; }

export default function Sidebar({ onShowDocuments }: SidebarProps) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { conversations, setConversations, activeConversationId, setActiveConversation, setMessages, resetStream } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { if (token) listConversations(token).then((r) => setConversations(r.conversations)).catch(() => {}); }, [token, setConversations]);

  const handleNewChat = () => { setActiveConversation(null); setMessages([]); resetStream(); };
  const handleSelect = async (id: string) => { if (!token) return; setActiveConversation(id); resetStream(); try { const d = await getConversation(id, token); setMessages(d.messages); } catch { toast.error("Failed to load conversation"); } };
  const handleDelete = async (e: React.MouseEvent, id: string) => { e.stopPropagation(); if (!token) return; try { await deleteConversation(id, token); setConversations(conversations.filter((c) => c.id !== id)); if (activeConversationId === id) handleNewChat(); toast.success("Deleted"); } catch { toast.error("Failed"); } };

  if (collapsed) return (
    <div className="w-14 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-3 shrink-0">
      <button onClick={() => setCollapsed(false)} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
      <button onClick={handleNewChat} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="New Chat"><MessageSquarePlus size={18} /></button>
      <button onClick={onShowDocuments} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400" title="Documents"><FileText size={18} /></button>
    </div>
  );

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <span className="text-sm font-semibold text-gray-200">Chats</span>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" title="New Chat"><MessageSquarePlus size={18} /></button>
          <button onClick={() => setCollapsed(true)} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400"><ChevronLeft size={18} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {conversations.length === 0 && <p className="text-xs text-gray-500 text-center mt-8">No conversations yet</p>}
        {conversations.map((conv) => (
          <button key={conv.id} onClick={() => handleSelect(conv.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-center justify-between ${activeConversationId === conv.id ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"}`}>
            <span className="truncate flex-1">{conv.title}</span>
            <button onClick={(e) => handleDelete(e, conv.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0"><Trash2 size={14} /></button>
          </button>
        ))}
      </div>
      <div className="border-t border-gray-800 p-3 space-y-2">
        <button onClick={onShowDocuments} className="w-full btn-ghost text-sm flex items-center gap-2 justify-center"><FileText size={16} />Documents</button>
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-gray-500 truncate">{user?.username}</span>
          <button onClick={logout} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-red-400 transition-colors" title="Logout"><LogOut size={14} /></button>
        </div>
      </div>
    </div>
  );
}
