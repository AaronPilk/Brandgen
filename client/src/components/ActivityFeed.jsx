import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Megaphone, Mail, MessageSquare, Palette, Image,
  Share2, Target, Link, Unlink, Plus, Edit3, TrendingUp, Zap,
  Check, X, Info, ChevronDown, Clock,
} from 'lucide-react';
import { getActivityFeed } from '../services/api';

const ICON_MAP = {
  search: Search,
  globe: Globe,
  megaphone: Megaphone,
  mail: Mail,
  message: MessageSquare,
  palette: Palette,
  image: Image,
  share: Share2,
  target: Target,
  link: Link,
  unlink: Unlink,
  plus: Plus,
  edit: Edit3,
  trending: TrendingUp,
  zap: Zap,
  check: Check,
  x: X,
  info: Info,
};

const COLOR_MAP = {
  purple: 'bg-brand-purple/10 text-brand-purple',
  blue: 'bg-blue-500/10 text-blue-500',
  green: 'bg-green-500/10 text-green-500',
  red: 'bg-red-500/10 text-red-500',
  orange: 'bg-orange-500/10 text-orange-500',
  yellow: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  pink: 'bg-pink-500/10 text-pink-500',
  cyan: 'bg-cyan-500/10 text-cyan-500',
  violet: 'bg-violet-500/10 text-violet-500',
  gray: 'bg-surface-raised text-content-muted',
};

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ActivityFeed({ profileId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    getActivityFeed(profileId, 20)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      getActivityFeed(profileId, 20).then(setEvents).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [profileId]);

  if (loading || events.length === 0) return null;

  const displayEvents = expanded ? events : events.slice(0, 5);

  return (
    <div className="mt-8 mb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-purple" />
          <h2 className="text-lg font-semibold text-content-primary">Activity</h2>
          <span className="text-[11px] font-medium text-content-muted bg-surface-raised px-2 py-0.5 rounded-full">
            {events.length} events
          </span>
        </div>
      </div>

      <div className="glossy rounded-2xl overflow-hidden">
        <div className="relative z-10">
          {/* Timeline */}
          <div className="divide-y divide-surface-border">
            <AnimatePresence>
              {displayEvents.map((event, i) => {
                const Icon = ICON_MAP[event.typeConfig?.icon] || Info;
                const colorClass = COLOR_MAP[event.typeConfig?.color] || COLOR_MAP.gray;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 p-4 hover:bg-surface-raised/50 transition-colors"
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-content-primary">
                        {event.typeConfig?.label || event.type}
                      </p>
                      {event.data?.industry && (
                        <p className="text-[12px] text-content-muted mt-0.5">{event.data.industry}</p>
                      )}
                      {event.data?.platform && (
                        <p className="text-[12px] text-content-muted mt-0.5">{event.data.platform}</p>
                      )}
                      {event.data?.cost && (
                        <p className="text-[11px] text-content-muted mt-0.5">Cost: ${event.data.cost.toFixed(4)}</p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-[11px] text-content-muted shrink-0">
                      {timeAgo(event.timestamp)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Show more */}
          {events.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 text-[12px] font-medium text-brand-purple hover:bg-brand-purple/5 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {expanded ? 'Show less' : `Show ${events.length - 5} more`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
