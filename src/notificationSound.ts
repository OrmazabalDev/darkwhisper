// Generar sonido de notificación usando Web Audio API
export function playNotificationSound(volume: number = 0.5) {
  try {
    console.log('🔊 Reproduciendo sonido de notificación - Volumen:', volume);
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar sonido cyber (dos tonos rápidos)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

    // Volumen con fade out
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    console.log('✅ Sonido reproducido correctamente');
  } catch (error) {
    console.error('❌ Error reproduciendo sonido de notificación:', error);
  }
}
