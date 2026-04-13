import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

const BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('brandgen-token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function FloatingAssistant() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  // Admin-only
  if (!user || user.role !== 'admin') return null;

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      if (text.startsWith('/plan ')) {
        const goal = text.substring(6).trim();
        const res = await fetch(`${BASE}/planner/plan`, {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ goal }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const plan = data.plan || {};
        let reply = `**Plan:** ${plan.summary || 'No summary'}\n`;
        if (plan.steps?.length) {
          reply += plan.steps.map(s =>
            `${s.step}. **${s.name}** (\`${s.workflow}\`)\n   ${s.reason}${s.missingInputs?.length ? `\n   _Missing: ${s.missingInputs.join(', ')}_` : ''}`
          ).join('\n');
        }
        if (plan.missingInfo?.length) reply += `\n\n**Questions:**\n${plan.missingInfo.map(q => `• ${q}`).join('\n')}`;
        if (plan.estimatedTotalCost) reply += `\n\n_Est. cost: ${plan.estimatedTotalCost} · Plan only — nothing executed_`;
        setMessages([...updated, { role: 'assistant', content: reply }]);
      } else {
        const res = await fetch(`${BASE}/dev-chat`, {
          method: 'POST', headers: getAuthHeaders(),
          body: JSON.stringify({ messages: updated }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessages([...updated, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages([...updated, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full glossy-btn text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            <Zap className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[520px] glossy rounded-3xl shadow-elevated-lg flex flex-col overflow-hidden"
          >
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-content-primary">BrandGen AI</p>
                    <p className="text-[9px] text-content-muted">Internal assistant · Admin</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-surface-raised flex items-center justify-center text-content-muted hover:text-content-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Zap className="w-8 h-8 text-brand-purple/30 mb-2" />
                    <p className="text-[12px] text-content-muted">Ask anything or type <code className="bg-surface-raised px-1 rounded text-[10px]">/plan</code> to generate a task plan.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-md bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-brand-purple" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-purple text-white rounded-br-sm'
                        : 'bg-surface-raised text-content-primary rounded-bl-sm'
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-md bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-content-muted" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-md bg-brand-purple/10 flex items-center justify-center shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-brand-purple animate-spin" />
                    </div>
                    <div className="bg-surface-raised rounded-2xl rounded-bl-sm px-3 py-2 text-[12px] text-content-muted">Thinking...</div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-surface-border">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask or /plan..."
                    className="!rounded-xl !py-2 !px-3 !text-[12px] flex-1 !border-0 !bg-surface-raised focus:!ring-0 focus:!shadow-none"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      input.trim() && !loading ? 'glossy-btn text-white' : 'bg-surface-raised text-content-muted'
                    }`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
