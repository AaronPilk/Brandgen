import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Users, TrendingUp, Target, MessageSquare, BarChart3, Lightbulb } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';

// Renders research data as nice formatted cards instead of raw JSON
function ResearchView({ data }) {
  let parsed = data;
  if (typeof data === 'string') {
    // Strip markdown code fences
    let cleaned = data.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
    try { parsed = JSON.parse(cleaned); } catch { return <p className="text-content-secondary text-sm whitespace-pre-wrap">{data}</p>; }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return <p className="text-content-secondary text-sm whitespace-pre-wrap">{String(data)}</p>;
  }

  const sections = [
    { key: 'targetAudience', label: 'Target Audience', icon: Users },
    { key: 'competitors', label: 'Competitors', icon: BarChart3 },
    { key: 'marketSize', label: 'Market Size', icon: TrendingUp },
    { key: 'opportunities', label: 'Opportunities', icon: Lightbulb },
    { key: 'positioning', label: 'Positioning', icon: Target },
    { key: 'messagingAngles', label: 'Messaging Angles', icon: MessageSquare },
  ];

  const renderValue = (val, depth = 0) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return <p className="text-content-secondary text-[13px] leading-relaxed">{val}</p>;
    if (Array.isArray(val)) {
      return (
        <ul className="space-y-1.5">
          {val.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-content-secondary">
              <span className="text-brand-purple mt-0.5 shrink-0">•</span>
              <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(val).map(([k, v]) => (
            <div key={k}>
              <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-1">
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
              </p>
              {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    return <p className="text-content-secondary text-[13px]">{String(val)}</p>;
  };

  // Try to render known sections, fall back to all keys
  const knownKeys = sections.map(s => s.key);
  const extraKeys = Object.keys(parsed).filter(k => !knownKeys.includes(k));

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, icon: Icon }) => {
        if (!parsed[key]) return null;
        return (
          <div key={key} className="glossy rounded-2xl p-5">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-brand-purple" />
                <h4 className="text-[14px] font-semibold text-content-primary">{label}</h4>
              </div>
              {renderValue(parsed[key])}
            </div>
          </div>
        );
      })}
      {extraKeys.map((key) => (
        <div key={key} className="glossy rounded-2xl p-5">
          <div className="relative z-10">
            <h4 className="text-[14px] font-semibold text-content-primary mb-3 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </h4>
            {renderValue(parsed[key])}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AssetViewer({ title, data, type, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    // Research gets special formatted view
    if (type === 'json' && (title === 'Market Research' || title === 'market research')) {
      return <ResearchView data={data} />;
    }

    if (type === 'html') {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-elevated">
            <iframe srcDoc={typeof data === 'string' ? data : ''} className="w-full h-[400px] border-0" title="Preview" />
          </div>
          <pre className="bg-surface-raised text-[13px] text-content-secondary p-4 rounded-2xl overflow-x-auto max-h-60 font-mono">
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    }

    if (type === 'images') {
      const items = Array.isArray(data) ? data : [];
      return (
        <div className="grid grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className="space-y-2">
              {item.image?.mock ? <ImagePlaceholder label={item.name} /> : <img src={item.image?.url} alt={item.name} className="w-full rounded-2xl" />}
              <p className="text-sm text-content-secondary text-center">{item.name}</p>
            </div>
          ))}
        </div>
      );
    }

    // JSON / text — try to render nicely
    let display = data;
    if (typeof data === 'string') {
      let cleaned = data.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
      try { display = JSON.parse(cleaned); } catch { display = data; }
    }

    if (typeof display === 'object' && display !== null) {
      return <ResearchView data={display} />;
    }

    return (
      <div className="bg-surface-raised text-[13px] text-content-secondary p-5 rounded-2xl whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
        {String(display)}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" />
        <div className="min-h-full flex items-start justify-center px-4 py-10">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative glossy rounded-3xl p-6 max-w-3xl w-full shadow-elevated-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5 sticky top-0 z-20">
                <h3 className="text-lg font-semibold text-content-primary capitalize">{title}</h3>
                <div className="flex items-center gap-1">
                  <button onClick={copyToClipboard} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-raised text-content-muted hover:text-content-primary transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-raised text-content-muted hover:text-content-primary transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {renderContent()}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
