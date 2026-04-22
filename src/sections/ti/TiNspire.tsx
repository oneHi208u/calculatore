// ==========================================
// TI-Nspire CX - Calculadora CAS y gráfica
// ==========================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Config } from '../../types';
import { useFeedback } from '../../hooks';

type TiMode = 'calculator' | 'graph' | 'lists' | 'spreadsheet' | 'notes' | 'variables';

const TI_MODES: { id: TiMode; label: string; icon: string }[] = [
  { id: 'calculator', label: 'Calc', icon: '🧮' },
  { id: 'graph', label: 'Graf', icon: '📈' },
  { id: 'lists', label: 'Listas', icon: '📋' },
  { id: 'spreadsheet', label: 'Hoja', icon: '📊' },
  { id: 'notes', label: 'Notas', icon: '📝' },
  { id: 'variables', label: 'Vars', icon: '🔤' },
];

interface Props {
  config: Config;
  showToast: (msg: string) => void;
}

export default function TiNspire({ config, showToast }: Props) {
  const [mode, setMode] = useState<TiMode>('calculator');
  const [calcInput, setCalcInput] = useState('');
  const [calcHistory, setCalcHistory] = useState<{ expr: string; result: string }[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({ a: '5', b: '3', c: '2', x: '10', y: '20' });
  const [graphFn, setGraphFn] = useState('x^2');
  const [graphRange, setGraphRange] = useState({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
  const [lists, setLists] = useState<Record<string, number[]>>({ l1: [1, 2, 3, 4, 5], l2: [2, 4, 6, 8, 10] });
  const [activeList, setActiveList] = useState('l1');
  const [spreadsheet, setSpreadsheet] = useState<(string | number)[][]>([
    ['A', 'B', 'C'],
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ]);
  const [notes, setNotes] = useState('// Notas de TI-Nspire CX\n// Usa esta área para escribir notas\n\nEjemplo:\na = 5\nb = 3\nsum(a+b) = 8');
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  
  const feedback = useFeedback(config);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // CAS-style evaluation
  const evaluate = useCallback((expr: string): string => {
    let e = expr;
    // Substitute variables
    Object.entries(variables).forEach(([k, v]) => {
      e = e.replace(new RegExp(`\\b${k}\\b`, 'g'), v);
    });
    // Substitute list references
    Object.entries(lists).forEach(([k, v]) => {
      e = e.replace(new RegExp(`\\b${k}\\b`, 'g'), `[${v.join(',')}]`);
    });
    // Basic simplification patterns
    e = e.replace(/\^/g, '**');
    e = e.replace(/sum\(([^)]+)\)/g, (_, list) => {
      try {
        const arr = JSON.parse(list.replace(/'/g, '"'));
        return (Array.isArray(arr) ? arr.reduce((a: number, b: number) => a + b, 0) : 0).toString();
      } catch { return '0'; }
    });
    e = e.replace(/prod\(([^)]+)\)/g, (_, list) => {
      try {
        const arr = JSON.parse(list.replace(/'/g, '"'));
        return (Array.isArray(arr) ? arr.reduce((a: number, b: number) => a * b, 1) : 1).toString();
      } catch { return '1'; }
    });
    e = e.replace(/mean\(([^)]+)\)/g, (_, list) => {
      try {
        const arr = JSON.parse(list.replace(/'/g, '"'));
        return (Array.isArray(arr) ? arr.reduce((a: number, b: number) => a + b, 0) / arr.length : 0).toString();
      } catch { return '0'; }
    });
    e = e.replace(/factor\((\d+)\)/g, (_, n) => {
      const num = parseInt(n);
      const factors: number[] = [];
      let temp = num;
      for (let i = 2; i <= temp; i++) {
        while (temp % i === 0) { factors.push(i); temp /= i; }
      }
      return `{${factors.join(', ')}}`;
    });
    e = e.replace(/expand\(([^)]+)\)/g, (_, expr2) => {
      // Simple expansion: (a+b)(c+d) -> ac+ad+bc+bd
      return expr2; // simplified
    });
    e = e.replace(/solve\(([^,]+),([^)]+)\)/g, (_, eq, varName) => {
      // Very simple linear solver: ax+b=0
      const match = eq.trim().match(/^([+-]?\d*\.?\d*)\*?([a-z])\s*([+-])\s*(\d+\.?\d*)\s*=\s*0$/);
      if (match) {
        const a = parseFloat(match[1] || '1');
        const sign = match[3] === '-' ? -1 : 1;
        const b = parseFloat(match[4]) * sign;
        return `${match[2]} = ${(-b / a).toFixed(4)}`;
      }
      return 'solve(...) = ?';
    });
    e = e.replace(/diff\(([^,]+),([^)]+)\)/g, (_, expr2, varName) => {
      // Simple derivative of polynomials
      const terms = expr2.split(/([+-])/);
      let result = '';
      let sign = '';
      for (const term of terms) {
        if (!term) continue;
        if (term === '+' || term === '-') { sign = term; continue; }
        const match = term.trim().match(/^([+-]?\d*\.?\d*)\*?([a-z])\^?(\d*)$/);
        if (match) {
          const coeff = parseFloat(match[1] || '1');
          const power = parseInt(match[3] || '1');
          const newCoeff = coeff * power;
          const newPower = power - 1;
          if (newPower === 0) result += (sign || '') + newCoeff;
          else if (newPower === 1) result += (sign || '') + newCoeff + '*' + match[2];
          else result += (sign || '') + newCoeff + '*' + match[2] + '^' + newPower;
        }
        sign = '';
      }
      return result || '0';
    });
    e = e.replace(/int\(([^,]+),([^)]+)\)/g, (_, expr2, varName) => {
      // Simple integral of polynomials
      const terms = expr2.split(/([+-])/);
      let result = '';
      let sign = '';
      for (const term of terms) {
        if (!term) continue;
        if (term === '+' || term === '-') { sign = term; continue; }
        const match = term.trim().match(/^([+-]?\d*\.?\d*)\*?([a-z])\^?(\d*)$/);
        if (match) {
          const coeff = parseFloat(match[1] || '1');
          const power = parseInt(match[3] || '0');
          const newPower = power + 1;
          const newCoeff = coeff / newPower;
          if (newPower === 1) result += (sign || '') + newCoeff + '*' + match[2];
          else result += (sign || '') + newCoeff + '*' + match[2] + '^' + newPower;
        }
        sign = '';
      }
      return result + ' + C';
    });

    // Standard math evaluation
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('Math', `with(Math) { return ${e} }`)(Math);
      if (typeof result === 'number') {
        if (isNaN(result)) return 'Undefined';
        if (!isFinite(result)) return '∞';
        return Math.abs(result) < 1e10 ? parseFloat(result.toPrecision(12)).toString() : result.toExponential(6);
      }
      return String(result);
    } catch (err) {
      return 'Error: ' + String(err).slice(0, 30);
    }
  }, [variables, lists]);

  const calculate = useCallback(() => {
    if (!calcInput.trim()) return;
    feedback();
    const result = evaluate(calcInput);
    setCalcHistory(h => [{ expr: calcInput, result }, ...h].slice(0, 50));
    setCalcInput('');
    // Auto-store result in 'ans'
    setVariables(v => ({ ...v, ans: result }));
  }, [feedback, calcInput, evaluate]);

  // Graph drawing
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.width;
    const h = canvas.height;
    const { xMin, xMax, yMin, yMax } = graphRange;

    ctx.fillStyle = '#c8d4c8';
    ctx.fillRect(0, 0, w, h);

    const pad = 30;
    const gw = w - 2 * pad;
    const gh = h - 2 * pad;

    // Grid
    ctx.strokeStyle = '#a0b0a0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = pad + (i / 10) * gw;
      const y = pad + (i / 10) * gh;
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    const x0 = pad + ((-xMin) / (xMax - xMin)) * gw;
    const y0 = h - pad - ((-yMin) / (yMax - yMin)) * gh;
    ctx.beginPath(); ctx.moveTo(pad, y0); ctx.lineTo(w - pad, y0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, pad); ctx.lineTo(x0, h - pad); ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '10px monospace';
    ctx.fillText(xMin.toString(), pad, y0 + 12);
    ctx.fillText(xMax.toString(), w - pad - 20, y0 + 12);
    ctx.fillText(yMin.toString(), x0 + 4, h - pad - 4);
    ctx.fillText(yMax.toString(), x0 + 4, pad + 10);

    // Plot function
    ctx.strokeStyle = '#2b6cb0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let first = true;
    for (let px = 0; px <= gw; px += 1) {
      const x = xMin + (px / gw) * (xMax - xMin);
      try {
        const e = graphFn.replace(/\^/g, '**').replace(/x/g, x.toString());
        // eslint-disable-next-line no-new-func
        const y = new Function('Math', `with(Math) { return ${e} }`)(Math);
        if (!isNaN(y) && isFinite(y)) {
          const py = h - pad - ((y - yMin) / (yMax - yMin)) * gh;
          if (first) { ctx.moveTo(pad + px, py); first = false; }
          else { ctx.lineTo(pad + px, py); }
        }
      } catch { first = true; }
    }
    ctx.stroke();
  }, [graphFn, graphRange]);

  useEffect(() => {
    if (mode === 'graph') {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth || 400;
        canvas.height = 300;
        drawGraph();
      }
    }
  }, [mode, drawGraph]);

  const handleSpreadsheetChange = (row: number, col: number, value: string) => {
    const newSheet = [...spreadsheet];
    if (!newSheet[row]) newSheet[row] = [];
    const num = parseFloat(value);
    newSheet[row][col] = isNaN(num) ? value : num;
    setSpreadsheet(newSheet);
  };

  const addListValue = () => {
    const val = parseFloat(calcInput);
    if (!isNaN(val)) {
      setLists(l => ({ ...l, [activeList]: [...(l[activeList] || []), val] }));
      setCalcInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex gap-1 p-2 rounded-xl overflow-x-auto" style={{ background: 'var(--panel-bg)' }}>
        {TI_MODES.map(m => (
          <button
            key={m.id}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              mode === m.id ? 'bg-white/10 text-white border border-orange-400' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => { feedback(); setMode(m.id); }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* TI Body */}
      <div className="ti-body max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-gray-400 text-xs tracking-widest uppercase">TEXAS INSTRUMENTS</div>
          <div className="text-gray-500 text-xs">TI-Nspire CX</div>
        </div>

        {/* Screen */}
        <div className="ti-screen mb-4">
          {mode === 'calculator' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">TI-Nspire CX CAS</div>
              <div className="text-right text-lg font-bold mb-1">{calcInput || '0'}</div>
              {calcHistory.length > 0 && (
                <div className="border-t border-gray-400 pt-1 mt-1">
                  <div className="text-xs text-gray-600 mb-1">Historial:</div>
                  {calcHistory.slice(0, 5).map((h, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{h.expr}</span>
                      <span className="font-bold">{h.result}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'graph' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">y = {graphFn}</div>
              <canvas ref={canvasRef} className="w-full rounded" style={{ height: 250 }} />
            </div>
          )}

          {mode === 'lists' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Listas</div>
              <div className="flex gap-2 mb-2">
                {Object.keys(lists).map(l => (
                  <button key={l} className={`px-2 py-1 rounded text-xs ${activeList === l ? 'bg-blue-500 text-white' : 'bg-gray-300'}`} onClick={() => setActiveList(l)}>{l}</button>
                ))}
              </div>
              <div className="text-sm font-mono">{activeList} = [{lists[activeList]?.join(', ') || ''}]</div>
              <div className="text-xs text-gray-600 mt-1">n = {lists[activeList]?.length || 0}</div>
            </div>
          )}

          {mode === 'spreadsheet' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Hoja de Cálculo</div>
              <div className="overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <tbody>
                    {spreadsheet.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className={`border border-gray-400 p-1 min-w-[40px] text-center ${selectedCell.row === r && selectedCell.col === c ? 'bg-yellow-200' : ''}`} onClick={() => setSelectedCell({ row: r, col: c })}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mode === 'notes' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Notas</div>
              <textarea className="w-full h-48 bg-transparent border-none resize-none font-mono text-sm outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          )}

          {mode === 'variables' && (
            <div>
              <div className="text-xs text-gray-600 mb-1">Variables</div>
              <div className="space-y-1">
                {Object.entries(variables).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm font-mono">
                    <span>{k} =</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input for graph mode */}
        {mode === 'graph' && (
          <div className="mb-3 flex gap-2">
            <input className="flex-1 p-2 rounded bg-gray-700 text-white text-sm font-mono" value={graphFn} onChange={e => setGraphFn(e.target.value)} placeholder="f(x) = ..." />
            <button className="ti-key enter" onClick={() => { feedback(); drawGraph(); }}>Graficar</button>
          </div>
        )}

        {/* Input for lists mode */}
        {mode === 'lists' && (
          <div className="mb-3 flex gap-2">
            <input className="flex-1 p-2 rounded bg-gray-700 text-white text-sm font-mono" value={calcInput} onChange={e => setCalcInput(e.target.value)} placeholder="Agregar valor..." />
            <button className="ti-key enter" onClick={() => { feedback(); addListValue(); }}>+</button>
          </div>
        )}

        {/* Input for calculator */}
        {mode === 'calculator' && (
          <div className="mb-3">
            <input className="w-full p-2 rounded bg-gray-700 text-white text-sm font-mono" value={calcInput} onChange={e => setCalcInput(e.target.value)} placeholder="Enter expression..." onKeyDown={e => { if (e.key === 'Enter') calculate(); }} />
          </div>
        )}

        {/* Main Keypad */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {/* Row 1 */}
          <button className="ti-key ctrl" onClick={() => { feedback(); setCalcInput(''); }}>esc</button>
          <button className="ti-key ctrl" onClick={() => { feedback(); setCalcInput(calcInput + '('); }}>(</button>
          <button className="ti-key ctrl" onClick={() => { feedback(); setCalcInput(calcInput + ')'); }}>)</button>
          <button className="ti-key menu" onClick={() => { feedback(); setCalcInput(calcInput + ','); }}>,</button>
          <button className="ti-key action" onClick={() => { feedback(); setCalcInput(calcInput.slice(0, -1)); }}>del</button>
          <button className="ti-key action" onClick={() => { feedback(); setCalcInput(''); setCalcHistory([]); }}>clear</button>

          {/* Row 2 */}
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + 'sin('); }}>sin</button>
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + 'cos('); }}>cos</button>
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + 'tan('); }}>tan</button>
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + '^'); }}>^</button>
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + '√('); }}>√</button>
          <button className="ti-key trig" onClick={() => { feedback(); setCalcInput(calcInput + 'π'); }}>π</button>

          {/* Row 3 */}
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '7'); }}>7</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '8'); }}>8</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '9'); }}>9</button>
          <button className="ti-key operator" onClick={() => { feedback(); setCalcInput(calcInput + '/'); }}>÷</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'diff('); }}>diff</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'int('); }}>int</button>

          {/* Row 4 */}
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '4'); }}>4</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '5'); }}>5</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '6'); }}>6</button>
          <button className="ti-key operator" onClick={() => { feedback(); setCalcInput(calcInput + '*'); }}>×</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'factor('); }}>factor</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'expand('); }}>expand</button>

          {/* Row 5 */}
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '1'); }}>1</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '2'); }}>2</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '3'); }}>3</button>
          <button className="ti-key operator" onClick={() => { feedback(); setCalcInput(calcInput + '-'); }}>−</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'solve('); }}>solve</button>
          <button className="ti-key doc" onClick={() => { feedback(); setCalcInput(calcInput + 'sum('); }}>sum</button>

          {/* Row 6 */}
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '0'); }}>0</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '.'); }}>.</button>
          <button className="ti-key num" onClick={() => { feedback(); setCalcInput(calcInput + '(-)'); }}>(-)</button>
          <button className="ti-key operator" onClick={() => { feedback(); setCalcInput(calcInput + '+'); }}>+</button>
          <button className="ti-key enter col-span-2" onClick={() => { feedback(); calculate(); }}>enter</button>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-3 gap-1 mt-2 max-w-[120px] mx-auto">
          <div />
          <button className="ti-key nav" onClick={() => { feedback(); }}>▲</button>
          <div />
          <button className="ti-key nav" onClick={() => { feedback(); }}>◀</button>
          <button className="ti-key nav" onClick={() => { feedback(); }}>▼</button>
          <button className="ti-key nav" onClick={() => { feedback(); }}>▶</button>
        </div>
      </div>

      {/* CAS Examples */}
      {mode === 'calculator' && (
        <div className="calc-frame mt-4">
          <div className="text-center text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Comandos CAS</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button className="calc-key small-text" onClick={() => { setCalcInput('diff(x^3+2*x^2+x, x)'); calculate(); }}>diff(x³+2x²+x)</button>
            <button className="calc-key small-text" onClick={() => { setCalcInput('int(2*x+3, x)'); calculate(); }}>∫(2x+3)dx</button>
            <button className="calc-key small-text" onClick={() => { setCalcInput('factor(120)'); calculate(); }}>factor(120)</button>
            <button className="calc-key small-text" onClick={() => { setCalcInput('solve(2*x+3=0, x)'); calculate(); }}>solve(2x+3=0)</button>
            <button className="calc-key small-text" onClick={() => { setCalcInput('expand((x+1)*(x+2))'); calculate(); }}>expand((x+1)(x+2))</button>
            <button className="calc-key small-text" onClick={() => { setCalcInput('sum(l1)'); calculate(); }}>sum(l1)</button>
          </div>
        </div>
      )}
    </div>
  );
}
