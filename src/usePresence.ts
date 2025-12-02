import { useEffect, useState, useRef } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { db } from './firebase';

interface UsePresenceReturn {
  onlineCount: number;
  loading: boolean;
}

// Debouncing para reducir actualizaciones de presencia
const PRESENCE_UPDATE_INTERVAL = 30000; // 30 segundos

export function usePresence(sessionId: string | null): UsePresenceReturn {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const lastUpdateRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const sessionPresenceRef = ref(db, `presence/${sessionId}`);
    const allPresenceRef = ref(db, 'presence');

    const updatePresence = async () => {
      const now = Date.now();
      
      // Debouncing: solo actualizar si han pasado más de 30s desde la última actualización
      if (now - lastUpdateRef.current < PRESENCE_UPDATE_INTERVAL) {
        return;
      }
      
      lastUpdateRef.current = now;
      
      try {
        await set(sessionPresenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
        });
      } catch {}
    };

    const setupPresence = async () => {
      try {
        await updatePresence();
        await onDisconnect(sessionPresenceRef).remove();
        setLoading(false);

        // Heartbeat periódico para mantener presencia (cada 30s)
        heartbeatIntervalRef.current = setInterval(updatePresence, PRESENCE_UPDATE_INTERVAL);
      } catch {
        setLoading(false);
      }
    };

    setupPresence();

    // Optimización: procesar solo cuando cambian los datos
    let previousCount = 0;
    const unsubscribe = onValue(
      allPresenceRef,
      (snapshot) => {
        const presences = snapshot.val();
        const count = presences 
          ? Object.values(presences).filter((presence: any) => presence?.online === true).length
          : 0;
        
        // Solo actualizar estado si el conteo cambió
        if (count !== previousCount) {
          previousCount = count;
          setOnlineCount(count);
        }
      }
    );

    return () => {
      unsubscribe();
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      set(sessionPresenceRef, null).catch(() => {});
    };
  }, [sessionId]);

  return { onlineCount, loading };
}
