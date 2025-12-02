import { useState, useCallback } from 'react';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (reducido para Base64)
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain'
];

export function useFileUpload(encryptionKey: CryptoKey | null) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Memoizar función de encriptación para evitar recreación
  const encryptFile = useCallback(async (file: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      file
    );

    // Optimización: combinar IV + contenido sin crear arrays intermedios
    const encryptedArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv, 0);
    combined.set(encryptedArray, iv.length);
    return combined.buffer;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<{
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
  } | null> => {
    // Validación de tamaño
    if (file.size > MAX_FILE_SIZE) {
      alert(`El archivo es muy grande. Máximo ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return null;
    }

    // Validación de tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo imágenes, PDF y TXT.');
      return null;
    }

    if (!encryptionKey) {
      alert('No hay clave de encriptación disponible');
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Leer archivo como ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      
      setProgress(33);
      
      // Encriptar el archivo
      const encryptedBuffer = await encryptFile(fileBuffer, encryptionKey);
      
      setProgress(66);
      
      // Optimización: conversión a Base64 más eficiente
      const uint8Array = new Uint8Array(encryptedBuffer);
      const base64Data = btoa(
        uint8Array.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      // Crear data URL
      const dataUrl = `data:application/octet-stream;base64,${base64Data}`;
      
      setProgress(100);
      setUploading(false);

      return {
        url: dataUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath: ''
      };
    } catch (error) {
      alert('Error processing file. Please try again.');
      setUploading(false);
      return null;
    }
  }, [encryptionKey, encryptFile]);

  const decryptFile = useCallback(async (
    encryptedBuffer: ArrayBuffer,
    key: CryptoKey
  ): Promise<ArrayBuffer> => {
    const data = new Uint8Array(encryptedBuffer);
    const iv = data.slice(0, 12);
    const content = data.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      content
    );

    return decryptedContent;
  }, []);

  const downloadFile = useCallback(async (url: string, fileName: string, fileType: string) => {
    if (!encryptionKey) {
      alert('Encryption key not available');
      return;
    }

    try {
      // Optimización: conversión de Base64 más eficiente
      const base64Data = url.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const decryptedBuffer = await decryptFile(bytes.buffer, encryptionKey);
      
      const blob = new Blob([decryptedBuffer], { type: fileType });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Limpieza inmediata
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      alert('Error downloading file. It may be corrupted.');
    }
  }, [encryptionKey, decryptFile]);

  return {
    uploadFile,
    downloadFile,
    uploading,
    progress,
    decryptFile
  };
}
