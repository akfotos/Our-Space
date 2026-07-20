import { useEffect, useRef, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const SYNC_THRESHOLD = 2;

let apiReadyPromise = null;
function getYouTubeAPI() {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
  });
  return apiReadyPromise;
}

function extractVideoId(input) {
  if (!input) return '';
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).slice(0, 11);
    if (url.hostname.includes('youtube.com')) {
      const params = url.searchParams;
      const v = params.get('v');
      if (v) return v.slice(0, 11);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'v') return parts[1]?.slice(0, 11);
    }
  } catch {
    // not a URL
  }
  return '';
}

export function usePlayerSync(containerId) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [videoId, setVideoId] = useState('');
  const playerRef = useRef(null);
  const videoIdRef = useRef('');
  const localUpdateRef = useRef(false);
  const syncGuardRef = useRef(false);
  const userRef = useRef(user);
  const stateRef = useRef(ref(rtdb, 'playerState'));

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let mounted = true;
    getYouTubeAPI().then((YT) => {
      if (!mounted) return;
      playerRef.current = new YT.Player(containerId, {
        width: '100%',
        height: '100%',
        videoId: '',
        playerVars: { rel: 0, enablejsapi: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (event) => {
            if (syncGuardRef.current || !playerRef.current) return;
            const state = event.data;
            if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.PAUSED) {
              return;
            }
            localUpdateRef.current = true;
            set(stateRef.current, {
              type: 'youtube',
              videoId: videoIdRef.current,
              status: state === YT.PlayerState.PLAYING ? 'playing' : 'paused',
              currentTime: playerRef.current.getCurrentTime() || 0,
              updatedBy: userRef.current?.uid || '',
              updatedAt: serverTimestamp(),
            }).then(() => {
              localUpdateRef.current = false;
            });
          },
        },
      });
    });
    return () => {
      mounted = false;
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [containerId]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;
    const unsub = onValue(stateRef.current, (snap) => {
      if (!snap.exists() || localUpdateRef.current) return;
      const data = snap.val();
      if (data.type && data.type !== 'youtube') return;
      const player = playerRef.current;
      const YT = window.YT;
      syncGuardRef.current = true;
      if (data.videoId && data.videoId !== videoIdRef.current) {
        videoIdRef.current = data.videoId;
        setVideoId(data.videoId);
        player.cueVideoById(data.videoId);
      }
      if (data.videoId) {
        const localTime = player.getCurrentTime() || 0;
        if (Math.abs(localTime - (data.currentTime || 0)) > SYNC_THRESHOLD) {
          player.seekTo(data.currentTime || 0, true);
        }
        const pState = player.getPlayerState();
        if (data.status === 'playing' && pState !== YT.PlayerState.PLAYING) {
          player.playVideo();
        }
        if (data.status === 'paused' && pState === YT.PlayerState.PLAYING) {
          player.pauseVideo();
        }
      }
      setTimeout(() => {
        syncGuardRef.current = false;
      }, 400);
    });
    return unsub;
  }, [ready]);

  const loadVideo = (input) => {
    const id = extractVideoId(input);
    if (!id || !playerRef.current) return;
    videoIdRef.current = id;
    setVideoId(id);
    const player = playerRef.current;
    player.cueVideoById(id);
    player.pauseVideo();
    localUpdateRef.current = true;
    set(stateRef.current, {
      type: 'youtube',
      videoId: id,
      status: 'paused',
      currentTime: 0,
      updatedBy: userRef.current?.uid || '',
      updatedAt: serverTimestamp(),
    }).then(() => {
      localUpdateRef.current = false;
    });
  };

  return { ready, videoId, loadVideo };
}
