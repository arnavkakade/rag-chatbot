import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import AuthForm from "./components/auth/AuthForm";
import Sidebar from "./components/layout/Sidebar";
import ChatPanel from "./components/chat/ChatPanel";
import DocumentPanel from "./components/documents/DocumentPanel";

export default function App() {
  const { user, isLoading, loadUser } = useAuthStore();
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => { loadUser(); }, [loadUser]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: "#1f2937", color: "#f3f4f6", border: "1px solid #374151", fontSize: "14px" } }} />
      {!user ? <AuthForm /> : (
        <div className="h-screen flex overflow-hidden">
          <Sidebar onShowDocuments={() => setShowDocuments(true)} />
          <ChatPanel />
          {showDocuments && <DocumentPanel onClose={() => setShowDocuments(false)} />}
        </div>
      )}
    </>
  );
}
