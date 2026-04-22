// ==========================================
// HEADER - Navegación principal
// ==========================================

import type { SectionId, Config } from '../types';

interface HeaderProps {
  config: Config;
  setConfig: (c: Partial<Config>) => void;
  activeSection: SectionId;
  sections: { id: SectionId; label: string; icon: string }[];
  onSectionChange: (id: SectionId) => void;
  onCopy: () => void;
  onShare: () => void;
  onInstall: () => void;
  showToast: (msg: string) => void;
}

export default function Header({ config, setConfig, activeSection, sections, onSectionChange, onCopy, onShare, showToast }: HeaderProps) {
  return (
    <header className="max-w-5xl mx-auto mb-4">
      <div className="flex justify-between items-center mb-3 px-1">
        <h1 className="text-white text-xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          🔢 CalcNum Pro v6.0
        </h1>
        <div className="flex gap-2">
          <button
            className="w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-all"
            onClick={() => { setConfig({ sound: !config.sound }); showToast(config.sound ? '🔇 Sonido off' : '🔊 Sonido on'); }}
            title="Sonido"
          >
            {config.sound ? '🔊' : '🔇'}
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-all"
            onClick={() => { setConfig({ theme: config.theme === 'dark' ? 'light' : 'dark' }); showToast(config.theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'); }}
            title="Tema"
          >
            🌓
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-all"
            onClick={() => { onCopy(); }}
            title="Copiar"
          >
            📋
          </button>
          <button
            className="w-10 h-10 rounded-full bg-white/20 text-white text-lg flex items-center justify-center hover:bg-white/30 transition-all"
            onClick={() => { onShare(); }}
            title="Compartir"
          >
            📤
          </button>
        </div>
      </div>

      {/* Section Selector */}
      <div className="flex gap-2 p-2 rounded-xl overflow-x-auto" style={{ background: 'var(--panel-bg)' }}>
        {sections.map(sec => (
          <button
            key={sec.id}
            className={`mode-btn whitespace-nowrap ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => onSectionChange(sec.id)}
          >
            <span className={`inline-block w-2 h-2 rounded-full mr-1 ${activeSection === sec.id ? 'bg-green-500 shadow-[0_0_8px_#2ecc71]' : 'bg-gray-600'}`} />
            {sec.icon} {sec.label}
          </button>
        ))}
      </div>
    </header>
  );
}
