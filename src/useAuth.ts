import { generateAnonymousId, setStorageItem, getStorageItem } from './utils';
import { useAnonymousAuth } from './useAnonymousAuth';

interface UseAuthReturn {
  user: { uid: string } | null;
  loading: boolean;
  error: string | null;
  signInAnonymous: (nickname?: string) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { sessionId, isAuthenticated, loading, error, authenticate } = useAnonymousAuth();

  const user = isAuthenticated && sessionId ? { uid: sessionId } : null;

  const signInAnonymous = async (nickname?: string): Promise<void> => {
    const displayName = nickname?.trim() || generateAnonymousId();
    setStorageItem('chatNickname', displayName);
    await authenticate();
  };

  return { user, loading, error, signInAnonymous };
}

export function getUserNickname(): string {
  const stored = getStorageItem('chatNickname');
  if (stored) return stored;
  
  const generated = generateAnonymousId();
  setStorageItem('chatNickname', generated);
  return generated;
}
