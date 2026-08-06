function formatLastSeen(ts) {
  if (!ts) return 'unknown';
  const date = typeof ts === 'number' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffMin < 1) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function OnlineStatus({ online, lastSeen, name, showName = true }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          online ? 'bg-green-500 animate-pulse' : 'bg-slate-400'
        }`}
      />
      <span className="text-slate-700 font-medium">
        {showName && name ? `${name} · ` : ''}
        {online ? 'Online' : `Last seen ${formatLastSeen(lastSeen)}`}
      </span>
    </div>
  );
}

export default OnlineStatus;
