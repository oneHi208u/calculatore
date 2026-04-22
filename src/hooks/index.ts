// ==========================================
// HOOKS - CalcNum Pro v6.0
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import type { Config, HistoryItem } from '../types';

// Configuración global
export function useConfig(): [Config, (c: Partial<Config>) => void] {
  const [config, setConfigState] = useState<Config>(() => ({
    theme: (localStorage.getItem('calcnum_theme') as 'dark' | 'light') || 'dark',
    accent: localStorage.getItem('calcnum_accent') || 'orange',
    sound: localStorage.getItem('calcnum_sound') === 'true',
    haptic: localStorage.getItem('calcnum_haptic') !== 'false',
    fontSize: (localStorage.getItem('calcnum_font') as 'small' | 'normal' | 'large') || 'normal',
    compact: localStorage.getItem('calcnum_compact') === 'true',
  }));

  const setConfig = useCallback((partial: Partial<Config>) => {
    setConfigState(prev => {
      const next = { ...prev, ...partial };
      Object.entries(next).forEach(([key, value]) => {
        localStorage.setItem(`calcnum_${key}`, String(value));
      });
      return next;
    });
  }, []);

  return [config, setConfig];
}

// Historial
export function useHistory(): [HistoryItem[], (item: HistoryItem) => void, () => void] {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('calcnum_history') || '[]');
    } catch {
      return [];
    }
  });

  const addHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const next = [item, ...prev].slice(0, 100);
      localStorage.setItem('calcnum_history', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('calcnum_history');
  }, []);

  return [history, addHistory, clearHistory];
}

// Feedback háptico y sonido
export function useFeedback(config: Config) {
  const trigger = useCallback(() => {
    if (config.haptic && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (config.sound) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } catch {}
    }
  }, [config.haptic, config.sound]);

  return trigger;
}

// Toast
export function useToast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  }, []);

  return { toast, showToast };
}

// Service Worker
export function useServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch(() => {});
    }
  }, []);

  return updateAvailable;
}

// Network status
export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}
