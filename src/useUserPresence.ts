import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';

interface UseUserPresenceReturn {
  isOnline: boolean;
  lastSeen: number | null;
}

export function useUserPresence(sessionId: string | null): UseUserPresenceReturn {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setIsOnline(false);
      setLastSeen(null);
      return;
    }

    const sessionPresenceRef = ref(db, `presence/${sessionId}`);

    const unsubscribe = onValue(
      sessionPresenceRef,
      (snapshot) => {
        const presence = snapshot.val();
        if (presence) {
          setIsOnline(presence.online === true);
          setLastSeen(presence.lastSeen || null);
        } else {
          setIsOnline(false);
          setLastSeen(null);
        }
      },
      () => setIsOnline(false)
    );

    return () => unsubscribe();
  }, [sessionId]);

  return { isOnline, lastSeen };
}
