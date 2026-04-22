// ==========================================
// BCD + SUBNET + BOOLEAN + HAMMING + CRC
// ==========================================

import { useState, useCallback } from 'react';
import type { Config, HistoryItem } from '../../types';
import { useFeedback } from '../../hooks';
import { BCD_TABLES, hammingEncode, hammingDecode, calculateCRC, copyToClipboard, ipToInt, intToIp } from '../../utils';

// === BCD ===
export function Bcd({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'to' | 'from'>('to');
  const [type, setType] = useState('8421');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    const table = BCD_TABLES[type];
    if (!table) return;

    if (mode === 'to') {
      if (!/^\d+$/.test(input)) return;
      const res = input.split('').map(d => table[parseInt(d)]).join(' ');
      setResult(res);
      addHistory({ type: 'bcd', mode: 'toBcd', bcdType: type, input, result: res, timestamp: new Date().toISOString() });
    } else {
      if (!/^[01\s]+$/.test(input)) return;
      const clean = input.replace(/\s/g, '');
      let res = '';
      for (let i = 0; i < clean.length; i += 4) {
        const nibble = clean.slice(i, i + 4).padEnd(4, '0');
        const digit = table.indexOf(nibble);
        if (digit === -1) { showToast('Código inválido'); return; }
        res += digit;
      }
      setResult(res);
      addHistory({ type: 'bcd', mode: 'fromBcd', bcdType: type, input: clean, result: res, timestamp: new Date().toISOString() });
    }
  }, [feedback, mode, type, input, addHistory, showToast]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Código BCD</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'to' ? 'selected' : ''}`} onClick={() => setMode('to')}>Dec → BCD</button>
        <button className={`flex-1 calc-key small-text ${mode === 'from' ? 'selected' : ''}`} onClick={() => setMode('from')}>BCD → Dec</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder={mode === 'to' ? 'Ej: 59' : 'Ej: 0101 1001'} /></div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {Object.keys(BCD_TABLES).map(t => (
          <button key={t} className={`calc-key small-text ${type === t ? 'selected' : ''}`} onClick={() => { feedback(); setType(t); }}>{t}</button>
        ))}
      </div>
      <button className="calc-key equals w-full mb-3" onClick={calc}>CONVERTIR</button>
      {/* BCD Table */}
      <table className="ref-table w-full text-sm">
        <thead><tr><th>Dec</th><th>8421</th><th>2421</th><th>Exceso-3</th></tr></thead>
        <tbody>
          {Array.from({ length: 10 }, (_, i) => (
            <tr key={i}><td>{i}</td><td>{BCD_TABLES['8421'][i]}</td><td>{BCD_TABLES['2421'][i]}</td><td>{BCD_TABLES['excess3'][i]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// === SUBNET ===
export function Subnet({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(input)) { showToast('Formato: IP/CIDR'); return; }
    const [ipStr, cidrStr] = input.split('/');
    const cidr = parseInt(cidrStr);
    if (cidr < 0 || cidr > 32) { showToast('CIDR: 0-32'); return; }

    const ipParts = ipStr.split('.').map(Number);
    if (ipParts.some(p => p < 0 || p > 255)) { showToast('Octeto inválido'); return; }

    const ipInt = ipToInt(ipStr);
    const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    const wildcardInt = ~maskInt >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;
    const hosts = Math.pow(2, 32 - cidr);
    const usable = hosts > 2 ? hosts - 2 : hosts;
    const first = hosts > 2 ? (networkInt + 1) >>> 0 : networkInt;
    const last = hosts > 2 ? (broadcastInt - 1) >>> 0 : broadcastInt;

    setResult({
      network: intToIp(networkInt),
      mask: intToIp(maskInt),
      wildcard: intToIp(wildcardInt),
      first: intToIp(first),
      last: intToIp(last),
      broadcast: intToIp(broadcastInt),
      usable,
      total: hosts,
    });
    addHistory({ type: 'subnet', input, result: intToIp(networkInt), timestamp: new Date().toISOString() });
  }, [feedback, input, addHistory, showToast]);

  const setMask = (cidr: string) => {
    feedback();
    const ip = input.split('/')[0] || '192.168.1.0';
    setInput(ip + cidr);
  };

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Calculadora de Subredes</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{input || '192.168.1.0/24'}</div>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ej: 192.168.1.0/24" /></div>
      <div className="grid grid-cols-8 gap-1 mb-3">
        {['/8', '/16', '/24', '/25', '/26', '/27', '/28', '/30'].map(m => (
          <button key={m} className="calc-key small-text" onClick={() => setMask(m)}>{m}</button>
        ))}
      </div>
      <button className="calc-key equals w-full mb-3" onClick={calc}>CALCULAR</button>
      {result && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(result).map(([key, val]) => (
            <div key={key} className="subnet-card">
              <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>{key}</div>
              <div className="font-mono font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{String(val)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// === BOOLEAN ===
export function Boolean({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [truthTable, setTruthTable] = useState<string[][]>([]);
  const feedback = useFeedback(config);

  const addChar = (c: string) => {
    feedback();
    if (c === 'back') setInput(p => p.slice(0, -1));
    else if (c === 'C') setInput('');
    else setInput(p => p + c);
  };

  const simplify = useCallback(() => {
    feedback();
    let expr = input.toUpperCase().replace(/\s/g, '');
    expr = expr.replace(/A\+A'/g, '1').replace(/A'\+A/g, '1');
    expr = expr.replace(/A\*A'/g, '0').replace(/A'\*A/g, '0');
    expr = expr.replace(/A\+A/g, 'A').replace(/A\*A/g, 'A');
    expr = expr.replace(/B\+B'/g, '1').replace(/B'\+B/g, '1');
    expr = expr.replace(/B\*B'/g, '0').replace(/B'\*B/g, '0');
    expr = expr.replace(/B\+B/g, 'B').replace(/B\*B/g, 'B');
    expr = expr.replace(/A\+1/g, '1').replace(/1\+A/g, '1');
    expr = expr.replace(/A\*1/g, 'A').replace(/1\*A/g, 'A');
    expr = expr.replace(/A\+0/g, 'A').replace(/0\+A/g, 'A');
    expr = expr.replace(/A\*0/g, '0').replace(/0\*A/g, '0');
    setResult(expr);

    // Generate truth table
    const vars = [...new Set(input.toUpperCase().match(/[A-C]/g) || [])].sort();
    if (vars.length > 0 && vars.length <= 3) {
      const rows: string[][] = [];
      const n = Math.pow(2, vars.length);
      for (let i = 0; i < n; i++) {
        const row: string[] = [];
        vars.forEach((_, idx) => {
          row.push(((i >> (vars.length - 1 - idx)) & 1).toString());
        });
        row.push('?');
        rows.push(row);
      }
      setTruthTable(rows);
    }
    addHistory({ type: 'boolean', input, result: expr, timestamp: new Date().toISOString() });
  }, [feedback, input, addHistory]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Álgebra Booleana</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result || input || 'A + B'}</div>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ej: A+B, A*B', (A+B)*C" /></div>
      <div className="grid grid-cols-5 gap-1 mb-3">
        {['A', 'B', 'C', '+', '*', "'", '(', ')', 'back', 'C'].map(k => (
          <button key={k} className={`calc-key ${k === 'C' ? 'action' : ''}`} onClick={() => addChar(k)}>{k === 'back' ? '←' : k}</button>
        ))}
      </div>
      <button className="calc-key equals w-full mb-3" onClick={simplify}>SIMPLIFICAR</button>
      {truthTable.length > 0 && (
        <table className="truth-table w-full">
          <thead><tr>{[...new Set(input.toUpperCase().match(/[A-C]/g) || [])].sort().map(v => <th key={v}>{v}</th>)}<th>Out</th></tr></thead>
          <tbody>{truthTable.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

// === HAMMING ===
export function Hamming({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [parity, setParity] = useState<'even' | 'odd'>('even');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    if (!/^[01]+$/.test(input)) { showToast('Solo 0 y 1'); return; }

    if (mode === 'encode') {
      const res = hammingEncode(input, parity);
      setResult({ encoded: res });
      addHistory({ type: 'hamming', mode: 'encode', hammingMode: 'encode', parityType: parity, input, result: res, timestamp: new Date().toISOString() });
    } else {
      const res = hammingDecode(input, parity);
      setResult(res);
      addHistory({ type: 'hamming', mode: 'decode', hammingMode: 'decode', parityType: parity, input, result: res.result, timestamp: new Date().toISOString() });
    }
  }, [feedback, mode, parity, input, addHistory, showToast]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Código de Hamming</div>
      <div className="calc-display">
        <div className="text-right text-xl font-bold" style={{ color: 'var(--display-text)' }}>{result?.encoded || result?.result || '0'}</div>
      </div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${mode === 'encode' ? 'selected' : ''}`} onClick={() => setMode('encode')}>Codificar</button>
        <button className={`flex-1 calc-key small-text ${mode === 'decode' ? 'selected' : ''}`} onClick={() => setMode('decode')}>Decodificar</button>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ej: 1011" /></div>
      <div className="flex gap-2 mb-3">
        <button className={`flex-1 calc-key small-text ${parity === 'even' ? 'selected' : ''}`} onClick={() => setParity('even')}>Par (Even)</button>
        <button className={`flex-1 calc-key small-text ${parity === 'odd' ? 'selected' : ''}`} onClick={() => setParity('odd')}>Impar (Odd)</button>
      </div>
      <button className="calc-key equals w-full" onClick={calc}>PROCESAR</button>
      {result?.encoded && (
        <div className="flex flex-wrap justify-center gap-1 mt-3">
          {result.encoded.split('').map((b: string, i: number) => {
            const pos = result.encoded.length - i;
            const isParity = ((pos) & ((pos) - 1)) === 0;
            return <div key={i} className={`bit ${b === '1' ? 'active' : 'inactive'}`} style={isParity ? { border: '2px solid orange' } : {}} title={isParity ? 'Parity' : 'Data'}>{b}</div>;
          })}
        </div>
      )}
    </div>
  );
}

