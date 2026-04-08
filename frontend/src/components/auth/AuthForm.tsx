import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { login, signup } from "../../services/api";
import toast from "react-hot-toast";
import { BrainCircuit } from "lucide-react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, loadUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (isLogin) { const res = await login(email, password); setToken(res.access_token); await loadUser(); toast.success("Welcome back!"); }
      else { await signup(email, username, password); const res = await login(email, password); setToken(res.access_token); await loadUser(); toast.success("Account created!"); }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600/20 mb-4"><BrainCircuit className="w-8 h-8 text-brand-400" /></div>
          <h1 className="text-3xl font-bold text-white">RAG Chatbot</h1>
          <p className="text-gray-400 mt-2">Upload documents. Ask questions. Get answers.</p>
        </div>
        <div className="card p-8">
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white"}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? "bg-brand-600 text-white" : "text-gray-400 hover:text-white"}`}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1.5">Email</label><input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            {!isLogin && <div><label className="block text-sm text-gray-400 mb-1.5">Username</label><input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" required minLength={3} /></div>}
            <div><label className="block text-sm text-gray-400 mb-1.5">Password</label><input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} /></div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
