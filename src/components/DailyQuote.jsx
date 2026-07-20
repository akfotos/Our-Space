import { Quote } from 'lucide-react';

const QUOTES = [
  'Distance means so little when someone means so much.',
  'I carry your heart with me, I carry it in my heart.',
  'In true love, the smallest distance is too great.',
  'Together forever, never apart. Maybe in distance, but never in heart.',
  'The pain of parting is nothing to the joy of meeting again.',
  'Love will travel as far as you let it.',
  'I may not always be there with you, but I will always be there for you.',
  'Home is wherever I am with you.',
  'Absence sharpens love, presence strengthens it.',
  'You are my favorite notification.',
  'Every mile between us is worth it because of you.',
  'I fell in love with the way you touched me without using your hands.',
  'Our time zones keep us apart, but our hearts stay in sync.',
  'Love knows not distance; it hath no continent; its eyes are for the stars.',
  'I exist in two places, here and where you are.',
];

function quoteForToday() {
  const d = new Date();
  const idx = (d.getDate() + d.getMonth() * 31 + d.getFullYear()) % QUOTES.length;
  return QUOTES[idx];
}

function DailyQuote() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-xl transition hover:scale-[1.02]">
      <Quote
        size={48}
        className="absolute -top-2 -right-2 text-rose-200/40 rotate-12"
      />
      <h2 className="text-sm font-bold uppercase tracking-widest text-rose-700/70 mb-3">
        Today&apos;s Love Note
      </h2>
      <p className="text-lg sm:text-xl font-medium text-slate-700 leading-relaxed italic">
        &ldquo;{quoteForToday()}&rdquo;
      </p>
    </section>
  );
}

export default DailyQuote;
