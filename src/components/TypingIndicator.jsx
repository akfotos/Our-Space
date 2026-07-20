function TypingIndicator({ typing }) {
  const names = Object.values(typing)
    .map((t) => t.name)
    .filter(Boolean);
  if (!names.length) return null;
  return (
    <div className={'text-xs text-slate-500 italic pl-1'}>
      {names.join(', ')} {names.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
}

export default TypingIndicator;
