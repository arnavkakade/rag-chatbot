import { FileText, X } from "lucide-react";

interface Props { sources: { filename: string; page: number; distance: number }[]; onClose: () => void; }

export default function SourcesPanel({ sources, onClose }: Props) {
  if (sources.length === 0) return null;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 mx-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sources Referenced</h4>
        <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-500"><X size={14} /></button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, i) => (
          <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 text-xs">
            <FileText size={12} className="text-brand-400 shrink-0" />
            <span className="text-gray-300 truncate max-w-[180px]">{s.filename}</span>
            <span className="text-gray-500">p.{s.page ?? "?"}</span>
            <span className="text-gray-600">{((1 - s.distance) * 100).toFixed(0)}% match</span>
          </div>
        ))}
      </div>
    </div>
  );
}
