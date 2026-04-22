// ==========================================
// CALC BASE - Calculadora multibase con resultados paralelos
// ==========================================

import { useState, useCallback, useRef } from 'react';
import type { Config, HistoryItem } from '../../types';
import { useFeedback } from '../../hooks';
import { validateInput, copyToClipboard } from '../../utils';

type System = 'bin' | 'oct' | 'dec' | 'hex';
type Op = 'add' | 'sub' | 'mul' | 'div';

const SYSTEMS: { id: System; label: string; base: number; validChars: string }[] = [
  { id: 'bin', label: 'BIN', base: 2, validChars: '01' },
  { id: 'oct', label: 'OCT', base: 8, validChars: '01234567' },
  { id: 'dec', label: 'DEC', base: 10, validChars: '0123456789' },
  { id: 'hex', label: 'HEX', base: 16, validChars: '0123456789ABCDEF' },
];

const OPS: { id: Op; label: string; symbol: string }[] = [
  { id: 'add', label: '+', symbol: '+' },
  { id: 'sub', label: '−', symbol: '−' },
  { id: 'mul', label: '×', symbol: '×' },
  { id: 'div', label: '÷', symbol: '÷' },
];

interface Props {
  config: Config;
  addHistory: (item: HistoryItem) => void;
  showToast: (msg: string) => void;
}

