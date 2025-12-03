import { useEffect, useState } from 'react';
import { ref, set, onDisconnect } from 'firebase/database';
import { db } from '../firebase';
import { generateEphemeralId, getStorageItem, setStorageItem } from '../utils';

function getSessionId(): string {
  let sessionId = getStorageItem('ephemeral_session_id');
  
  if (!sessionId) {
    sessionId = generateEphemeralId();
    setStorageItem('ephemeral_session_id', sessionId);
  }
  
  return sessionId;
}

interface UseAnonymousAuthReturn {
  sessionId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
}

export function useAnonymousAuth(): UseAnonymousAuthReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingSessionId = getStorageItem('ephemeral_session_id');
    const existingNickname = getStorageItem('chatNickname')?.toLowerCase(); // Normalizar a minúsculas
    
    if (existingSessionId && existingNickname) {
      // Restaurar sesión desde localStorage y recrear en Firebase
      const sessionRef = ref(db, `anonymous_sessions/${existingSessionId}`);
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${existingNickname}`);
      
      Promise.all([
        set(sessionRef, {
          nickname: existingNickname,
          active: true,
          created: Date.now(),
        }),
        set(nicknameIndexRef, existingSessionId)
      ]).then(() => {
        onDisconnect(sessionRef).remove();
        onDisconnect(nicknameIndexRef).remove();
        setSessionId(existingSessionId);
        setIsAuthenticated(true);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const authenticate = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newSessionId = getSessionId();
      const nickname = (getStorageItem('chatNickname') || '').toLowerCase(); // Normalizar a minúsculas
      const sessionRef = ref(db, `anonymous_sessions/${newSessionId}`);
      const nicknameIndexRef = ref(db, `user_sessions_by_nickname/${nickname}`);
      
      await Promise.all([
        set(sessionRef, {
          nickname,
          active: true,
          created: Date.now(),
        }),
        set(nicknameIndexRef, newSessionId)
      ]);
      
      await onDisconnect(sessionRef).remove();
      await onDisconnect(nicknameIndexRef).remove();
      
      setSessionId(newSessionId);
      setIsAuthenticated(true);
    } catch (err) {
      const errorMsg = 'Authentication failed. Try again.';
      setError(errorMsg);
      console.error('Anonymous auth error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionId,
    isAuthenticated,
    loading,
    error,
    authenticate
  };
}
