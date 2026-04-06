import { useStore } from '../store/useStore';

export default function CostTracker() {
  const { totalSpent, dailyLimit, budgetSet } = useStore();

  if (!budgetSet) return null;

  const pct = dailyLimit > 0 ? (totalSpent / dailyLimit) * 100 : 0;
  const isWarning = pct > 80;

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass border border-surface-border mr-1">
      <div className="flex flex-col items-end">
        <span className={`text-xs font-mono font-semibold tracking-tight ${isWarning ? 'text-orange-500' : 'text-brand-purple'}`}>
          ${totalSpent.toFixed(3)}
        </span>
        <span className="text-[9px] text-content-muted leading-tight">of ${dailyLimit}</span>
      </div>
      <div className="w-12 h-1 bg-surface-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isWarning ? 'bg-orange-500' : 'bg-brand-purple'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
