import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, DollarSign, TrendingUp, Clock, Zap, Edit3,
  Check, X, BarChart3, Coins, Calendar, Activity,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useStore } from '../store/useStore';
import { getBudget, updateBudget, getTransactions, getAllTransactions } from '../services/api';

export default function Usage() {
  const navigate = useNavigate();
  const { sessionId, user, totalSpent, dailyLimit, setBudget: setStoreBudget } = useStore();
  const [budget, setBudgetData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editDaily, setEditDaily] = useState('');
  const [editMonthly, setEditMonthly] = useState('');
  const [loading, setLoading] = useState(true);

  const userId = sessionId || 'default';

  const loadData = async () => {
    try {
      const [b, t] = await Promise.all([
        getBudget(userId),
        user?.role === 'admin' ? getAllTransactions(100) : getTransactions(userId, 100),
      ]);
      setBudgetData(b);
      setTransactions(t);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveBudget = async () => {
    const daily = parseFloat(editDaily);
    const monthly = parseFloat(editMonthly);
    if (isNaN(daily) || isNaN(monthly)) return;
    await updateBudget(userId, { dailyLimit: daily, monthlyLimit: monthly });
    setStoreBudget(daily);
    setEditing(false);
    loadData();
  };

  const startEdit = () => {
    setEditDaily(budget?.dailyLimit?.toString() || '10');
    setEditMonthly(budget?.monthlyLimit?.toString() || '300');
    setEditing(true);
  };

  // Build chart data from transactions
  const chartData = (() => {
    const days = {};
    transactions.forEach((t) => {
      const day = new Date(t.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!days[day]) days[day] = { day, cost: 0, count: 0 };
      days[day].cost += t.amount;
      days[day].count++;
    });
    return Object.values(days).reverse().slice(-14);
  })();

  // Group by action
  const byAction = (() => {
    const map = {};
    transactions.forEach((t) => {
      const a = t.action || 'unknown';
      if (!map[a]) map[a] = { action: a, cost: 0, count: 0, tokens: 0 };
      map[a].cost += t.amount;
      map[a].count++;
      map[a].tokens += (t.inputTokens || 0) + (t.outputTokens || 0);
    });
    return Object.values(map).sort((a, b) => b.cost - a.cost);
  })();

  if (loading) return <div className="text-center py-20 text-content-muted">Loading...</div>;

  const dailyPct = budget ? (budget.todaySpent / budget.dailyLimit) * 100 : 0;
  const monthPct = budget ? (budget.monthSpent / budget.monthlyLimit) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-content-muted hover:text-content-primary mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Coins className="w-6 h-6 text-brand-purple" />
          <h1 className="text-title">Token Usage & Budget</h1>
        </div>
        {!editing && (
          <button onClick={startEdit} className="px-4 py-2 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-medium flex items-center gap-1.5 hover:text-content-primary transition-colors">
            <Edit3 className="w-3.5 h-3.5" /> Edit Limits
          </button>
        )}
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <BudgetCard
          icon={DollarSign}
          label="Today's Spend"
          value={`$${(budget?.todaySpent || 0).toFixed(4)}`}
          sub={`of $${budget?.dailyLimit || 0}/day`}
          pct={dailyPct}
          color="text-brand-purple"
          barColor="bg-brand-purple"
        />
        <BudgetCard
          icon={Calendar}
          label="Month Spend"
          value={`$${(budget?.monthSpent || 0).toFixed(4)}`}
          sub={`of $${budget?.monthlyLimit || 0}/mo`}
          pct={monthPct}
          color="text-blue-500"
          barColor="bg-blue-500"
        />
        <BudgetCard
          icon={TrendingUp}
          label="All Time"
          value={`$${(budget?.totalSpent || 0).toFixed(4)}`}
          sub={`${transactions.length} transactions`}
          color="text-green-500"
        />
        <BudgetCard
          icon={Zap}
          label="Total Tokens"
          value={formatNum(transactions.reduce((s, t) => s + (t.inputTokens || 0) + (t.outputTokens || 0), 0))}
          sub="input + output"
          color="text-orange-500"
        />
      </div>

      {/* Edit Budget Modal */}
      {editing && (
        <div className="glossy rounded-2xl p-5 mb-6">
          <div className="relative z-10">
            <h3 className="text-[14px] font-semibold text-content-primary mb-4">Edit Budget Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-content-secondary mb-1">Daily Limit ($)</label>
                <input type="number" value={editDaily} onChange={(e) => setEditDaily(e.target.value)} min="1" step="1" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-content-secondary mb-1">Monthly Limit ($)</label>
                <input type="number" value={editMonthly} onChange={(e) => setEditMonthly(e.target.value)} min="5" step="5" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl bg-surface-raised text-content-secondary text-[13px] font-medium flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleSaveBudget} className="px-4 py-2.5 rounded-xl glossy-btn text-white text-[13px] font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Save Limits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spend Chart */}
      {chartData.length > 0 && (
        <div className="glossy rounded-2xl p-5 mb-6">
          <div className="relative z-10">
            <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-purple" /> Daily Spend
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => [`$${v.toFixed(4)}`, 'Cost']} />
                <Bar dataKey="cost" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cost by Action */}
      {byAction.length > 0 && (
        <div className="glossy rounded-2xl p-5 mb-6">
          <div className="relative z-10">
            <h3 className="text-[14px] font-semibold text-content-primary mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-purple" /> Cost by Action
            </h3>
            <div className="space-y-2">
              {byAction.map((a) => (
                <div key={a.action} className="flex items-center gap-3">
                  <span className="text-[12px] text-content-secondary w-40 truncate capitalize">{a.action.replace(/-/g, ' ')}</span>
                  <div className="flex-1 h-2 bg-surface-border rounded-full overflow-hidden">
                    <div className="h-full bg-brand-purple rounded-full" style={{ width: `${Math.min((a.cost / (byAction[0]?.cost || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-[12px] font-mono text-content-primary w-20 text-right">${a.cost.toFixed(4)}</span>
                  <span className="text-[10px] text-content-muted w-16 text-right">{a.count}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Log */}
      <div className="glossy rounded-2xl overflow-hidden">
        <div className="relative z-10">
          <div className="p-4 border-b border-surface-border">
            <h3 className="text-[14px] font-semibold text-content-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-purple" /> Transaction Log
            </h3>
          </div>
          <div className="divide-y divide-surface-border max-h-[400px] overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="p-6 text-center text-content-muted text-sm">No transactions yet</p>
            ) : transactions.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-surface-raised/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-brand-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content-primary capitalize">{(t.action || '').replace(/-/g, ' ')}</p>
                  <p className="text-[11px] text-content-muted">
                    {t.provider} · {formatNum((t.inputTokens || 0) + (t.outputTokens || 0))} tokens · {timeAgo(t.timestamp)}
                  </p>
                </div>
                <span className="text-[13px] font-mono font-semibold text-brand-purple">${t.amount?.toFixed(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BudgetCard({ icon: Icon, label, value, sub, pct, color, barColor }) {
  return (
    <div className="glossy rounded-2xl p-4">
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-[10px] font-medium text-content-muted uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-content-muted mt-0.5">{sub}</p>
        {pct !== undefined && (
          <div className="w-full h-1.5 bg-surface-border rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor} ${pct > 80 ? 'animate-pulse' : ''}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function formatNum(v) {
  if (!v) return '0';
  return v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString();
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
