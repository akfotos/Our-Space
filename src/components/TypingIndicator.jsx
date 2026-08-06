function TypingIndicator({ typing }) {
  const names = Object.values(typing)
    .map((t) => t.name)
    .filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="flex items-center gap-2 pl-1">
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-soft" />
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-soft [animation-delay:0.2s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse-soft [animation-delay:0.4s]" />
      </div>
      <span className="text-xs text-slate-500 italic">
        {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing
      </span>
    </div>
  );
}

export default TypingIndicator;
