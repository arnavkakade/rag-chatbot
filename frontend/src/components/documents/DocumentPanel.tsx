import { useEffect, useState, useCallback } from "react";
import { Upload, FileText, Trash2, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { listDocuments, uploadDocument, deleteDocument } from "../../services/api";
import type { Document } from "../../types";
import toast from "react-hot-toast";

interface Props { onClose: () => void; }

export default function DocumentPanel({ onClose }: Props) {
  const token = useAuthStore((s) => s.token);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const loadDocs = useCallback(async () => { if (!token) return; try { const r = await listDocuments(token); setDocuments(r.documents); } catch { toast.error("Failed to load documents"); } }, [token]);
  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !token) return; setUploading(true);
    try { for (const f of Array.from(files)) { if (!f.name.toLowerCase().endsWith(".pdf")) { toast.error(`${f.name} — only PDFs`); continue; } await uploadDocument(f, token); toast.success(`Uploaded: ${f.name}`); } await loadDocs(); }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string, name: string) => { if (!token) return; try { await deleteDocument(id, token); setDocuments((p) => p.filter((d) => d.id !== id)); toast.success(`Deleted: ${name}`); } catch { toast.error("Failed"); } };
  const fmt = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const icon = (s: string) => s === "ready" ? <CheckCircle2 size={14} className="text-emerald-400" /> : s === "processing" ? <Loader2 size={14} className="text-yellow-400 animate-spin" /> : <AlertCircle size={14} className="text-red-400" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="card w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <div className={`mx-6 mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? "border-brand-500 bg-brand-600/10" : "border-gray-700 hover:border-gray-600"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}>
          <Upload size={32} className={`mx-auto mb-3 ${dragOver ? "text-brand-400" : "text-gray-500"}`} />
          <p className="text-sm text-gray-400 mb-2">Drag & drop PDFs here, or <label className="text-brand-400 hover:text-brand-300 cursor-pointer underline underline-offset-2">browse<input type="file" accept=".pdf" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} /></label></p>
          <p className="text-xs text-gray-600">PDF files up to 20 MB</p>
          {uploading && <div className="mt-3 flex items-center justify-center gap-2 text-brand-400 text-sm"><Loader2 size={16} className="animate-spin" />Uploading & processing...</div>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {documents.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No documents uploaded yet.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-4 py-3 group">
              <FileText size={18} className="text-brand-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{doc.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">{icon(doc.status)}<span className="text-xs text-gray-500 capitalize">{doc.status}</span><span className="text-xs text-gray-600">·</span><span className="text-xs text-gray-500">{fmt(doc.file_size)}</span>
                  {doc.page_count > 0 && <><span className="text-xs text-gray-600">·</span><span className="text-xs text-gray-500">{doc.page_count} pages</span></>}
                </div>
                {doc.error_message && <p className="text-xs text-red-400 mt-1">{doc.error_message}</p>}
              </div>
              <button onClick={() => handleDelete(doc.id, doc.filename)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-red-400 transition-all shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