export default function CalcBase({ config, addHistory, showToast }: Props) {
  const [system, setSystem] = useState<System>('bin');
  const [op, setOp] = useState<Op>('add');
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [currentNum, setCurrentNum] = useState(1);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const [steps, setSteps] = useState('');
  const feedback = useFeedback(config);

  const sys = SYSTEMS.find(s => s.id === system)!;

  const getParallel = useCallback((val: string) => {
    if (!val) return null;
    try {
      const dec = system === 'dec' ? BigInt(val) : BigInt(parseInt(val, sys.base));
      return {
        bin: dec.toString(2),
        oct: dec.toString(8),
        dec: dec.toString(),
        hex: dec.toString(16).toUpperCase(),
      };
    } catch { return null; }
  }, [system, sys.base]);

  const handleKey = useCallback((key: string) => {
    feedback();
    setError('');
    setShowSteps(false);

    if (key === 'back') {
      if (currentNum === 1) setNum1(p => p.slice(0, -1));
      else setNum2(p => p.slice(0, -1));
      return;
    }
    if (key === 'C') {
      setNum1(''); setNum2(''); setCurrentNum(1); setShowSteps(false); setError('');
      return;
    }

    if (!sys.validChars.includes(key.toUpperCase())) {
      setError(`Carácter inválido para ${sys.label}`);
      return;
    }

    if (currentNum === 1) setNum1(p => p + key);
    else setNum2(p => p + key);
  }, [feedback, currentNum, sys.validChars, sys.label]);

  const handleCalculate = useCallback(() => {
    feedback();
    if (currentNum === 1 && num1) {
      setCurrentNum(2);
      return;
    }
    if (!num1 || !num2) return;

    let n1: bigint, n2: bigint;
    try {
      n1 = BigInt(parseInt(num1, sys.base));
      n2 = BigInt(parseInt(num2, sys.base));
    } catch {
      setError('Número inválido');
      return;
    }

    if (op === 'div' && n2 === 0n) { setError('No dividir por cero'); return; }

    let result: bigint;
    switch (op) {
      case 'add': result = n1 + n2; break;
      case 'sub': result = n1 - n2; break;
      case 'mul': result = n1 * n2; break;
      case 'div': result = n1 / n2; break;
    }

    const resultStr = result.toString(sys.base).toUpperCase();

    // Generate steps
    const opSym = OPS.find(o => o.id === op)!.symbol;
    let stepsHtml = `<div style="text-align:right;font-family:monospace;font-size:1.1rem;letter-spacing:3px;"><div>${num1}<sub>${sys.base}</sub></div><div>${opSym} ${num2}<sub>${sys.base}</sub></div><div style="border-top:2px solid #333;margin:5px 0;padding-top:5px;font-weight:bold;">${resultStr}<sub>${sys.base}</sub></div></div>`;
    stepsHtml += `<div style="margin-top:10px;padding:10px;background:#d5f4e6;border-radius:4px;"><strong>Decimal:</strong> ${n1} ${opSym} ${n2} = ${result}</div>`;

    setSteps(stepsHtml);
    setShowSteps(true);

    addHistory({ type: 'calc', system, operation: op, num1, num2, result: resultStr, timestamp: new Date().toISOString() });

    setNum1(resultStr);
    setNum2('');
    setCurrentNum(1);
    showToast(`= ${resultStr}`);
  }, [feedback, currentNum, num1, num2, op, sys.base, system, addHistory, showToast]);

  const parallel = getParallel(currentNum === 1 ? num1 : num2);
  const currentDisplay = currentNum === 1 ? num1 : num2;
  const opSym = OPS.find(o => o.id === op)!.symbol;

  return (
    <div className="calc-frame">
      <div className="text-center text-xs uppercase tracking-[3px] mb-3" style={{ color: 'var(--text-secondary)' }}>Calculadora Multibase</div>

      {/* Display */}
      <div className="calc-display">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-red)' }}>{sys.label} - {op.toUpperCase()}</span>
          <div className="flex gap-1">
            <button className="text-xs px-1.5 py-0.5 rounded bg-black/20" onClick={() => copyToClipboard(currentDisplay || '0').then(() => showToast('✓ Copiado'))}>📋</button>
          </div>
        </div>
        <div className="text-right text-2xl font-bold overflow-x-auto whitespace-nowrap" style={{ color: 'var(--display-text)' }}>{currentDisplay || '0'}</div>
        <div className="text-right text-sm mt-1" style={{ color: '#5a6358' }}>{num1 ? (currentNum === 1 ? num1 : `${num1} ${opSym} ${num2}`) : 'Listo'}</div>
        {error && <div className="text-center text-sm mt-1 text-red-500">{error}</div>}

        {/* Parallel results */}
        {parallel && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed border-gray-500">
            <div className="parallel-item"><span className="font-bold text-gray-600">BIN</span><span>{parallel.bin.length > 16 ? parallel.bin.slice(0, 13) + '...' : parallel.bin}</span></div>
            <div className="parallel-item"><span className="font-bold text-gray-600">OCT</span><span>{parallel.oct.length > 12 ? parallel.oct.slice(0, 9) + '...' : parallel.oct}</span></div>
            <div className="parallel-item"><span className="font-bold text-gray-600">DEC</span><span>{parallel.dec.length > 12 ? parallel.dec.slice(0, 9) + '...' : parallel.dec}</span></div>
            <div className="parallel-item"><span className="font-bold text-gray-600">HEX</span><span>{parallel.hex.length > 12 ? parallel.hex.slice(0, 9) + '...' : parallel.hex}</span></div>
          </div>
        )}
      </div>

      {/* System selector */}
      <div className="mb-3">
        <div className="section-label">Sistema</div>
        <div className="grid grid-cols-4 gap-2">
          {SYSTEMS.map(s => (
            <button key={s.id} className={`calc-key small-text ${system === s.id ? 'selected' : ''}`} onClick={() => { feedback(); setSystem(s.id); setNum1(''); setNum2(''); setCurrentNum(1); setError(''); setShowSteps(false); }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operation selector */}
      <div className="mb-3">
        <div className="section-label">Operación</div>
        <div className="grid grid-cols-4 gap-2">
          {OPS.map(o => (
            <button key={o.id} className={`calc-key operator ${op === o.id ? 'selected' : ''}`} onClick={() => { feedback(); setOp(o.id); }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="mb-3">
        <div className="section-label">Teclado</div>
        <div className="grid gap-2" style={{ gridTemplateColumns: system === 'hex' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
          {system === 'bin' && (
            <>
              <button className="calc-key" onClick={() => handleKey('1')}>1</button>
              <button className="calc-key" onClick={() => handleKey('0')}>0</button>
              <button className="calc-key action" onClick={() => handleKey('C')}>C</button>
              <button className="calc-key col-span-2" onClick={() => handleKey('back')}>←</button>
              <button className="calc-key equals col-span-1" onClick={handleCalculate}>=</button>
            </>
          )}
          {system === 'oct' && (
            <>
              {['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'].map(k => (
                <button key={k} className="calc-key" onClick={() => handleKey(k)}>{k}</button>
              ))}
              <button className="calc-key action" onClick={() => handleKey('C')}>C</button>
              <button className="calc-key" onClick={() => handleKey('back')}>←</button>
              <button className="calc-key equals" onClick={handleCalculate}>=</button>
            </>
          )}
          {system === 'dec' && (
            <>
              {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(k => (
                <button key={k} className="calc-key" onClick={() => handleKey(k)}>{k}</button>
              ))}
              <button className="calc-key action" onClick={() => handleKey('C')}>C</button>
              <button className="calc-key" onClick={() => handleKey('0')}>0</button>
              <button className="calc-key" onClick={() => handleKey('back')}>←</button>
              <button className="calc-key equals col-span-3" onClick={handleCalculate}>=</button>
            </>
          )}
          {system === 'hex' && (
            <>
              {['7', '8', '9', 'A', '4', '5', '6', 'B', '1', '2', '3', 'C', '0', 'D', 'E', 'F'].map(k => (
                <button key={k} className="calc-key" onClick={() => handleKey(k)}>{k}</button>
              ))}
              <button className="calc-key action" onClick={() => handleKey('C')}>C</button>
              <button className="calc-key col-span-2" onClick={() => handleKey('back')}>←</button>
              <button className="calc-key equals col-span-1" onClick={handleCalculate}>=</button>
            </>
          )}
        </div>
      </div>

      {/* Steps */}
      {showSteps && (
        <div className="steps-panel">
          <div className="steps-header flex justify-between">
            📋 Desarrollo
            <button className="text-xs px-2 py-1 rounded bg-black/20" onClick={() => copyToClipboard(steps.replace(/<[^>]*>/g, '')).then(() => showToast('✓ Copiado'))}>📋 Copiar</button>
          </div>
          <div className="steps-body" dangerouslySetInnerHTML={{ __html: steps }} />
        </div>
      )}
    </div>
  );
}
