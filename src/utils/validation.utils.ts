/**
 * Validation utilities
 * Pure functions with no external dependencies
 */

export function isValidNickname(nickname: string): boolean {
  return /^[a-zA-Z0-9\s_-]{1,20}$/.test(nickname.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateAnonymousId(sessionId?: string): string {
  if (sessionId) {
    // Usar los primeros 6 caracteres del sessionId para garantizar unicidad
    return `User-${sessionId.substring(0, 6)}`;
  }
  // Fallback: generar con timestamp + random para mayor unicidad
  const timestamp = Date.now().toString(36).slice(-4);
  const random = Math.floor(Math.random() * 9999).toString(36);
  return `User-${timestamp}${random}`;
}

export function generateEphemeralId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica si un nickname está disponible (no en uso por otro usuario)
 * @param nickname - El nickname a verificar
 * @param currentSessionId - El sessionId del usuario actual (para excluirse a sí mismo)
 * @param nicknameIndex - El objeto con el mapeo nickname->sessionId de Firebase
 * @returns true si está disponible, false si ya está en uso
 */
export function isNicknameAvailable(
  nickname: string,
  currentSessionId: string,
  nicknameIndex: Record<string, string>
): boolean {
  const existingSessionId = nicknameIndex[nickname];
  
  // Si no existe en el índice, está disponible
  if (!existingSessionId) return true;
  
  // Si existe pero es del mismo usuario, está disponible
  if (existingSessionId === currentSessionId) return true;
  
  // Si existe y es de otro usuario, NO está disponible
  return false;
}
