import { Paperclip, X, Image, FileText } from 'lucide-react';
import { useRef, useState } from 'react';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
  onClearFile?: () => void;
}

export default function FileUploadButton({ 
  onFileSelect, 
  disabled, 
  selectedFile,
  onClearFile 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && !disabled) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Paperclip className="w-4 h-4" />;
    if (selectedFile.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*,.pdf,.txt"
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid var(--primary)',
          borderRadius: '0.5rem',
          maxWidth: '200px',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <div style={{ color: 'var(--primary)' }}>
            {getFileIcon()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ 
              margin: 0,
              fontSize: '0.75rem', 
              color: 'var(--foreground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace'
            }}>
              {selectedFile.name}
            </p>
            <p style={{ 
              margin: 0,
              fontSize: '0.625rem', 
              color: 'var(--muted-foreground)',
              fontFamily: 'monospace'
            }}>
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <button
            onClick={onClearFile}
            style={{
              padding: '0.25rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            type="button"
            title="Quitar archivo"
          >
            <X style={{ width: '1rem', height: '1rem', color: 'var(--destructive)' }} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            padding: '0.5rem',
            background: dragOver 
              ? 'rgba(6, 182, 212, 0.2)' 
              : isHovered && !disabled
                ? 'rgba(6, 182, 212, 0.15)'
                : 'var(--card)',
            border: dragOver 
              ? '2px solid var(--primary)' 
              : '1px solid var(--border)',
            borderRadius: '0.5rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isHovered && !disabled ? 'scale(1.05)' : 'scale(1)',
            boxShadow: dragOver 
              ? '0 0 20px rgba(6, 182, 212, 0.3)' 
              : isHovered && !disabled
                ? '0 0 10px rgba(6, 182, 212, 0.2)'
                : 'none'
          }}
          type="button"
          title="Subir archivo (máx 2MB)"
        >
          <Paperclip style={{ 
            width: '1.25rem', 
            height: '1.25rem', 
            color: dragOver ? 'var(--primary)' : 'var(--muted-foreground)',
            transition: 'all 0.2s',
            transform: dragOver ? 'rotate(-15deg)' : 'rotate(0deg)'
          }} />
        </button>
      )}
    </div>
  );
}
