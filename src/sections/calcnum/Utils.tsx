// ==========================================
// CONVERT + ASCII + WAVEFORM (componentes combinados)
// ==========================================

import { useState, useCallback } from 'react';
import type { Config, HistoryItem } from '../../types';
import { useFeedback } from '../../hooks';
import { validateInput, binaryToGray, grayToBinary, floatToIEEE32, ieee32ToFloat, hexToBinary, copyToClipboard } from '../../utils';

// === CONVERT ===
export function Convert({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(2);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [steps, setSteps] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const feedback = useFeedback(config);

  const convert = useCallback(() => {
    feedback();
    const v = validateInput(input, fromBase);
    if (!v.valid) { setError(v.error); return; }
    setError('');

    try {
      const dec = BigInt(parseInt(input, fromBase));
      let res: string;
      if (toBase === 10) res = dec.toString();
      else if (toBase === 2) res = dec.toString(2);
      else if (toBase === 8) res = dec.toString(8);
      else res = dec.toString(16).toUpperCase();

      setResult(res);
      setSteps(`<div class="step-line">${input} (${fromBase}) → ${res} (${toBase})</div><div class="step-line">Decimal intermedio: ${dec}</div>`);
      setShowSteps(true);
      addHistory({ type: 'convert', input, result: res, timestamp: new Date().toISOString() });
    } catch {
      setError('Error en conversión');
    }
  }, [feedback, input, fromBase, toBase, addHistory]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Conversor de Bases</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || input || '0'}</div>
      </div>
      <div className="mb-3">
        <div className="section-label">Número</div>
        <input className={`quick-input ${error ? 'error' : ''}`} value={input} onChange={e => { setInput(e.target.value); setError(''); }} placeholder="Ej: 255, FF" />
        {error && <div className="text-sm text-red-500">{error}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <div className="section-label">De</div>
          <div className="grid grid-cols-2 gap-1">
            {[2, 8, 10, 16].map(b => (
              <button key={b} className={`calc-key small-text ${fromBase === b ? 'selected' : ''}`} onClick={() => { feedback(); setFromBase(b); }}>{['BIN', 'OCT', 'DEC', 'HEX'][b === 2 ? 0 : b === 8 ? 1 : b === 10 ? 2 : 3]}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="section-label">A</div>
          <div className="grid grid-cols-2 gap-1">
            {[2, 8, 10, 16].map(b => (
              <button key={b} className={`calc-key small-text ${toBase === b ? 'selected' : ''}`} onClick={() => { feedback(); setToBase(b); }}>{['BIN', 'OCT', 'DEC', 'HEX'][b === 2 ? 0 : b === 8 ? 1 : b === 10 ? 2 : 3]}</button>
            ))}
          </div>
        </div>
      </div>
      <button className="calc-key equals w-full mb-3" onClick={convert}>CONVERTIR</button>
      {showSteps && (
        <div className="steps-panel">
          <div className="steps-header flex justify-between">📋 Procedimiento <button className="text-xs px-2 py-1 rounded bg-black/20" onClick={() => copyToClipboard(steps.replace(/<[^>]*>/g, '')).then(() => showToast('✓ Copiado'))}>📋</button></div>
          <div className="steps-body" dangerouslySetInnerHTML={{ __html: steps }} />
        </div>
      )}
    </div>
  );
}

// === SCIENTIFIC ===
export function Scientific({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [op, setOp] = useState('AND');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const ops = ['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR', 'SHL', 'SHR', 'ROL', 'ROR', 'POPCNT'];

  const calc = useCallback(() => {
    feedback();
    const a = parseInt(n1) || 0;
    let res: number;
    const b = parseInt(n2) || 0;

    switch (op) {
      case 'AND': res = a & b; break;
      case 'OR': res = a | b; break;
      case 'XOR': res = a ^ b; break;
      case 'NOT': res = ~a; break;
      case 'NAND': res = ~(a & b); break;
      case 'NOR': res = ~(a | b); break;
      case 'XNOR': res = ~(a ^ b); break;
      case 'SHL': res = a << b; break;
      case 'SHR': res = a >>> b; break;
      case 'ROL': res = (a << b) | (a >>> (32 - b)); break;
      case 'ROR': res = (a >>> b) | (a << (32 - b)); break;
      case 'POPCNT': { let c = 0, n = a >>> 0; while (n) { c += n & 1; n >>>= 1; } res = c; break; }
      default: res = 0;
    }

    setResult(res.toString());
    addHistory({ type: 'scientific', operation: op, num1: a, num2: b, result: res.toString(), timestamp: new Date().toISOString() });
  }, [feedback, op, n1, n2, addHistory]);

  const bin = (n: number) => (n >>> 0).toString(2).padStart(16, '0');

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Operaciones Bit a Bit</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
        <div className="text-right text-sm mt-1" style={{ color: '#5a6358' }}>{op}</div>
      </div>
      <div className="mb-2"><input className="quick-input" value={n1} onChange={e => setN1(e.target.value)} placeholder="Número 1" /></div>
      {op !== 'NOT' && op !== 'POPCNT' && <div className="mb-2"><input className="quick-input" value={n2} onChange={e => setN2(e.target.value)} placeholder="Número 2" /></div>}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {ops.map(o => (
          <button key={o} className={`calc-key small-text ${op === o ? 'selected' : ''}`} onClick={() => { feedback(); setOp(o); }}>{o}</button>
        ))}
      </div>
      <button className="calc-key equals w-full mb-3" onClick={calc}>CALCULAR</button>
      {/* Bit visualization */}
      {n1 && (
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {bin(parseInt(n1) || 0).split('').map((b, i) => <div key={i} className={`bit ${b === '1' ? 'active' : 'inactive'}`}>{b}</div>)}
        </div>
      )}
      {result && (
        <div className="flex flex-wrap justify-center gap-1">
          {bin(parseInt(result) || 0).split('').map((b, i) => <div key={i} className={`bit ${b === '1' ? 'active' : 'inactive'}`}>{b}</div>)}
        </div>
      )}
    </div>
  );
}

// === COMPLEMENT ===
export function Complement({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const [bits, setBits] = useState(8);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (mode === 'to') {
      const num = parseInt(input);
      if (isNaN(num)) return;
      const max = Math.pow(2, bits - 1) - 1;
      const min = -Math.pow(2, bits - 1);
      if (num > max || num < min) { showToast(`Rango: ${min} a ${max}`); return; }

      let res: string;
      if (num >= 0) {
        res = num.toString(2).padStart(bits, '0');
      } else {
        const abs = Math.abs(num);
        const bin = abs.toString(2).padStart(bits, '0');
        const inv = bin.split('').map(b => b === '0' ? '1' : '0').join('');
        res = (BigInt('0b' + inv) + 1n).toString(2).padStart(bits, '0');
      }
      setResult(res);
      addHistory({ type: 'complement', mode: 'toComp', input: num.toString(), bits, result: res, timestamp: new Date().toISOString() });
    } else {
      if (!/^[01]+$/.test(input)) return;
      const bin = input.padStart(bits, input[0]).slice(-bits);
      const neg = bin[0] === '1';
      let res: number;
      if (!neg) {
        res = parseInt(bin, 2);
      } else {
        const inv = bin.split('').map(b => b === '0' ? '1' : '0').join('');
        const plus = (parseInt(inv, 2) + 1).toString(2).padStart(bits, '0');
        res = -parseInt(plus, 2);
      }
      setResult(res.toString());
      addHistory({ type: 'complement', mode: 'fromComp', input: bin, bits, result: res.toString(), timestamp: new Date().toISOString() });
    }
  }, [feedback, mode, bits, input, addHistory, showToast]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Complemento a 2</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'to' ? 'selected' : ''}`} onClick={() => setMode('to')}>Decimal → C2</button>
        <button className={`flex-1 calc-key small-text ${mode === 'from' ? 'selected' : ''}`} onClick={() => setMode('from')}>C2 → Decimal</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'to' ? 'Ej: -42' : 'Ej: 11010110'} /></div>
      <div className="section-label">Bits</div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[8, 16, 32, 64].map(b => (
          <button key={b} className={`calc-key small-text ${bits === b ? 'selected' : ''}`} onClick={() => { feedback(); setBits(b); }}>{b} bits</button>
        ))}
      </div>
      <button className="calc-key equals w-full" onClick={calc}>CALCULAR</button>
    </div>
  );
}

// === GRAY ===
export function Gray({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (!/^[01]+$/.test(input)) return;
    const res = mode === 'to' ? binaryToGray(input) : grayToBinary(input);
    setResult(res);
    addHistory({ type: 'gray', mode: mode === 'to' ? 'binToGray' : 'grayToBin', input, result: res, timestamp: new Date().toISOString() });
  }, [feedback, mode, input, addHistory]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Código Gray</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'to' ? 'selected' : ''}`} onClick={() => setMode('to')}>Bin → Gray</button>
        <button className={`flex-1 calc-key small-text ${mode === 'from' ? 'selected' : ''}`} onClick={() => setMode('from')}>Gray → Bin</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ej: 1010" /></div>
      <button className="calc-key equals w-full mb-3" onClick={calc}>CONVERTIR</button>
      {/* Gray table */}
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Tabla Gray (0-15)</div>
      <div className="grid grid-cols-2 gap-1">
        {Array.from({ length: 16 }, (_, i) => {
          const bin = i.toString(2).padStart(4, '0');
          const gray = binaryToGray(bin);
          return (
            <div key={i} className="flex justify-between p-2 rounded text-sm" style={{ background: 'var(--panel-bg)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{i}</span>
              <span style={{ color: 'var(--text-primary)' }}>B:{bin} G:{gray}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === ASCII ===
export function Ascii({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ char: string; code: number; hex: string; bin: string } | null>(null);
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (mode === 'to') {
      const char = input[0];
      if (!char) return;
      const code = char.charCodeAt(0);
      setResult({ char, code, hex: code.toString(16).toUpperCase().padStart(2, '0'), bin: code.toString(2).padStart(8, '0') });
      addHistory({ type: 'ascii', mode: 'charToCode', input: char, result: code.toString(), timestamp: new Date().toISOString() });
    } else {
      const code = parseInt(input);
      if (isNaN(code)) return;
      const char = String.fromCharCode(code);
      setResult({ char: char || '(no imprimible)', code, hex: code.toString(16).toUpperCase(), bin: code.toString(2).padStart(8, '0') });
      addHistory({ type: 'ascii', mode: 'codeToChar', input: code.toString(), result: char, timestamp: new Date().toISOString() });
    }
  }, [feedback, mode, input, addHistory]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>ASCII / Unicode</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result?.char || input || 'A'}</div>
        {result && <div className="text-right text-sm mt-1" style={{ color: '#5a6358' }}>Code: {result.code} | Hex: {result.hex} | Bin: {result.bin}</div>}
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'to' ? 'selected' : ''}`} onClick={() => setMode('to')}>Char → Code</button>
        <button className={`flex-1 calc-key small-text ${mode === 'from' ? 'selected' : ''}`} onClick={() => setMode('from')}>Code → Char</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'to' ? 'Ej: A' : 'Ej: 65'} maxLength={mode === 'to' ? 2 : 10} /></div>
      <button className="calc-key equals w-full mb-3" onClick={calc}>CONVERTIR</button>
      {/* ASCII Grid */}
      <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Tabla ASCII (32-127)</div>
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: 96 }, (_, i) => {
          const code = i + 32;
          const char = String.fromCharCode(code);
          const display = char === ' ' ? '␣' : char;
          return (
            <div key={code} className="ascii-cell" onClick={() => { setInput(char); if (mode === 'to') calc(); }}>
              <div className="font-bold text-sm">{display}</div>
              <div className="text-[0.6rem]" style={{ color: 'var(--text-secondary)' }}>{code}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === FLOAT IEEE ===
export function FloatIEEE({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const [precision, setPrecision] = useState<'single' | 'double'>('single');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (mode === 'to') {
      const num = parseFloat(input);
      if (isNaN(num)) return;
      if (precision === 'single') {
        setResult(floatToIEEE32(num));
      } else {
        const buf = new ArrayBuffer(8);
        new DataView(buf).setFloat64(0, num);
        const arr = new Uint32Array(buf);
        setResult(arr[1].toString(2).padStart(32, '0') + arr[0].toString(2).padStart(32, '0'));
      }
      addHistory({ type: 'float', mode: 'toFloat', precision, input: num.toString(), result, timestamp: new Date().toISOString() });
    } else {
      let bin = input.replace(/\s/g, '');
      if (!/^[01]+$/.test(bin) && /^[0-9A-Fa-f]+$/.test(bin)) bin = hexToBinary(bin);
      const expected = precision === 'single' ? 32 : 64;
      if (bin.length !== expected) { showToast(`Se esperaban ${expected} bits`); return; }

      if (precision === 'single') {
        setResult(ieee32ToFloat(bin).toString());
      } else {
        const high = parseInt(bin.slice(0, 32), 2);
        const low = parseInt(bin.slice(32), 2);
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setUint32(0, high);
        view.setUint32(4, low);
        setResult(view.getFloat64(0).toString());
      }
      addHistory({ type: 'float', mode: 'fromFloat', precision, input: bin, result, timestamp: new Date().toISOString() });
    }
  }, [feedback, mode, precision, input, addHistory, showToast]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Punto Flotante IEEE 754</div>
      <div className="calc-display">
        <div className="text-right text-lg font-bold break-all" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'to' ? 'selected' : ''}`} onClick={() => setMode('to')}>Decimal → IEEE</button>
        <button className={`flex-1 calc-key small-text ${mode === 'from' ? 'selected' : ''}`} onClick={() => setMode('from')}>IEEE → Decimal</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'to' ? 'Ej: 3.14159' : 'Ej: 01000000...'} /></div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${precision === 'single' ? 'selected' : ''}`} onClick={() => { feedback(); setPrecision('single'); }}>32 bits</button>
        <button className={`flex-1 calc-key small-text ${precision === 'double' ? 'selected' : ''}`} onClick={() => { feedback(); setPrecision('double'); }}>64 bits</button>
      </div>
      <button className="calc-key equals w-full" onClick={calc}>CONVERTIR</button>
    </div>
  );
}
