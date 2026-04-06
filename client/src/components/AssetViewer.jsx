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
          <div className="bg-white rounded-lg overflow-hidden">
            <iframe
              srcDoc={typeof data === 'string' ? data : ''}
              className="w-full h-[400px] border-0"
              title="Preview"
            />
          </div>
          <pre className="bg-surface-raised text-sm text-content-secondary p-4 rounded-lg overflow-x-auto max-h-60">
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
                <img
                  src={item.image?.url}
                  alt={item.name}
                  className="w-full rounded-lg"
                />
              )}
              <p className="text-sm text-content-secondary">{item.name}</p>
            </div>
          ))}
        </div>
      );
    }

    // JSON / text
    let display = data;
    if (typeof data === 'string') {
      try {
        display = JSON.parse(data);
      } catch {
        display = data;
      }
    }

    if (typeof display === 'object') {
      return (
        <pre className="bg-surface-raised text-sm text-content-secondary p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[60vh]">
          {JSON.stringify(display, null, 2)}
        </pre>
      );
    }

    return (
      <div className="bg-surface-raised text-sm text-content-secondary p-4 rounded-lg whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
        {display}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface-card border border-surface-border rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg hover:bg-surface-raised text-content-secondary hover:text-content-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface-raised text-content-secondary hover:text-content-primary transition-colors"
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
