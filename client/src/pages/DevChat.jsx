import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, User, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

const BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('brandgen-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function DevChat() {
  const { user } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUsage, setLastUsage] = useState(null);
  const endRef = useRef(null);

  // Access guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-content-primary font-semibold">Access Denied</p>
          <p className="text-content-muted text-sm mt-1">Admin only</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE}/dev-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ messages: updated }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setMessages([...updated, { role: 'assistant', content: data.reply }]);
      setLastUsage(data.usage);
    } catch (err) {
      setMessages([...updated, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-content-primary">Dev Chat</h1>
          <p className="text-[11px] text-content-muted">Internal · Admin only · Not visible to users</p>
        </div>
        {lastUsage && (
          <div className="text-[10px] text-content-muted text-right">
            <span>{lastUsage.provider}/{lastUsage.model}</span>
            <span className="ml-2">{lastUsage.inputTokens + lastUsage.outputTokens} tok</span>
            <span className="ml-2">{lastUsage.latencyMs}ms</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-content-muted text-sm">
            Ask anything. No context is loaded by default.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-brand-purple" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-purple text-white rounded-br-md'
                : 'glossy rounded-bl-md'
            }`}>
              <div className={msg.role === 'assistant' ? 'relative z-10' : ''}>
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-content-muted" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-brand-purple animate-spin" />
            </div>
            <div className="glossy rounded-2xl rounded-bl-md px-4 py-3">
              <div className="relative z-10 text-[13px] text-content-muted">Thinking...</div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="glossy rounded-2xl p-2 flex gap-2">
        <div className="relative z-10 flex gap-2 flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows={1}
            className="!rounded-xl !py-2.5 !px-3.5 !text-[13px] flex-1 resize-none !border-0 !bg-transparent focus:!ring-0 focus:!shadow-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`px-4 rounded-xl flex items-center gap-1.5 text-[13px] font-semibold shrink-0 transition-all ${
              input.trim() && !loading
                ? 'glossy-btn text-white'
                : 'bg-surface-raised text-content-muted cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
