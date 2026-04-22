// ==========================================
// TIPOS GLOBALES - CalcNum Pro v6.0
// ==========================================

export interface CalcState {
  currentSystem: 'bin' | 'oct' | 'dec' | 'hex';
  currentOperation: 'add' | 'sub' | 'mul' | 'div';
  num1: string;
  num2: string;
  currentNum: number;
  result: string;
}

export interface HistoryItem {
  type: string;
  input?: string;
  result: string;
  timestamp: string;
  system?: string;
  operation?: string;
  num1?: string | number;
  num2?: string | number;
  mode?: string;
  bits?: number;
  bcdType?: string;
  crcType?: string;
  precision?: string;
  hammingMode?: string;
  parityType?: string;
}

export interface Config {
  theme: 'dark' | 'light';
  accent: string;
  sound: boolean;
  haptic: boolean;
  fontSize: 'small' | 'normal' | 'large';
  compact: boolean;
}

export interface SubnetInfo {
  network: string;
  mask: string;
  wildcard: string;
  firstUsable: string;
  lastUsable: string;
  broadcast: string;
  usableHosts: number;
  totalHosts: number;
}

export type SectionId = 
  | 'calcnum' | 'convert' | 'scientific' | 'complement' | 'gray' | 'ascii' 
  | 'float' | 'bcd' | 'subnet' | 'boolean' | 'hamming' | 'crc' 
  | 'terminal' | 'waveform' | 'casio' | 'tinspire' | 'ref';
