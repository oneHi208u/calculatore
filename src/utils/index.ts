// ==========================================
// UTILIDADES - CalcNum Pro v6.0
// ==========================================

export function validateInput(value: string, base: number): { valid: boolean; error: string } {
  if (!value) return { valid: false, error: 'Ingresa un valor' };
  
  const patterns: Record<number, RegExp> = {
    2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^-?\d+$/, 16: /^[0-9A-Fa-f]+$/
  };
  
  if (base === 10 && value.startsWith('-')) return { valid: true, error: '' };
  if (!patterns[base].test(value)) {
    const chars: Record<number, string> = { 2: '0 y 1', 8: '0-7', 10: '0-9', 16: '0-9, A-F' };
    return { valid: false, error: `Caracteres válidos: ${chars[base]}` };
  }
  return { valid: true, error: '' };
}

export function binaryToGray(binary: string): string {
  let gray = binary[0];
  for (let i = 1; i < binary.length; i++) {
    gray += binary[i - 1] !== binary[i] ? '1' : '0';
  }
  return gray;
}

export function grayToBinary(gray: string): string {
  let binary = gray[0];
  for (let i = 1; i < gray.length; i++) {
    binary += binary[i - 1] !== gray[i] ? '1' : '0';
  }
  return binary;
}

export function floatToIEEE32(num: number): string {
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setFloat32(0, num);
  return new Uint32Array(buffer)[0].toString(2).padStart(32, '0');
}

export function ieee32ToFloat(binary: string): number {
  const intVal = parseInt(binary, 2);
  const buffer = new ArrayBuffer(4);
  new DataView(buffer).setUint32(0, intVal);
  return new DataView(buffer).getFloat32(0);
}

export function hexToBinary(hex: string): string {
  return hex.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('');
}

export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}

export function intToIp(int: number): string {
  return [(int >>> 24) & 0xFF, (int >>> 16) & 0xFF, (int >>> 8) & 0xFF, int & 0xFF].join('.');
}

export function popcount(num: number): number {
  let count = 0;
  let n = num >>> 0;
  while (n) { count += n & 1; n >>>= 1; }
  return count;
}

export function rol(num: number, count: number): number {
  return (num << count) | (num >>> (32 - count));
}

export function ror(num: number, count: number): number {
  return (num >>> count) | (num << (32 - count));
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export async function shareContent(title: string, text: string, url?: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: url || window.location.href });
    } catch {}
  }
}

// BCD Tables
export const BCD_TABLES: Record<string, string[]> = {
  '8421': ['0000', '0001', '0010', '0011', '0100', '0101', '0110', '0111', '1000', '1001'],
  '2421': ['0000', '0001', '0010', '0011', '0100', '1011', '1100', '1101', '1110', '1111'],
  'excess3': ['0011', '0100', '0101', '0110', '0111', '1000', '1001', '1010', '1011', '1100'],
};

// Hamming Code
export function hammingEncode(data: string, parityType: 'even' | 'odd'): string {
  const m = data.length;
  let r = 0;
  while (Math.pow(2, r) < m + r + 1) r++;
  const n = m + r;
  const code = new Array(n).fill('0');
  
  let dataIdx = 0;
  for (let i = 1; i <= n; i++) {
    if ((i & (i - 1)) !== 0) {
      code[n - i] = data[dataIdx++];
    }
  }
  
  for (let i = 0; i < r; i++) {
    const pos = Math.pow(2, i);
    let parity = 0;
    for (let j = 1; j <= n; j++) {
      if ((j & pos) !== 0 && (j & (j - 1)) !== 0) {
        parity ^= parseInt(code[n - j]);
      }
    }
    code[n - pos] = parityType === 'even' ? parity.toString() : (1 - parity).toString();
  }
  
  return code.join('');
}

export function hammingDecode(input: string, parityType: 'even' | 'odd'): { result: string; errorPos: number; corrected?: string } {
  const n = input.length;
  let errorPos = 0;
  
  for (let i = 0; Math.pow(2, i) <= n; i++) {
    const pos = Math.pow(2, i);
    let parity = 0;
    for (let j = 1; j <= n; j++) {
      if ((j & pos) !== 0) parity ^= parseInt(input[n - j]);
    }
    if (parity !== (parityType === 'even' ? 0 : 1)) {
      errorPos += pos;
    }
  }
  
  if (errorPos === 0) {
    return { result: 'Sin errores detectados', errorPos: 0 };
  }
  
  if (errorPos <= n) {
    const corrected = input.split('');
    corrected[n - errorPos] = corrected[n - errorPos] === '0' ? '1' : '0';
    return { result: `Error en posición ${errorPos}`, errorPos, corrected: corrected.join('') };
  }
  
  return { result: 'Múltiples errores detectados', errorPos };
}

// CRC Calculation
export function calculateCRC(data: string, type: string): string {
  const polynomials: Record<string, string> = {
    'CRC-8': '100000111',
    'CRC-16': '10001000000100001',
    'CRC-32': '100000100110000010001110110110111'
  };
  
  const poly = polynomials[type];
  const degree = poly.length - 1;
  let dividend = data + '0'.repeat(degree);
  let remainder = '';
  
  for (let i = 0; i < dividend.length; i++) {
    remainder += dividend[i];
    if (remainder.length === poly.length) {
      let temp = '';
      for (let j = 0; j < poly.length; j++) {
        temp += (remainder[j] === poly[j]) ? '0' : '1';
      }
      remainder = temp.replace(/^0+/, '');
    }
  }
  
  return remainder.padStart(degree, '0');
}
