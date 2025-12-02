import { useState, useCallback } from 'react';

interface TranslationCache {
  [key: string]: string;
}

export function useTranslation() {
  const [translationCache, setTranslationCache] = useState<TranslationCache>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    return localStorage.getItem('preferredLanguage') || navigator.language.split('-')[0] || 'en';
  });

  const detectLanguage = useCallback((text: string): string => {
    const patterns = {
      es: /\b(el|la|los|las|un|una|de|que|y|en|es|por|para|con|no|hola|gracias)\b/gi,
      en: /\b(the|is|are|was|were|be|have|has|do|does|will|can|hello|hi)\b/gi,
      fr: /\b(le|la|les|un|une|de|que|et|est|dans|pour|avec|bonjour|merci)\b/gi,
      de: /\b(der|die|das|ein|eine|und|ist|sind|haben|hat|hallo|danke)\b/gi,
      pt: /\b(o|a|os|as|um|uma|de|que|e|em|é|por|para|não|olá)\b/gi,
      it: /\b(il|lo|la|un|una|di|che|e|è|in|per|con|ciao|grazie)\b/gi,
    };

    let maxMatches = 0;
    let detectedLang = 'en';

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern)?.length || 0;
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedLang = lang;
      }
    }

    return detectedLang;
  }, []);

  const translateText = useCallback(async (text: string, sourceLang?: string): Promise<string> => {
    const cacheKey = `${text}_${targetLanguage}`;
    
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
      setIsTranslating(true);
      const fromLang = sourceLang || detectLanguage(text);
      
      if (fromLang === targetLanguage) {
        setTranslationCache(prev => ({ ...prev, [cacheKey]: text }));
        return text;
      }

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Translation failed: ${response.status}`);

      const data = await response.json();
      const translatedText = data?.[0] && Array.isArray(data[0]) 
        ? data[0].map((item: any) => item[0]).join('') 
        : text;

      setTranslationCache(prev => ({ ...prev, [cacheKey]: translatedText }));
      return translatedText;
    } catch {
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [targetLanguage, translationCache, detectLanguage]);

  const changeTargetLanguage = useCallback((lang: string) => {
    setTargetLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  }, []);

  return {
    translateText,
    isTranslating,
    targetLanguage,
    changeTargetLanguage,
    detectLanguage
  };
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];
