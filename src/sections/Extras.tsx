// ==========================================
// TERMINAL + WAVEFORM + REF
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Config, HistoryItem } from '../types';
import { useFeedback } from '../hooks';
import { binaryToGray, grayToBinary } from '../utils';

// === TERMINAL ===
export function Terminal({ config, addHistory, showToast, clearHistory, history }: {
  config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void;
  clearHistory: () => void; history: HistoryItem[];
}) {
  const [lines, setLines] = useState<string[]>([
    'CalcNum Pro Terminal v6.0',
    'Comandos: bin, oct, dec, hex, and, or, xor, comp2, gray, bcd, clear, history',
    'Ejemplo: "dec 255 to hex"',
    '─────────────────────────',
  ]);
  const [input, setInput] = useState('');
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const feedback = useFeedback(config);

  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [lines]);

  const execute = useCallback(() => {
    if (!input.trim()) return;
    feedback();
    const cmd = input.trim();
    setCmdHistory(p => [...p, cmd]);
    setHistoryIdx(-1);

    const parts = cmd.toLowerCase().split(/\s+/);
    const op = parts[0];
    let output = '';
    let isError = false;

    const out = (text: string, err = false) => {
      output = text;
      isError = err;
    };

    try {
      switch (op) {
        case 'help': out('Comandos: bin/oct/dec/hex <num> [to bin/oct/dec/hex], and/or/xor <a> <b>, comp2 <num> [bits], gray <bin> [to/from], bcd <num> [type], clear, history'); break;
        case 'clear': setLines([]); setInput(''); return;
        case 'history': out(history.slice(0, 10).map((h, i) => `${i + 1}. ${h.type}: ${h.result}`).join('\n') || 'Sin historial'); break;
        case 'bin':
        case 'oct':
        case 'dec':
        case 'hex': {
          const num = parts[1];
          const fromBase = { bin: 2, oct: 8, dec: 10, hex: 16 }[op] || 10;
          const dec = parseInt(num, fromBase);
          if (isNaN(dec)) { out('Número inválido', true); break; }
          let to = 10;
          if (parts[2] === 'to' && parts[3]) to = { bin: 2, oct: 8, dec: 10, hex: 16 }[parts[3]] || 10;
          if (to === 10) out(dec.toString());
          else if (to === 2) out(dec.toString(2));
          else if (to === 8) out(dec.toString(8));
          else out(dec.toString(16).toUpperCase());
          break;
        }
        case 'and': { const a = parseInt(parts[1]), b = parseInt(parts[2]); out(isNaN(a) || isNaN(b) ? 'Dos números requeridos' : (a & b).toString(), isNaN(a) || isNaN(b)); break; }
        case 'or': { const a = parseInt(parts[1]), b = parseInt(parts[2]); out(isNaN(a) || isNaN(b) ? 'Dos números requeridos' : (a | b).toString(), isNaN(a) || isNaN(b)); break; }
        case 'xor': { const a = parseInt(parts[1]), b = parseInt(parts[2]); out(isNaN(a) || isNaN(b) ? 'Dos números requeridos' : (a ^ b).toString(), isNaN(a) || isNaN(b)); break; }
        case 'not': { const a = parseInt(parts[1]); out(isNaN(a) ? 'Número requerido' : (~a).toString(), isNaN(a)); break; }
        case 'comp2': { const n = parseInt(parts[1]); const bits = parseInt(parts[2]) || 8; out(isNaN(n) ? 'Número requerido' : n >= 0 ? n.toString(2).padStart(bits, '0') : (BigInt(2 ** bits) + BigInt(n)).toString(2).padStart(bits, '0'), isNaN(n)); break; }
        case 'gray': { const b = parts[1]; out(!/^[01]+$/.test(b) ? 'Binario requerido' : parts[2] === 'from' ? grayToBinary(b) : binaryToGray(b), !/^[01]+$/.test(b)); break; }
        case 'bcd': { const n = parts[1]; const t = parts[2] || '8421'; out(!/^\d+$/.test(n) ? 'Decimal requerido' : n.split('').map((d: string) => {
          const tables: Record<string, string[]> = { '8421': ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001'], '2421': ['0000', '0001', '0010', '0011', '0100', '1011', '1100', '1101', '1110', '1111'], 'excess3': ['0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100'] };
          return (tables[t] || tables['8421'])[parseInt(d)];
        }).join(' '), !/^\d+$/.test(n)); break; }
        default: out(`Comando desconocido: ${op}. Escribe 'help'.`, true);
      }
    } catch (e) { out('Error: ' + String(e), true); }

    setLines(p => [...p, `$ ${cmd}`, output]);
    setInput('');
  }, [feedback, input, history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); execute(); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.max(0, historyIdx + 1);
      if (idx < cmdHistory.length) { setHistoryIdx(idx); setInput(cmdHistory[cmdHistory.length - 1 - idx]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = historyIdx - 1;
      if (idx >= 0) { setHistoryIdx(idx); setInput(cmdHistory[cmdHistory.length - 1 - idx]); }
      else { setHistoryIdx(-1); setInput(''); }
    }
  };

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Modo Terminal</div>
      <div className="terminal-mode">
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.startsWith('Error') || line.includes('desconocido') ? 'text-red-400' : line.startsWith('$') ? 'text-green-400' : 'text-blue-400'}`}>{line}</div>
        ))}
        <div ref={bottomRef} />
        <div className="flex items-center mt-2">
          <span className="text-green-400 mr-2">$</span>
          <input
            className="bg-transparent border-none text-green-400 font-mono flex-1 outline-none"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando..."
            autoFocus
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {['help', 'clear', 'history', 'dec 255 to bin', 'hex FF to dec', 'comp2 -42 8'].map(c => (
          <button key={c} className="calc-key small-text" onClick={() => { setInput(c); execute(); }}>{c}</button>
        ))}
      </div>
    </div>
  );
}

// === WAVEFORM ===
export function Waveform({ config, showToast }: { config: Config; showToast: (m: string) => void }) {
  const [input, setInput] = useState('10110100');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feedback = useFeedback(config);

  const draw = useCallback((binary: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const bitW = w / binary.length;

    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();

    let x = 0;
    let y = binary[0] === '1' ? h * 0.25 : h * 0.75;
    ctx.moveTo(x, y);

    for (let i = 0; i < binary.length; i++) {
      const newY = binary[i] === '1' ? h * 0.25 : h * 0.75;
      if (newY !== y) ctx.lineTo(x, newY);
      x += bitW;
      y = newY;
      ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 1; i < binary.length; i++) {
      ctx.beginPath();
      ctx.moveTo(i * bitW, 0);
      ctx.lineTo(i * bitW, h);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    for (let i = 0; i < binary.length; i++) {
      ctx.fillText(binary[i], i * bitW + bitW / 2 - 3, h - 5);
      ctx.fillText(i.toString(), i * bitW + bitW / 2 - 3, 12);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth || 600;
      canvas.height = 120;
      draw(input.padEnd(8, '0').slice(0, 8));
    }
  }, [draw, input]);

  const animate = useCallback(() => {
    feedback();
    const binary = input.padEnd(8, '0').slice(0, 8);
    const delays = { slow: 400, normal: 150, fast: 60 };
    const delay = delays[speed];
    let step = 0;
    const max = binary.length * 2;

    const stepFn = () => {
      if (step >= max) return;
      const shift = Math.floor(step / 2);
      const shifted = binary.slice(shift) + binary.slice(0, shift);
      draw(shifted);
      step++;
      setTimeout(stepFn, delay);
    };
    stepFn();
  }, [feedback, input, speed, draw]);

  const byte = parseInt(input.padEnd(8, '0').slice(0, 8), 2) || 0;

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Visualización de Onda</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{input.padEnd(8, '0').slice(0, 8)}</div>
        <div className="text-right text-sm mt-1" style={{ color: '#5a6358' }}>Byte: {byte} | Hex: {byte.toString(16).toUpperCase().padStart(2, '0')}</div>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value.replace(/[^01]/g, ''))} placeholder="Ej: 10110100" maxLength={8} /></div>
      <canvas ref={canvasRef} className="w-full rounded-lg mb-3" style={{ height: 120, background: '#0d1117' }} />
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['slow', 'normal', 'fast'] as const).map(s => (
          <button key={s} className={`calc-key small-text ${speed === s ? 'selected' : ''}`} onClick={() => { feedback(); setSpeed(s); }}>{s === 'slow' ? 'Lenta' : s === 'normal' ? 'Normal' : 'Rápida'}</button>
        ))}
      </div>
      <button className="calc-key equals w-full" onClick={animate}>ANIMAR</button>
    </div>
  );
}

// === REF ===
export default function Ref() {
  return (
    <div className="space-y-4">
      <div className="calc-frame">
        <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Hexadecimal ↔ Binario</div>
        <table className="ref-table">
          <thead><tr><th>Hex</th><th>Bin</th><th>Hex</th><th>Bin</th></tr></thead>
          <tbody>
            <tr><td>0</td><td>0000</td><td>8</td><td>1000</td></tr>
            <tr><td>1</td><td>0001</td><td>9</td><td>1001</td></tr>
            <tr><td>2</td><td>0010</td><td>A</td><td>1010</td></tr>
            <tr><td>3</td><td>0011</td><td>B</td><td>1011</td></tr>
            <tr><td>4</td><td>0100</td><td>C</td><td>1100</td></tr>
            <tr><td>5</td><td>0101</td><td>D</td><td>1101</td></tr>
            <tr><td>6</td><td>0110</td><td>E</td><td>1110</td></tr>
            <tr><td>7</td><td>0111</td><td>F</td><td>1111</td></tr>
          </tbody>
        </table>
      </div>

      <div className="calc-frame">
        <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Octal ↔ Binario</div>
        <table className="ref-table">
          <thead><tr><th>Oct</th><th>Bin</th><th>Oct</th><th>Bin</th></tr></thead>
          <tbody>
            <tr><td>0</td><td>000</td><td>4</td><td>100</td></tr>
            <tr><td>1</td><td>001</td><td>5</td><td>101</td></tr>
            <tr><td>2</td><td>010</td><td>6</td><td>110</td></tr>
            <tr><td>3</td><td>011</td><td>7</td><td>111</td></tr>
          </tbody>
        </table>
      </div>

      <div className="calc-frame">
        <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Operaciones Lógicas Bit a Bit</div>
        <table className="ref-table">
          <thead><tr><th>AND</th><th>OR</th><th>XOR</th><th>NOT</th></tr></thead>
          <tbody>
            <tr><td>0&0=0</td><td>0|0=0</td><td>0^0=0</td><td>~0=1</td></tr>
            <tr><td>0&1=0</td><td>0|1=1</td><td>0^1=1</td><td>~1=0</td></tr>
            <tr><td>1&0=0</td><td>1|0=1</td><td>1^0=1</td><td>-</td></tr>
            <tr><td>1&1=1</td><td>1|1=1</td><td>1^1=0</td><td>-</td></tr>
          </tbody>
        </table>
      </div>

      <div className="calc-frame">
        <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Potencias de 2</div>
        <table className="ref-table">
          <thead><tr><th>2^n</th><th>Valor</th><th>2^n</th><th>Valor</th></tr></thead>
          <tbody>
            <tr><td>2^0</td><td>1</td><td>2^8</td><td>256</td></tr>
            <tr><td>2^1</td><td>2</td><td>2^10</td><td>1,024</td></tr>
            <tr><td>2^2</td><td>4</td><td>2^16</td><td>65,536</td></tr>
            <tr><td>2^4</td><td>16</td><td>2^20</td><td>1,048,576</td></tr>
            <tr><td>2^6</td><td>64</td><td>2^32</td><td>~4.3×10^9</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
