// ==========================================
// CALCNUM - Contenedor principal de secciones numéricas
// ==========================================

import { useState, useCallback } from 'react';
import type { Config, HistoryItem } from '../../types';
import { useFeedback, useHistory } from '../../hooks';
import CalcBase from './CalcBase';
import { Convert, Scientific, Complement, Gray, Ascii, FloatIEEE } from './Utils';
import { Bcd, Subnet, Boolean, Hamming, Crc } from './Advanced';
import { Terminal, Waveform } from '../Extras';

const TABS = [
  { id: 'calc', label: 'Calc', shortcut: '1' },
  { id: 'convert', label: 'Conv', shortcut: '2' },
  { id: 'scientific', label: 'Bit', shortcut: '3' },
  { id: 'complement', label: 'Comp2', shortcut: '4' },
  { id: 'gray', label: 'Gray', shortcut: '5' },
  { id: 'ascii', label: 'ASCII', shortcut: '6' },
  { id: 'float', label: 'IEEE', shortcut: '7' },
  { id: 'bcd', label: 'BCD', shortcut: '8' },
  { id: 'subnet', label: 'IP', shortcut: '9' },
  { id: 'boolean', label: 'Bool', shortcut: '0' },
  { id: 'hamming', label: 'Hamm', shortcut: 'h' },
  { id: 'crc', label: 'CRC', shortcut: 'c' },
  { id: 'terminal', label: 'Term', shortcut: 't' },
  { id: 'waveform', label: 'Onda', shortcut: 'w' },
];

interface CalcNumProps {
  config: Config;
  showToast: (msg: string) => void;
}

export default function CalcNum({ config, showToast }: CalcNumProps) {
  const [activeTab, setActiveTab] = useState('calc');
  const [history, addHistory, clearHistory] = useHistory();
  const feedback = useFeedback(config);

  const handleTabChange = useCallback((id: string) => {
    feedback();
    setActiveTab(id);
  }, [feedback]);

  // Keyboard shortcuts for tabs
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const tab = TABS.find(t => t.shortcut === e.key.toLowerCase());
    if (tab) {
      e.preventDefault();
      handleTabChange(tab.id);
    }
  }, [handleTabChange]);

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-4 overflow-x-auto" style={{ background: 'var(--panel-bg)' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`px-2 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white/10 text-white border border-orange-400'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${activeTab === tab.id ? 'bg-green-400' : 'bg-gray-600'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="section-animate">
        {activeTab === 'calc' && <CalcBase config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'convert' && <Convert config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'scientific' && <Scientific config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'complement' && <Complement config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'gray' && <Gray config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'ascii' && <Ascii config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'float' && <FloatIEEE config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'bcd' && <Bcd config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'subnet' && <Subnet config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'boolean' && <Boolean config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'hamming' && <Hamming config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'crc' && <Crc config={config} addHistory={addHistory} showToast={showToast} />}
        {activeTab === 'terminal' && <Terminal config={config} addHistory={addHistory} showToast={showToast} clearHistory={clearHistory} history={history} />}
        {activeTab === 'waveform' && <Waveform config={config} showToast={showToast} />}
      </div>
    </div>
  );
}
