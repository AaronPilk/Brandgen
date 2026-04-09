import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown,
  ChevronUp, Loader2, DollarSign, Megaphone, Target, Image,
  Trash2,
} from 'lucide-react';
import {
  getApprovalQueue,
  approveQueueItem,
  rejectQueueItem,
  clearApprovalQueue,
} from '../services/api';

const STATUS_CONFIG = {
  pending: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, label: 'Pending Approval' },
  approved: { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Approved & Sent' },
  rejected: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle, label: 'Rejected' },
  failed: { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle, label: 'Failed' },
};

const TYPE_ICONS = {
  create_campaign: Megaphone,
  create_adset: Target,
  create_ad_creative: Image,
};

export default function ApprovalQueue({ profileId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [confirmResult, setConfirmResult] = useState(null);

  const fetchQueue = async () => {
    try {
      const data = await getApprovalQueue(profileId);
      setItems(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, [profileId]);

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const resolvedCount = items.filter((i) => i.status !== 'pending').length;

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const result = await approveQueueItem(id);
      setConfirmResult({ id, ...result });
      await fetchQueue();
    } catch (err) {
      setConfirmResult({ id, success: false, error: err.message });
      await fetchQueue();
    }
    setProcessingId(null);
  };

  const handleReject = async (id) => {
    setProcessingId(id);
    try {
      await rejectQueueItem(id, 'Rejected by user');
      await fetchQueue();
    } catch {}
    setProcessingId(null);
  };

  const handleClear = async () => {
    await clearApprovalQueue(profileId);
    await fetchQueue();
  };

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="mt-8 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-content-primary">Meta Ads Queue</h2>
          {pendingCount > 0 && (
            <span className="text-[11px] font-semibold text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full animate-pulse">
              {pendingCount} awaiting approval
            </span>
          )}
        </div>
        {resolvedCount > 0 && (
          <button onClick={handleClear} className="text-[12px] text-content-muted hover:text-content-secondary flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear resolved
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        <AnimatePresence>
          {items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const TypeIcon = TYPE_ICONS[item.type] || Megaphone;
            const isExpanded = expandedId === item.id;
            const isProcessing = processingId === item.id;
            const isPending = item.status === 'pending';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="glossy rounded-2xl overflow-hidden"
              >
                <div className="relative z-10">
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left p-4 flex items-center gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl ${statusConfig.bg} flex items-center justify-center`}>
                      <TypeIcon className={`w-4 h-4 ${statusConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-content-primary">
                          {item.humanSummary?.action || item.type}
                        </p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-content-muted mt-0.5">
                        {item.humanSummary?.name || ''} {item.humanSummary?.dailyBudget ? `· ${item.humanSummary.dailyBudget}` : ''}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-content-muted" /> : <ChevronDown className="w-4 h-4 text-content-muted" />}
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Summary details */}
                          <div className="bg-surface-raised rounded-xl p-4 space-y-2">
                            {Object.entries(item.humanSummary || {}).map(([key, val]) => {
                              if (key === 'action') return null;
                              return (
                                <div key={key} className="flex justify-between text-[13px]">
                                  <span className="text-content-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                  <span className="text-content-primary font-medium">{String(val)}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* API payload preview */}
                          <details className="text-[12px]">
                            <summary className="text-content-muted cursor-pointer hover:text-content-secondary transition-colors">
                              View API payload
                            </summary>
                            <pre className="mt-2 bg-surface-raised rounded-xl p-3 text-[11px] text-content-secondary overflow-x-auto font-mono">
                              {JSON.stringify(item.payload, null, 2)}
                            </pre>
                          </details>

                          {/* Execution result */}
                          {item.result && (
                            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                              <p className="text-[12px] font-semibold text-green-500 mb-1">Meta API Response</p>
                              <pre className="text-[11px] text-content-secondary font-mono overflow-x-auto">
                                {JSON.stringify(item.result.metaResponse, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Error */}
                          {item.error && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                              <p className="text-[12px] text-red-500">{item.error}</p>
                            </div>
                          )}

                          {/* Approve / Reject buttons — only for pending */}
                          {isPending && (
                            <div className="flex gap-3 pt-1">
                              <button
                                onClick={() => handleReject(item.id)}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl bg-surface-raised text-content-secondary hover:text-red-500 hover:bg-red-500/5 text-[13px] font-medium flex items-center justify-center gap-2 transition-all"
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl glossy-btn text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                Approve & Send to Meta
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation toast */}
      <AnimatePresence>
        {confirmResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-elevated-lg text-sm font-medium ${
              confirmResult.success
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {confirmResult.success
              ? `${confirmResult.result?.summary?.action || 'Action'} sent to Meta successfully`
              : `Failed: ${confirmResult.error}`}
            <button onClick={() => setConfirmResult(null)} className="ml-3 opacity-70 hover:opacity-100">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
