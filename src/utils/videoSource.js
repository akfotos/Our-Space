function getHost() {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}

export function parseVideoSource(input) {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  const lower = s.toLowerCase();

  // YouTube
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
      if (parts[1] && lower.startsWith('https://www.youtube.com/shorts/')) {
        return { type: 'youtube', id: parts[1]?.slice(0, 11) };
      }
    }
  } catch {
    // not a URL; maybe a raw id
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) {
    return { type: 'youtube', id: s };
  }

  // Direct video files
  const directExt = /\.(mp4|webm|ogg|m4v|mov|mkv|flv|wmv|avi)(?:\?.*)?$/i;
  if (directExt.test(s)) {
    return { type: 'direct', url: s };
  }

  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'vimeo.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = parts[0];
      if (id) return { type: 'embed', url: `https://player.vimeo.com/video/${id}` };
    }
    if (host === 'player.vimeo.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'video' && parts[1]) {
        return { type: 'embed', url: `https://player.vimeo.com/video/${parts[1]}` };
      }
    }

    if (host === 'dailymotion.com' || host === 'dai.ly') {
      let id = '';
      if (host === 'dai.ly') {
        id = url.pathname.split('/').filter(Boolean)[0];
      } else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[1]) id = parts[1];
      }
      if (id) return { type: 'embed', url: `https://www.dailymotion.com/embed/video/${id}` };
    }

    if (host === 'twitch.tv' || host === 'clips.twitch.tv') {
      const parent = getHost();
      if (host === 'clips.twitch.tv') {
        const clip = url.pathname.split('/').filter(Boolean)[0];
        return { type: 'embed', url: `https://player.twitch.tv/?clip=${clip}&parent=${parent}` };
      }
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'videos' && parts[1]) {
        return { type: 'embed', url: `https://player.twitch.tv/?video=${parts[1]}&parent=${parent}&autoplay=false` };
      }
      if (parts[1] === 'clip' && parts[2]) {
        return { type: 'embed', url: `https://player.twitch.tv/?clip=${parts[2]}&parent=${parent}` };
      }
      const channel = parts[0];
      if (channel) {
        return { type: 'embed', url: `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=false` };
      }
    }

    if (host === 'soundcloud.com') {
      return { type: 'embed', url: `https://w.soundcloud.com/player/?url=${encodeURIComponent(s)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true` };
    }

    if (host === 'open.spotify.com') {
      const path = url.pathname.replace(/^\//, '');
      if (path) return { type: 'embed', url: `https://open.spotify.com/embed/${path}` };
    }

    if (host === 'drive.google.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const idIndex = parts.indexOf('d') + 1;
      if (parts[idIndex - 1] === 'd' && parts[idIndex]) {
        return { type: 'embed', url: `https://drive.google.com/file/d/${parts[idIndex]}/preview` };
      }
    }

    if (host === 'netflix.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = parts.find((p) => /^\d+$/.test(p));
      return { type: 'netflix', url: `https://www.netflix.com/watch/${id || ''}`, titleId: id };
    }

    if (host === 'primevideo.com' || host === 'amazon.com' || host === 'amazon.co.uk' || host === 'amazon.de') {
      const asinMatch = url.pathname.match(/\/(?:gp\/video\/detail|dp)\/([A-Z0-9]{10})/) || url.searchParams.get('asin');
      const asin = asinMatch?.[1] || asinMatch;
      if (asin) {
        return { type: 'prime', url: `https://www.primevideo.com/detail/${asin}`, asin };
      }
    }

    if (host === 'disneyplus.com') {
      return { type: 'disney', url: s };
    }

    // Generic embed attempt
    if (s.startsWith('http')) {
      return { type: 'embed', url: s };
    }
  } catch {
    // Not a valid URL and not a raw YouTube id
  }

  return null;
}
