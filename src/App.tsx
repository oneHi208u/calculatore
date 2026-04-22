// ==========================================
// APP.TSX - CalcNum Pro v6.0 Main Component
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useConfig, useFeedback, useToast, useNetworkStatus } from './hooks';
import { type SectionId } from './types';
import Header from './sections/Header';
import CalcNum from './sections/calcnum/CalcNum';
import Casio from './sections/casio/Casio';
import TiNspire from './sections/ti/TiNspire';
import Ref from './sections/Extras';
import { copyToClipboard, shareContent } from './utils';

const SECTIONS: { id: SectionId; label: string; icon: string }[] = [
  { id: 'calcnum', label: 'CalcNum', icon: '🔢' },
  { id: 'casio', label: 'Casio fx-991CW', icon: '🧮' },
  { id: 'tinspire', label: 'TI-Nspire CX', icon: '📐' },
  { id: 'ref', label: 'Referencia', icon: '📚' },
];

export default function App() {
  const [config, setConfig] = useConfig();
  const [activeSection, setActiveSection] = useState<SectionId>('calcnum');
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const feedback = useFeedback(config);
  const { toast, showToast } = useToast();
  const online = useNetworkStatus();

  // Install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowInstall(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', config.theme === 'dark' ? '#1a1a2e' : '#667eea');
  }, [config.theme]);

  // Font size
  useEffect(() => {
    const sizes = { small: '14px', normal: '16px', large: '18px' };
    document.documentElement.style.setProperty('--font-size-base', sizes[config.fontSize]);
  }, [config.fontSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (e.key === 'Escape') {
        // Sections handle their own escape
        return;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleCopy = useCallback(async () => {
    const activeEl = document.querySelector('.section-active .display-main, .section-active .casio-display, .section-active .ti-display');
    if (activeEl) {
      await copyToClipboard(activeEl.textContent || '');
      showToast('✓ Copiado al portapapeles');
    }
  }, [showToast]);

  const handleShare = useCallback(async () => {
    await shareContent('CalcNum Pro v6.0', 'Calculadora avanzada multibase, Casio fx-991CW y TI-Nspire CX');
  }, []);

  const handleInstall = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setShowInstall(false);
        setDeferredPrompt(null);
      });
    } else {
      alert('Para instalar:\nChrome Android: Menú → "Agregar a pantalla de inicio"\nSafari iOS: Compartir → "Agregar a pantalla de inicio"');
    }
  }, [deferredPrompt]);

  const handleSectionChange = useCallback((id: SectionId) => {
    feedback();
    setActiveSection(id);
  }, [feedback]);

  return (
    <div className="min-h-screen">
      {/* Offline badge */}
      {!online && (
        <div className="fixed top-2 right-2 z-50 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
          📴 Sin conexión
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all">
          {toast.message}
        </div>
      )}

      {/* Header */}
      <Header
        config={config}
        setConfig={setConfig}
        activeSection={activeSection}
        sections={SECTIONS}
        onSectionChange={handleSectionChange}
        onCopy={handleCopy}
        onShare={handleShare}
        onInstall={() => setShowInstall(true)}
        showToast={showToast}
      />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto">
        <div className={activeSection === 'calcnum' ? 'section-active section-animate' : 'hidden'}>
          <CalcNum config={config} showToast={showToast} />
        </div>
        <div className={activeSection === 'casio' ? 'section-active section-animate' : 'hidden'}>
          <Casio config={config} showToast={showToast} />
        </div>
        <div className={activeSection === 'tinspire' ? 'section-active section-animate' : 'hidden'}>
          <TiNspire config={config} showToast={showToast} />
        </div>
        <div className={activeSection === 'ref' ? 'section-active section-animate' : 'hidden'}>
          <Ref />
        </div>
      </main>

      {/* Install Banner */}
      {showInstall && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-5 animate-[slideUp_0.3s]" style={{ background: 'var(--calc-bg)', borderTop: '3px solid var(--accent-green)', boxShadow: '0 -10px 30px rgba(0,0,0,0.5)' }}>
          <button className="absolute top-2 right-4 text-2xl text-gray-400" onClick={() => setShowInstall(false)}>×</button>
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Instalar aplicación</div>
          <div className="mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>Usa CalcNum Pro v6.0 sin conexión</div>
          <button className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg uppercase tracking-wider shadow-lg" onClick={handleInstall}>
            📲 Instalar App
          </button>
        </div>
      )}
    </div>
  );
}
