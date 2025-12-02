import { useState, useEffect, useCallback } from 'react';
import { 
  initializeEncryptionKeyFromRoom, 
  isEncryptionEnabled,
  setEncryptionEnabled 
} from './utils';

interface UseEncryptionReturn {
  encryptionKey: CryptoKey | null;
  loading: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const PUBLIC_ROOM_PASSPHRASE = 'whisperchat-public-room-2024-v1';

export function useEncryption(): UseEncryptionReturn {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(isEncryptionEnabled());

  useEffect(() => {
    if (!enabled) {
      setEncryptionKey(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    initializeEncryptionKeyFromRoom(PUBLIC_ROOM_PASSPHRASE)
      .then(key => {
        if (mounted) setEncryptionKey(key);
      })
      .catch(() => {
        if (mounted) setEncryptionKey(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [enabled]);

  const handleSetEnabled = useCallback((newEnabled: boolean) => {
    setEnabled(newEnabled);
    setEncryptionEnabled(newEnabled);
  }, []);

  return { 
    encryptionKey, 
    loading, 
    enabled,
    setEnabled: handleSetEnabled 
  };
}
