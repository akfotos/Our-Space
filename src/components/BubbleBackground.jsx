import { useMemo } from 'react';

function BubbleBackground() {
  const bubbles = useMemo(
    () => [
      { size: 40, left: 5, duration: 14, delay: 0, color: 'bg-rose-300' },
      { size: 24, left: 15, duration: 18, delay: 2, color: 'bg-rose-400' },
      { size: 56, left: 25, duration: 16, delay: 4, color: 'bg-rose-200' },
      { size: 32, left: 40, duration: 20, delay: 1, color: 'bg-rose-300' },
      { size: 48, left: 55, duration: 15, delay: 3, color: 'bg-rose-400' },
      { size: 20, left: 65, duration: 22, delay: 5, color: 'bg-rose-200' },
      { size: 64, left: 75, duration: 17, delay: 2, color: 'bg-rose-300' },
      { size: 28, left: 85, duration: 19, delay: 6, color: 'bg-rose-400' },
      { size: 36, left: 95, duration: 13, delay: 4, color: 'bg-rose-200' },
    ],
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`absolute top-full rounded-full ${b.color} opacity-40 blur-xl`}
          style={{
            width: b.size,
            height: b.size,
            left: `${b.left}%`,
            animation: `bubble ${b.duration}s linear ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default BubbleBackground;
