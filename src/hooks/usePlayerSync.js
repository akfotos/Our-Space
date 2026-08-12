import { useEffect, useRef, useState } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';

const SYNC_THRESHOLD = 2;
// Minimum content length (seconds) before we trust a duration reading as the
// "real" video rather than a short pre/mid-roll ad.
const MIN_CONTENT_DURATION = 90;
// If the reported duration drops below this fraction of the known content
// duration, we assume an ad is playing.
const AD_DURATION_RATIO = 0.5;

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
  const { coupleId } = useCouple();
  const [ready, setReady] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [adLikely, setAdLikely] = useState(false);
  const playerRef = useRef(null);
  const videoIdRef = useRef('');
  const localUpdateRef = useRef(false);
  const syncGuardRef = useRef(false);
  const userRef = useRef(user);
  const stateRef = useRef(ref(rtdb, 'playerState'));
  const contentDurationRef = useRef(0);
  const adLikelyRef = useRef(false);

  // No official YouTube IFrame API event exists for ad playback, so this is
  // a best-effort heuristic: ads report a much shorter duration than the
  // actual video, so a sudden drop is a reliable-enough signal to surface a
  // small "ad playing" indicator in the UI.
  const checkForAd = () => {
    const player = playerRef.current;
    if (!player || typeof player.getDuration !== 'function') return;
    const duration = player.getDuration() || 0;
    if (duration >= MIN_CONTENT_DURATION) {
      contentDurationRef.current = duration;
      if (adLikelyRef.current) {
        adLikelyRef.current = false;
        setAdLikely(false);
      }
      return;
    }
    const isAd =
      duration > 0 &&
      contentDurationRef.current >= MIN_CONTENT_DURATION &&
      duration < contentDurationRef.current * AD_DURATION_RATIO;
    if (isAd !== adLikelyRef.current) {
      adLikelyRef.current = isAd;
      setAdLikely(isAd);
    }
  };

  const resetAdDetection = () => {
    contentDurationRef.current = 0;
    if (adLikelyRef.current) {
      adLikelyRef.current = false;
      setAdLikely(false);
    }
  };

  useEffect(() => {
    stateRef.current = coupleId ? ref(rtdb, `playerState/${coupleId}`) : ref(rtdb, 'playerState');
  }, [coupleId]);

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
        playerVars: {
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: () => setReady(true),
          onError: (event) => {
            const messages = {
              2: 'Invalid video link.',
              5: 'This video cannot be played in this embedded player.',
              100: 'This video was not found or has been removed.',
              101: 'The video owner does not allow embedding.',
              150: 'The video owner does not allow embedding.',
            };
            setPlayerError(messages[event.data] || 'This video could not be played here.');
          },
          onStateChange: (event) => {
            checkForAd();
            if (syncGuardRef.current || !playerRef.current) return;
            const state = event.data;
            if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED) {
              setPlayerError('');
            }
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

  // Safety net: some ad transitions don't reliably trigger onStateChange,
  // so poll the reported duration too.
  useEffect(() => {
    if (!ready) return;
    const interval = setInterval(checkForAd, 2000);
    return () => clearInterval(interval);
  }, [ready]);

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
        setPlayerError('');
        resetAdDetection();
        if (data.status === 'playing') {
          player.loadVideoById(data.videoId, data.currentTime || 0);
        } else {
          player.cueVideoById(data.videoId, data.currentTime || 0);
        }
      } else if (data.videoId) {
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
  }, [ready, coupleId]);

  const loadVideo = (input) => {
    const id = extractVideoId(input);
    if (!id || !playerRef.current) return;
    videoIdRef.current = id;
    setVideoId(id);
    resetAdDetection();
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

  return { ready, videoId, loadVideo, playerError, adLikely };
}