// === CRC ===
export function Crc({ config, addHistory, showToast }: { config: Config; addHistory: (i: HistoryItem) => void; showToast: (m: string) => void }) {
  const [type, setType] = useState('CRC-8');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const feedback = useFeedback(config);

  const calc = useCallback(() => {
    feedback();
    let data = input.replace(/\s/g, '');
    if (!/^[01]+$/.test(data) && /^[0-9A-Fa-f]+$/.test(data)) {
      data = data.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
    }
    if (!/^[01]+$/.test(data)) { showToast('Binario o Hex'); return; }

    const crc = calculateCRC(data, type);
    setResult(`CRC: ${crc} | Datos+CRC: ${data}${crc}`);
    addHistory({ type: 'crc', crcType: type, input: data, result: crc, timestamp: new Date().toISOString() });
  }, [feedback, type, input, addHistory, showToast]);

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>CRC - Cyclic Redundancy Check</div>
      <div className="calc-display">
        <div className="text-right text-lg font-bold break-all" style={{ color: 'var(--display-text)' }}>{result || '0'}</div>
      </div>
      <div className="mb-2"><input className="quick-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ej: 1101011011" /></div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {['CRC-8', 'CRC-16', 'CRC-32'].map(t => (
          <button key={t} className={`calc-key small-text ${type === t ? 'selected' : ''}`} onClick={() => { feedback(); setType(t); }}>{t}</button>
        ))}
      </div>
      <button className="calc-key equals w-full" onClick={calc}>CALCULAR CRC</button>
    </div>
  );
}
