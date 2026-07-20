import { useEffect, useRef } from 'react';
import { ref, onValue, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';

const SYNC_THRESHOLD = 2;

function DirectVideoSync({ url }) {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const localUpdateRef = useRef(false);
  const syncGuardRef = useRef(false);
  const urlRef = useRef(url);
  const stateRef = useRef(ref(rtdb, 'playerState'));

  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      if (syncGuardRef.current) return;
      localUpdateRef.current = true;
      set(stateRef.current, {
        type: 'direct',
        url: urlRef.current,
        status: 'playing',
        currentTime: video.currentTime || 0,
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      }).then(() => {
        localUpdateRef.current = false;
      });
    };

    const handlePause = () => {
      if (syncGuardRef.current) return;
      localUpdateRef.current = true;
      set(stateRef.current, {
        type: 'direct',
        url: urlRef.current,
        status: 'paused',
        currentTime: video.currentTime || 0,
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      }).then(() => {
        localUpdateRef.current = false;
      });
    };

    const handleSeeked = () => {
      if (syncGuardRef.current) return;
      localUpdateRef.current = true;
      set(stateRef.current, {
        type: 'direct',
        url: urlRef.current,
        status: video.paused ? 'paused' : 'playing',
        currentTime: video.currentTime || 0,
        updatedBy: user?.uid || '',
        updatedAt: serverTimestamp(),
      }).then(() => {
        localUpdateRef.current = false;
      });
    };

    let timeUpdateTimeout;
    const handleTimeUpdate = () => {
      if (syncGuardRef.current) return;
      if (timeUpdateTimeout) return;
      timeUpdateTimeout = setTimeout(() => {
        timeUpdateTimeout = null;
        localUpdateRef.current = true;
        set(stateRef.current, {
          type: 'direct',
          url: urlRef.current,
          status: video.paused ? 'paused' : 'playing',
          currentTime: video.currentTime || 0,
          updatedBy: user?.uid || '',
          updatedAt: serverTimestamp(),
        }).then(() => {
          localUpdateRef.current = false;
        });
      }, 500);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      clearTimeout(timeUpdateTimeout);
    };
  }, [user]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const unsub = onValue(stateRef.current, (snap) => {
      if (!snap.exists() || localUpdateRef.current) return;
      const data = snap.val();
      if (data.type !== 'direct') return;
      if (data.url !== urlRef.current) return;

      syncGuardRef.current = true;
      if (Math.abs(video.currentTime - (data.currentTime || 0)) > SYNC_THRESHOLD) {
        video.currentTime = data.currentTime || 0;
      }
      if (data.status === 'playing' && video.paused) {
        video.play().catch(() => {});
      }
      if (data.status === 'paused' && !video.paused) {
        video.pause();
      }
      setTimeout(() => {
        syncGuardRef.current = false;
      }, 400);
    });
    return unsub;
  }, [url]);

  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="w-full h-full bg-black"
      playsInline
    />
  );
}

export default DirectVideoSync;
