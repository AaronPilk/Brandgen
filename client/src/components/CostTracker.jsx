import { useStore } from '../store/useStore';

export default function CostTracker() {
  const { totalSpent, dailyLimit, budgetSet } = useStore();

  if (!budgetSet) return null;

  const pct = dailyLimit > 0 ? (totalSpent / dailyLimit) * 100 : 0;
  const isWarning = pct > 80;

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-brand-dark-card border border-brand-dark-border text-sm">
      <div className="flex flex-col items-end">
        <span className={`font-mono font-semibold ${isWarning ? 'text-orange-400' : 'text-brand-purple-light'}`}>
          ${totalSpent.toFixed(3)}
        </span>
        <span className="text-[10px] text-gray-500">of ${dailyLimit} limit</span>
      </div>
      <div className="w-16 h-1.5 bg-brand-dark-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isWarning ? 'bg-orange-400' : 'bg-brand-purple'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
