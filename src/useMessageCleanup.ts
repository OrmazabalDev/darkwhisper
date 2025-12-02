import { useEffect, useState } from 'react';
import { ref, remove, set, get, onValue } from 'firebase/database';
import { db } from './firebase';

export function useMessageCleanup(enabled: boolean = true) {
  const [nextCleanupTime, setNextCleanupTime] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const cleanupTimerRef = ref(db, 'cleanup_timer');
    
    const initializeTimer = async () => {
      try {
        const snapshot = await get(cleanupTimerRef);
        const now = Date.now();
        
        if (!snapshot.exists() || snapshot.val() < now) {
          // Inicializar o reiniciar el timer
          const newCleanupTime = now + 120000;
          await set(cleanupTimerRef, newCleanupTime);
          setNextCleanupTime(newCleanupTime);
        } else {
          setNextCleanupTime(snapshot.val());
        }
      } catch {}
    };

    // Escuchar cambios en el timer
    const unsubscribe = onValue(cleanupTimerRef, (snapshot) => {
      if (snapshot.exists()) {
        setNextCleanupTime(snapshot.val());
      }
    });

    initializeTimer();

    return () => unsubscribe();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !nextCleanupTime) return;

    const checkAndCleanup = async () => {
      const now = Date.now();
      const timeRemaining = nextCleanupTime - now;

      if (timeRemaining <= 0) {
        try {
          // Eliminar mensajes de la base de datos (archivos incluidos en Base64)
          const messagesRef = ref(db, 'messages');
          await remove(messagesRef);
          
          // Establecer próximo tiempo de limpieza
          const newCleanupTime = Date.now() + 120000;
          await set(ref(db, 'cleanup_timer'), newCleanupTime);
        } catch {}
      }
    };

    const intervalId = setInterval(checkAndCleanup, 1000);
    return () => clearInterval(intervalId);
  }, [enabled, nextCleanupTime]);

  return nextCleanupTime;
}
