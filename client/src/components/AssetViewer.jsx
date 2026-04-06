import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';

export default function AssetViewer({ title, data, type, onClose }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    if (type === 'html') {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden shadow-elevated">
            <iframe
              srcDoc={typeof data === 'string' ? data : ''}
              className="w-full h-[400px] border-0"
              title="Preview"
            />
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
              {item.image?.mock ? (
                <ImagePlaceholder label={item.name} />
              ) : (
                <img src={item.image?.url} alt={item.name} className="w-full rounded-2xl" />
              )}
              <p className="text-sm text-content-secondary text-center">{item.name}</p>
            </div>
          ))}
        </div>
      );
    }

    let display = data;
    if (typeof data === 'string') {
      try { display = JSON.parse(data); } catch { display = data; }
    }

    return (
      <pre className="bg-surface-raised text-[13px] text-content-secondary p-5 rounded-2xl overflow-x-auto whitespace-pre-wrap max-h-[60vh] font-mono">
        {typeof display === 'object' ? JSON.stringify(display, null, 2) : display}
      </pre>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative glass border border-surface-border rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-elevated-lg"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-content-primary capitalize">{title}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={copyToClipboard}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-raised text-content-muted hover:text-content-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-raised text-content-muted hover:text-content-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {renderContent()}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
