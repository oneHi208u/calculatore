// ==========================================
// CASIO fx-991CW - Calculadora científica completa
// ==========================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Config } from '../../types';
import { useFeedback } from '../../hooks';
import { copyToClipboard } from '../../utils';

type Mode = 'calc' | 'stat' | 'eq' | 'matrix' | 'table' | 'complex' | 'base' | 'vector';

const MODES: { id: Mode; label: string; icon: string }[] = [
  { id: 'calc', label: 'Calc', icon: '🧮' },
  { id: 'stat', label: 'Stat', icon: '📊' },
  { id: 'eq', label: 'Eq', icon: '⚖️' },
  { id: 'matrix', label: 'Mat', icon: '🔢' },
  { id: 'table', label: 'Table', icon: '📈' },
  { id: 'complex', label: 'Cplx', icon: 'ℹ️' },
  { id: 'base', label: 'Base', icon: '🔣' },
  { id: 'vector', label: 'Vec', icon: '↗️' },
];

interface Props {
  config: Config;
  showToast: (msg: string) => void;
}

export default function Casio({ config, showToast }: Props) {
  const [mode, setMode] = useState<Mode>('calc');
  const [display, setDisplay] = useState('0');
  const [prevDisplay, setPrevDisplay] = useState('');
  const [shift, setShift] = useState(false);
  const [alpha, setAlpha] = useState(false);
  const [expr, setExpr] = useState('');
  const [memory, setMemory] = useState<number>(0);
  const [ans, setAns] = useState<number>(0);
  const [degMode, setDegMode] = useState<'DEG' | 'RAD' | 'GRAD'>('DEG');
  const [statData, setStatData] = useState<number[]>([]);
  const [eqA, setEqA] = useState('');
  const [eqB, setEqB] = useState('');
  const [eqC, setEqC] = useState('');
  const [eqResult, setEqResult] = useState('');
  const [matrixA, setMatrixA] = useState<number[][]>([[1, 2], [3, 4]]);
  const [matrixB, setMatrixB] = useState<number[][]>([[5, 6], [7, 8]]);
  const [matrixResult, setMatrixResult] = useState<number[][]>([]);
  const [tableFn, setTableFn] = useState('x^2');
  const [tableRange, setTableRange] = useState({ start: -5, end: 5, step: 1 });
  const [tableData, setTableData] = useState<{ x: number; y: number }[]>([]);
  const [baseN, setBaseN] = useState(10);
  const [baseInput, setBaseInput] = useState('');
  const [baseResult, setBaseResult] = useState<{ bin: string; oct: string; dec: string; hex: string } | null>(null);
  const [complexA, setComplexA] = useState('3+4i');
  const [complexB, setComplexB] = useState('1+2i');
  const [complexOp, setComplexOp] = useState<'+' | '-' | '*' | '/'>('+');
  const [complexResult, setComplexResult] = useState('');
  const [vectorA, setVectorA] = useState('1,2,3');
  const [vectorB, setVectorB] = useState('4,5,6');
  const [vectorOp, setVectorOp] = useState<'dot' | 'cross' | 'add'>('dot');
  const [vectorResult, setVectorResult] = useState('');

  const feedback = useFeedback(config);
  const displayRef = useRef<HTMLDivElement>(null);

  // Auto-scroll display
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollLeft = displayRef.current.scrollWidth;
    }
  }, [display]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (/^[0-9]$/.test(key)) press(key);
      else if (key === '.') press('.');
      else if (key === '+') press('+');
      else if (key === '-') press('-');
      else if (key === '*') press('×');
      else if (key === '/') press('÷');
      else if (key === '(') press('(');
      else if (key === ')') press(')');
      else if (key === '^') press('^');
      else if (key === 'Enter') press('=');
      else if (key === 'Backspace') press('DEL');
      else if (key === 'Escape') press('AC');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expr, display, mode]);

  const press = useCallback((key: string) => {
    feedback();

    if (key === 'SHIFT') { setShift(s => !s); setAlpha(false); return; }
    if (key === 'ALPHA') { setAlpha(a => !a); setShift(false); return; }
    if (key === 'SETUP') { setDegMode(d => d === 'DEG' ? 'RAD' : d === 'RAD' ? 'GRAD' : 'DEG'); return; }

    if (mode === 'base') {
      handleBaseKey(key);
      return;
    }
    if (mode === 'stat') {
      handleStatKey(key);
      return;
    }
    if (mode === 'eq') {
      handleEqKey(key);
      return;
    }
    if (mode === 'matrix') {
      handleMatrixKey(key);
      return;
    }
    if (mode === 'table') {
      handleTableKey(key);
      return;
    }
    if (mode === 'complex') {
      handleComplexKey(key);
      return;
    }
    if (mode === 'vector') {
      handleVectorKey(key);
      return;
    }

    // Main calc mode
    if (key === 'AC') {
      setDisplay('0'); setExpr(''); setPrevDisplay(''); setShift(false); setAlpha(false); return;
    }
    if (key === 'DEL') {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
      setExpr(e => e.slice(0, -1));
      return;
    }
    if (key === '=') {
      calculate();
      return;
    }
    if (key === 'Ans') {
      setDisplay(d => d === '0' ? 'Ans' : d + 'Ans');
      setExpr(e => e + ans.toString());
      return;
    }
    if (key === 'M+') {
      try {
        const val = evaluate(expr || display);
        setMemory(m => m + val);
        showToast(`M+ ${val}`);
      } catch {}
      return;
    }
    if (key === 'M-') {
      try {
        const val = evaluate(expr || display);
        setMemory(m => m - val);
        showToast(`M- ${val}`);
      } catch {}
      return;
    }
    if (key === 'MR') {
      setDisplay(memory.toString());
      setExpr(memory.toString());
      return;
    }
    if (key === 'MC') {
      setMemory(0);
      showToast('MC');
      return;
    }
    if (key === 'STO') {
      try {
        const val = evaluate(expr || display);
        setMemory(val);
        showToast(`M = ${val}`);
      } catch {}
      return;
    }

    // Functions with shift
    if (shift) {
      const shifted: Record<string, string> = {
        'sin': 'asin', 'cos': 'acos', 'tan': 'atan',
        'ln': 'e^', 'log': '10^', '√': 'x²',
        'x²': 'x³', '^': '√', '(': '{', ')': '}',
        'π': 'e', 'RCL': 'STO',
      };
      key = shifted[key] || key;
      setShift(false);
    }

    // Trig functions with angle conversion
    if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan'].includes(key)) {
      setDisplay(d => d === '0' ? key + '(' : d + key + '(');
      setExpr(e => e + key + '(');
      return;
    }

    if (['ln', 'log', 'e^', '10^', '√', 'x²', 'x³', 'abs', 'fac'].includes(key)) {
      setDisplay(d => d === '0' ? key + '(' : d + key + '(');
      setExpr(e => e + key + '(');
      return;
    }

    if (key === 'π') {
      setDisplay(d => d === '0' ? 'π' : d + 'π');
      setExpr(e => e + Math.PI.toString());
      return;
    }
    if (key === 'e') {
      setDisplay(d => d === '0' ? 'e' : d + 'e');
      setExpr(e => e + Math.E.toString());
      return;
    }
    if (key === 'Rand') {
      const r = Math.random();
      setDisplay(r.toFixed(6));
      setExpr(r.toString());
      return;
    }
    if (key === 'EXP') {
      setDisplay(d => d + 'E');
      setExpr(e => e + 'e');
      return;
    }
    if (key === '±') {
      setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d);
      return;
    }
    if (key === '1/x') {
      setDisplay(prev => '1/(' + prev + ')');
      setExpr(prevExpr => '1/(' + (prevExpr || display) + ')');
      return;
    }

    // Normal keys
    if (display === '0' && !['+', '-', '×', '÷', '^', ')', '.'].includes(key)) {
      setDisplay(key);
    } else {
      setDisplay(d => d + key);
    }
    setExpr(e => e + (key === '×' ? '*' : key === '÷' ? '/' : key === '^' ? '**' : key === 'π' ? Math.PI.toString() : key === 'e' ? Math.E.toString() : key === 'π' ? Math.PI.toString() : key));
  }, [feedback, expr, display, mode, shift, alpha, ans, memory]);

  const evaluate = (expression: string): number => {
    if (!expression) return 0;
    let e = expression
      .replace(/\^\^/g, '**')
      .replace(/asin\(/g, `Math.asin(`)
      .replace(/acos\(/g, `Math.acos(`)
      .replace(/atan\(/g, `Math.atan(`)
      .replace(/sin\(/g, `Math.sin(${degMode === 'DEG' ? 'Math.PI/180*' : degMode === 'GRAD' ? 'Math.PI/200*' : ''}`)
      .replace(/cos\(/g, `Math.cos(${degMode === 'DEG' ? 'Math.PI/180*' : degMode === 'GRAD' ? 'Math.PI/200*' : ''}`)
      .replace(/tan\(/g, `Math.tan(${degMode === 'DEG' ? 'Math.PI/180*' : degMode === 'GRAD' ? 'Math.PI/200*' : ''}`)
      .replace(/ln\(/g, `Math.log(`)
      .replace(/log\(/g, `Math.log10(`)
      .replace(/e\^\(/g, `Math.exp(`)
      .replace(/10\^\(/g, `(10**`)
      .replace(/√\(/g, `Math.sqrt(`)
      .replace(/x²\(/g, `(**2)`)
      .replace(/x³\(/g, `(**3)`)
      .replace(/abs\(/g, `Math.abs(`)
      .replace(/fac\(/g, `factorial(`)
      .replace(/Ans/g, ans.toString());

    // Custom factorial
    const factorial = (n: number): number => {
      if (n < 0) return NaN;
      if (n <= 1) return 1;
      let result = 1;
      for (let i = 2; i <= n; i++) result *= i;
      return result;
    };

    try {
      // eslint-disable-next-line no-new-func
      return new Function('Math', 'factorial', `return ${e}`)(Math, factorial);
    } catch {
      return NaN;
    }
  };

  const calculate = useCallback(() => {
    try {
      const result = evaluate(expr || display);
      if (isNaN(result)) {
        setDisplay('Syntax ERROR');
        setTimeout(() => setDisplay('0'), 1500);
        return;
      }
      setPrevDisplay(display + ' =');
      const formatted = Math.abs(result) < 1e10 && Math.abs(result) > 1e-10
        ? parseFloat(result.toPrecision(12)).toString()
        : result.toExponential(6);
      setDisplay(formatted);
      setExpr(formatted);
      setAns(result);
    } catch {
      setDisplay('Math ERROR');
      setTimeout(() => setDisplay('0'), 1500);
    }
  }, [expr, display, ans]);

  // === Sub-mode handlers ===
  const handleBaseKey = (key: string) => {
    if (key === 'AC') { setBaseInput(''); setBaseResult(null); return; }
    if (key === 'DEL') { setBaseInput(p => p.slice(0, -1)); return; }
    if (key === '=') {
      const valid = baseN === 2 ? /^[01]+$/ : baseN === 8 ? /^[0-7]+$/ : baseN === 10 ? /^\d+$/ : /^[0-9A-Fa-f]+$/;
      if (!valid.test(baseInput)) return;
      const dec = parseInt(baseInput, baseN);
      setBaseResult({ bin: dec.toString(2), oct: dec.toString(8), dec: dec.toString(), hex: dec.toString(16).toUpperCase() });
      return;
    }
    if (['BIN', 'OCT', 'DEC', 'HEX'].includes(key)) {
      setBaseN(key === 'BIN' ? 2 : key === 'OCT' ? 8 : key === 'DEC' ? 10 : 16);
      setBaseInput(''); setBaseResult(null);
      return;
    }
    const validChars = baseN === 2 ? '01' : baseN === 8 ? '01234567' : baseN === 10 ? '0123456789' : '0123456789ABCDEF';
    if (validChars.includes(key.toUpperCase())) {
      setBaseInput(p => p + key.toUpperCase());
    }
  };

  const handleStatKey = (key: string) => {
    if (key === 'AC') { setStatData([]); setDisplay('0'); return; }
    if (key === 'DATA') {
      try {
        const val = parseFloat(display);
        if (!isNaN(val)) {
          setStatData(d => [...d, val]);
          setDisplay('0');
          showToast(`Dato ${val} agregado`);
        }
      } catch {}
      return;
    }
    if (key === 'DEL') {
      setStatData(d => d.slice(0, -1));
      return;
    }
    if (key === 'n') { setDisplay(statData.length.toString()); return; }
    if (key === 'Σx') { setDisplay(statData.reduce((a, b) => a + b, 0).toString()); return; }
    if (key === 'Σx²') { setDisplay(statData.reduce((a, b) => a + b * b, 0).toString()); return; }
    if (key === 'x̄') { setDisplay((statData.reduce((a, b) => a + b, 0) / (statData.length || 1)).toString()); return; }
    if (key === 'σn') {
      const mean = statData.reduce((a, b) => a + b, 0) / (statData.length || 1);
      const variance = statData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (statData.length || 1);
      setDisplay(Math.sqrt(variance).toString());
      return;
    }
    if (key === 'σn-1') {
      const mean = statData.reduce((a, b) => a + b, 0) / (statData.length || 1);
      const variance = statData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / Math.max(statData.length - 1, 1);
      setDisplay(Math.sqrt(variance).toString());
      return;
    }
    if (key === 'min') { setDisplay(Math.min(...statData).toString()); return; }
    if (key === 'max') { setDisplay(Math.max(...statData).toString()); return; }
    // Normal number input for stat
    if (/^[0-9.]$/.test(key)) {
      setDisplay(d => d === '0' ? key : d + key);
    }
  };

  const handleEqKey = (key: string) => {
    if (key === 'AC') { setEqA(''); setEqB(''); setEqC(''); setEqResult(''); return; }
    if (key === 'a') { setDisplay(eqA); return; }
    if (key === 'b') { setDisplay(eqB); return; }
    if (key === 'c') { setDisplay(eqC); return; }
    if (key === 'SOLVE') {
      try {
        const a = parseFloat(eqA);
        const b = parseFloat(eqB);
        const c = parseFloat(eqC);
        if (isNaN(a) || isNaN(b) || isNaN(c)) return;
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
          setEqResult(`x = (${-b/(2*a)}) ± (${Math.sqrt(-discriminant)/(2*a)})i`);
        } else {
          const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
          const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
          setEqResult(`x₁ = ${x1.toFixed(6)}\nx₂ = ${x2.toFixed(6)}`);
        }
      } catch {}
      return;
    }
    if (key === 'STO') {
      if (eqA === '') setEqA(display);
      else if (eqB === '') setEqB(display);
      else setEqC(display);
      showToast(`Guardado`);
      return;
    }
    if (/^[0-9.-]$/.test(key)) {
      setDisplay(d => d === '0' ? key : d + key);
    }
  };

  const handleMatrixKey = (key: string) => {
    if (key === 'AC') { setMatrixResult([]); return; }
    if (key === 'A') { setDisplay('MatA'); return; }
    if (key === 'B') { setDisplay('MatB'); return; }
    if (key === '+') {
      const res = matrixA.map((row, i) => row.map((val, j) => val + matrixB[i][j]));
      setMatrixResult(res);
      return;
    }
    if (key === '-') {
      const res = matrixA.map((row, i) => row.map((val, j) => val - matrixB[i][j]));
      setMatrixResult(res);
      return;
    }
    if (key === '×') {
      const res = matrixA.map((row, i) =>
        matrixB[0].map((_, j) => row.reduce((sum, _, k) => sum + matrixA[i][k] * matrixB[k][j], 0))
      );
      setMatrixResult(res);
      return;
    }
    if (key === 'Det') {
      const det = matrixA[0][0] * matrixA[1][1] - matrixA[0][1] * matrixA[1][0];
      setDisplay(det.toString());
      return;
    }
    if (key === 'Inv') {
      const det = matrixA[0][0] * matrixA[1][1] - matrixA[0][1] * matrixA[1][0];
      if (det === 0) { setDisplay('Math ERROR'); return; }
      const inv = [[matrixA[1][1] / det, -matrixA[0][1] / det], [-matrixA[1][0] / det, matrixA[0][0] / det]];
      setMatrixResult(inv);
      return;
    }
  };

  const handleTableKey = (key: string) => {
    if (key === 'AC') { setTableData([]); return; }
    if (key === 'SET') {
      setTableFn(display);
      return;
    }
    if (key === 'TABLE') {
      const data: { x: number; y: number }[] = [];
      for (let x = tableRange.start; x <= tableRange.end; x += tableRange.step) {
        try {
          const e = tableFn.replace(/x/g, x.toString());
          // eslint-disable-next-line no-new-func
          const y = new Function('Math', `return ${e}`)(Math);
          data.push({ x, y: isNaN(y) ? 0 : y });
        } catch { data.push({ x, y: 0 }); }
      }
      setTableData(data);
      return;
    }
    if (/^[0-9.]$/.test(key)) {
      setDisplay(d => d === '0' ? key : d + key);
    }
  };

  const handleComplexKey = (key: string) => {
    if (key === 'AC') { setComplexResult(''); return; }
    if (key === '=') {
      try {
        const parseComplex = (s: string) => {
          const match = s.match(/^([+-]?\d+\.?\d*)([+-]\d+\.?\d*)i$/);
          if (match) return { re: parseFloat(match[1]), im: parseFloat(match[2]) };
          return { re: parseFloat(s) || 0, im: 0 };
        };
        const a = parseComplex(complexA);
        const b = parseComplex(complexB);
        let re = 0, im = 0;
        switch (complexOp) {
          case '+': re = a.re + b.re; im = a.im + b.im; break;
          case '-': re = a.re - b.re; im = a.im - b.im; break;
          case '*': re = a.re * b.re - a.im * b.im; im = a.re * b.im + a.im * b.re; break;
          case '/':
            const denom = b.re * b.re + b.im * b.im;
            re = (a.re * b.re + a.im * b.im) / denom;
            im = (a.im * b.re - a.re * b.im) / denom;
            break;
        }
        const sign = im >= 0 ? '+' : '-';
        setComplexResult(`${re.toFixed(4)} ${sign} ${Math.abs(im).toFixed(4)}i`);
      } catch { setComplexResult('Error'); }
      return;
    }
    if (['+', '-', '*', '/'].includes(key)) {
      setComplexOp(key as any);
      return;
    }
  };

  const handleVectorKey = (key: string) => {
    if (key === 'AC') { setVectorResult(''); return; }
    if (key === '=') {
      try {
        const a = vectorA.split(',').map(Number);
        const b = vectorB.split(',').map(Number);
        if (vectorOp === 'dot') {
          const dot = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
          setVectorResult(dot.toString());
        } else if (vectorOp === 'cross') {
          if (a.length === 3 && b.length === 3) {
            const cross = [
              a[1] * b[2] - a[2] * b[1],
              a[2] * b[0] - a[0] * b[2],
              a[0] * b[1] - a[1] * b[0],
            ];
            setVectorResult(`[${cross.join(', ')}]`);
          } else {
            setVectorResult('Solo 3D');
          }
        } else {
          const add = a.map((val, i) => val + (b[i] || 0));
          setVectorResult(`[${add.join(', ')}]`);
        }
      } catch { setVectorResult('Error'); }
      return;
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-1 p-2 rounded-xl overflow-x-auto" style={{ background: 'var(--panel-bg)' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              mode === m.id ? 'bg-white/10 text-white border border-orange-400' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => { feedback(); setMode(m.id); setDisplay('0'); setExpr(''); setShift(false); setAlpha(false); }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Casio Body */}
      <div className="casio-body max-w-xl mx-auto">
        {/* Brand */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs tracking-widest uppercase">CASIO</div>
          <div className="text-gray-500 text-xs">fx-991CW</div>
        </div>

        {/* Status indicators */}
        <div className="flex gap-2 mb-2 text-xs">
          {shift && <span className="text-yellow-400 font-bold">S</span>}
          {alpha && <span className="text-blue-400 font-bold">A</span>}
          <span className="text-gray-400">{degMode}</span>
          <span className="text-gray-400">M={memory !== 0 ? 'SET' : ''}</span>
        </div>

        {/* Display */}
        <div className="casio-screen mb-4">
          <div className="text-xs text-gray-600 mb-1 h-4">{prevDisplay}</div>
          <div ref={displayRef} className="text-right text-2xl font-bold overflow-x-auto whitespace-nowrap" style={{ color: '#1a1c18' }}>
            {display}
          </div>
        </div>

        {/* Mode-specific controls */}
        {mode === 'base' && (
          <div className="mb-3 flex gap-2">
            {[{ l: 'BIN', n: 2 }, { l: 'OCT', n: 8 }, { l: 'DEC', n: 10 }, { l: 'HEX', n: 16 }].map(b => (
              <button key={b.l} className={`flex-1 casio-key small-text ${baseN === b.n ? 'bg-blue-600' : ''}`} onClick={() => press(b.l)}>{b.l}</button>
            ))}
          </div>
        )}

        {mode === 'stat' && (
          <div className="mb-3 grid grid-cols-4 gap-1">
            <button className="casio-key small-text text-xs" onClick={() => press('DATA')}>DATA</button>
            <button className="casio-key small-text text-xs" onClick={() => press('Σx')}>Σx</button>
            <button className="casio-key small-text text-xs" onClick={() => press('x̄')}>x̄</button>
            <button className="casio-key small-text text-xs" onClick={() => press('σn')}>σn</button>
          </div>
        )}

        {mode === 'eq' && (
          <div className="mb-3 grid grid-cols-3 gap-1">
            <button className={`casio-key small-text ${eqA ? 'bg-blue-600' : ''}`} onClick={() => press('a')}>a={eqA || '?'}</button>
            <button className={`casio-key small-text ${eqB ? 'bg-blue-600' : ''}`} onClick={() => press('b')}>b={eqB || '?'}</button>
            <button className={`casio-key small-text ${eqC ? 'bg-blue-600' : ''}`} onClick={() => press('c')}>c={eqC || '?'}</button>
          </div>
        )}

        {mode === 'matrix' && (
          <div className="mb-3 grid grid-cols-3 gap-1">
            <button className="casio-key small-text" onClick={() => press('A')}>MatA</button>
            <button className="casio-key small-text" onClick={() => press('B')}>MatB</button>
            <button className="casio-key small-text" onClick={() => press('Det')}>Det</button>
          </div>
        )}

        {mode === 'table' && (
          <div className="mb-3 flex gap-2">
            <input className="flex-1 p-2 rounded bg-gray-700 text-white text-sm font-mono" value={tableFn} onChange={e => setTableFn(e.target.value)} />
            <button className="casio-key" onClick={() => press('TABLE')}>TABLE</button>
          </div>
        )}

        {mode === 'complex' && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input className="p-2 rounded bg-gray-700 text-white text-sm font-mono" value={complexA} onChange={e => setComplexA(e.target.value)} placeholder="a+bi" />
            <input className="p-2 rounded bg-gray-700 text-white text-sm font-mono" value={complexB} onChange={e => setComplexB(e.target.value)} placeholder="c+di" />
            <div className="flex gap-1">
              {['+', '-', '*', '/'].map(o => (
                <button key={o} className={`flex-1 casio-key small-text ${complexOp === o ? 'bg-blue-600' : ''}`} onClick={() => press(o)}>{o}</button>
              ))}
            </div>
            <div className="text-sm text-white font-mono">{complexResult}</div>
          </div>
        )}

        {mode === 'vector' && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input className="p-2 rounded bg-gray-700 text-white text-sm font-mono" value={vectorA} onChange={e => setVectorA(e.target.value)} placeholder="1,2,3" />
            <input className="p-2 rounded bg-gray-700 text-white text-sm font-mono" value={vectorB} onChange={e => setVectorB(e.target.value)} placeholder="4,5,6" />
            <div className="flex gap-1">
              {[{ l: 'dot', v: 'dot' }, { l: '×', v: 'cross' }, { l: '+', v: 'add' }].map(o => (
                <button key={o.v} className={`flex-1 casio-key small-text ${vectorOp === o.v ? 'bg-blue-600' : ''}`} onClick={() => setVectorOp(o.v as any)}>{o.l}</button>
              ))}
            </div>
            <div className="text-sm text-white font-mono">{vectorResult}</div>
          </div>
        )}

        {/* Main Keypad */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {/* Row 1 - Functions */}
          <button className={`casio-key func ${shift ? 'bg-yellow-600' : ''}`} onClick={() => press('SHIFT')}>SHIFT</button>
          <button className={`casio-key alpha ${alpha ? 'bg-blue-600' : ''}`} onClick={() => press('ALPHA')}>ALPHA</button>
          <button className="casio-key func" onClick={() => press('SETUP')}>SETUP</button>
          <button className="casio-key action" onClick={() => press('AC')}>AC</button>
          <button className="casio-key action" onClick={() => press('DEL')}>DEL</button>

          {/* Row 2 */}
          <button className="casio-key func" onClick={() => press('sin')}>{shift ? 'asin' : 'sin'}</button>
          <button className="casio-key func" onClick={() => press('cos')}>{shift ? 'acos' : 'cos'}</button>
          <button className="casio-key func" onClick={() => press('tan')}>{shift ? 'atan' : 'tan'}</button>
          <button className="casio-key func" onClick={() => press('ln')}>{shift ? 'e^x' : 'ln'}</button>
          <button className="casio-key func" onClick={() => press('log')}>{shift ? '10^x' : 'log'}</button>

          {/* Row 3 */}
          <button className="casio-key func" onClick={() => press('√')}>{shift ? 'x²' : '√'}</button>
          <button className="casio-key func" onClick={() => press('^')}>{shift ? '√' : '^'}</button>
          <button className="casio-key func" onClick={() => press('(')}>{shift ? '{' : '('}</button>
          <button className="casio-key func" onClick={() => press(')')}>{shift ? '}' : ')'}</button>
          <button className="casio-key func" onClick={() => press('1/x')}>1/x</button>

          {/* Row 4 */}
          <button className="casio-key func" onClick={() => press('π')}>{shift ? 'e' : 'π'}</button>
          <button className="casio-key func" onClick={() => press('EXP')}>EXP</button>
          <button className="casio-key func" onClick={() => press('x²')}>{shift ? 'x³' : 'x²'}</button>
          <button className="casio-key func" onClick={() => press('±')}>±</button>
          <button className="casio-key func" onClick={() => press('Rand')}>Ran#</button>

          {/* Row 5 - Numbers */}
          <button className="casio-key num" onClick={() => press('7')}>7</button>
          <button className="casio-key num" onClick={() => press('8')}>8</button>
          <button className="casio-key num" onClick={() => press('9')}>9</button>
          <button className="casio-key func" onClick={() => press('STO')}>STO</button>
          <button className="casio-key func" onClick={() => press('RCL')}>{shift ? 'STO' : 'RCL'}</button>

          <button className="casio-key num" onClick={() => press('4')}>4</button>
          <button className="casio-key num" onClick={() => press('5')}>5</button>
          <button className="casio-key num" onClick={() => press('6')}>6</button>
          <button className="casio-key operator" onClick={() => press('×')}>×</button>
          <button className="casio-key operator" onClick={() => press('÷')}>÷</button>

          <button className="casio-key num" onClick={() => press('1')}>1</button>
          <button className="casio-key num" onClick={() => press('2')}>2</button>
          <button className="casio-key num" onClick={() => press('3')}>3</button>
          <button className="casio-key operator" onClick={() => press('+')}>+</button>
          <button className="casio-key operator" onClick={() => press('-')}>−</button>

          <button className="casio-key num" onClick={() => press('0')}>0</button>
          <button className="casio-key num" onClick={() => press('.')}>.</button>
          <button className="casio-key func" onClick={() => press('Ans')}>Ans</button>
          <button className="casio-key func" onClick={() => press('M+')}>M+</button>
          <button className="casio-key execute" onClick={() => press('=')}>=</button>
        </div>

        {/* Extra function keys */}
        <div className="grid grid-cols-5 gap-2 mt-2">
          <button className="casio-key func text-xs" onClick={() => press('MR')}>MR</button>
          <button className="casio-key func text-xs" onClick={() => press('M-')}>M−</button>
          <button className="casio-key func text-xs" onClick={() => press('MC')}>MC</button>
          <button className="casio-key func text-xs" onClick={() => press('abs')}>|x|</button>
          <button className="casio-key func text-xs" onClick={() => press('fac')}>x!</button>
        </div>
      </div>

      {/* Results panels for sub-modes */}
      {mode === 'eq' && eqResult && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Resultado Ecuación</div>
          <div className="text-lg font-mono text-center whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>{eqResult}</div>
        </div>
      )}

      {mode === 'matrix' && matrixResult.length > 0 && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Resultado Matriz</div>
          <table className="w-full text-center">
            <tbody>
              {matrixResult.map((row, i) => (
                <tr key={i}>{row.map((val, j) => <td key={j} className="p-2 font-mono" style={{ color: 'var(--text-primary)' }}>{val.toFixed(4)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === 'table' && tableData.length > 0 && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Tabla de Valores: {tableFn}</div>
          <div className="grid grid-cols-2 gap-1 max-h-60 overflow-y-auto">
            <div className="font-bold text-center p-1" style={{ color: 'var(--accent-orange)' }}>x</div>
            <div className="font-bold text-center p-1" style={{ color: 'var(--accent-orange)' }}>f(x)</div>
            {tableData.map((d, i) => (
              <>
                <div key={`x${i}`} className="text-center p-1 font-mono" style={{ color: 'var(--text-primary)' }}>{d.x.toFixed(2)}</div>
                <div key={`y${i}`} className="text-center p-1 font-mono" style={{ color: 'var(--text-primary)' }}>{typeof d.y === 'number' ? d.y.toFixed(4) : '0'}</div>
              </>
            ))}
          </div>
        </div>
      )}

      {mode === 'base' && baseResult && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Resultados Paralelos</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="parallel-item"><span className="font-bold">BIN</span><span>{baseResult.bin}</span></div>
            <div className="parallel-item"><span className="font-bold">OCT</span><span>{baseResult.oct}</span></div>
            <div className="parallel-item"><span className="font-bold">DEC</span><span>{baseResult.dec}</span></div>
            <div className="parallel-item"><span className="font-bold">HEX</span><span>{baseResult.hex}</span></div>
          </div>
        </div>
      )}

      {mode === 'stat' && statData.length > 0 && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Datos Estadísticos ({statData.length})</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {statData.map((d, i) => (
              <span key={i} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)' }}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
