import { useState } from 'react';
import { isValidNickname } from './utils';
import { Terminal, Shield, Zap } from 'lucide-react';

interface WelcomeScreenProps {
  onJoinChat: (nickname: string) => Promise<void>;
  loading: boolean;
}

const WelcomeScreen = ({ onJoinChat, loading }: WelcomeScreenProps) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    
    if (trimmed && !isValidNickname(trimmed)) {
      setError('Nickname: 1-20 characters (letters, numbers, spaces, - or _)');
      return;
    }

    setError('');
    onJoinChat(trimmed).catch(() => setError('Failed to join'));
  };

  return (
    <div className="welcome-screen">
      {/* Efecto de líneas de escaneo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scan-line" style={{ top: 0, background: 'oklch(0.75 0.2 145 / 0.2)' }} />
        <div className="scan-line" style={{ top: '33.333%', background: 'oklch(0.75 0.2 145 / 0.2)', animationDelay: '1s' }} />
        <div className="scan-line" style={{ top: '66.666%', background: 'oklch(0.75 0.2 145 / 0.2)', animationDelay: '2s' }} />
      </div>

      <div className="welcome-card">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <Terminal className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
          </div>
          <h1 className="welcome-title glitch-text" style={{ fontSize: '2.5rem' }}>DarkWhisper</h1>
        </div>
        <p className="welcome-subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {'>'} Encrypted · Anonymous · Ephemeral
        </p>
        
        <div className="info-box" role="list" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <p role="listitem" className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--primary)' }} /> 
            <span>{'>'} No registration required</span>
          </p>
          <p role="listitem" className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
            <Terminal className="w-5 h-5" style={{ color: 'var(--secondary)' }} /> 
            <span>{'>'} Completely anonymous</span>
          </p>
          <p role="listitem" className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: 'var(--primary)' }} /> 
            <span>{'>'} Real-time encrypted messaging</span>
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="nickname-form" noValidate>
          <div className="form-group">
            <label htmlFor="nickname" style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
              {'>'} Choose a nickname (optional)
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="Leave empty for random ID..."
              maxLength={20}
              disabled={loading}
              className="nickname-input"
              autoComplete="off"
              autoFocus
            />
            {error && <span className="error-message" role="alert" style={{ color: 'var(--destructive)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>{error}</span>}
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="join-button"
            style={{
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 0 20px var(--primary)',
              opacity: 0.6
            }}
          >
            {loading ? '⟳ CONNECTING...' : '⚡ JOIN CHAT'}
          </button>
        </form>

        <div className="text-center text-xs font-mono" style={{ marginTop: '2rem', color: 'var(--muted-foreground)' }}>
          <p>{'>'} WARNING: This is an anonymous chat platform</p>
          <p style={{ marginTop: '0.25rem' }}>{'>'} Enter at your own risk · E2E Encryption enabled</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
