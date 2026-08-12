export function parseVideoSource(input) {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  // YouTube (including youtu.be, watch, embed/v, and shorts links, on any
  // YouTube hostname such as www./m./music.)
  try {
    const url = new URL(s);
    if (url.hostname === 'youtu.be') {
      return { type: 'youtube', id: url.pathname.slice(1).slice(0, 11) };
    }
    if (url.hostname.includes('youtube.com')) {
      const params = url.searchParams;
      const v = params.get('v');
      if (v) return { type: 'youtube', id: v.slice(0, 11) };
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'v') {
        return { type: 'youtube', id: parts[1]?.slice(0, 11) };
      }
      if (parts[0] === 'shorts' && parts[1]) {
        return { type: 'youtube', id: parts[1].slice(0, 11) };
      }
    }
  } catch {
    // not a URL; maybe a raw id
  }

  // Raw 11-character YouTube video id
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) {
    return { type: 'youtube', id: s };
  }

  return null;
}
