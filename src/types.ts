import { ethers } from 'ethers';

export class Web3Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'Web3Error';
  }
}

export type NetworkConfig = {
  chainId: string;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
};

export type EthereumWindow = Window & {
  ethereum?: ethers.Eip1193Provider & {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
    isMetaMask?: boolean;
    isConnected?: () => boolean;
    chainId?: string;
    networkVersion?: string;
  };
};

export interface AbiParameter {
  name: string;
  type: string;
  components?: AbiParameter[];
  indexed?: boolean;
  internalType?: string;
}

export interface AbiEntry {
  type: string;
  name: string;
  inputs: AbiParameter[];
  outputs?: AbiParameter[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  constant?: boolean;
  payable?: boolean;
  anonymous?: boolean;
}

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  functionName: string;
  params: unknown[];
  txHash: string;
  status: TransactionStatus;
  timestamp: string;
  error?: string;
  receipt?: ethers.TransactionReceipt;
}

export interface TransactionFormatted extends Transaction {
  shortHash: string;
  formattedParams: string;
  formattedTime: string;
}

export interface ContractState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  currentAccount: string | null;
  chainId: string;
  contractFunctions: AbiEntry[];
  selectedFunction: AbiEntry | null;
  functionParams: string[];
  transactions: Transaction[];
}

export type AccountsChangedCallback = (accounts: string[]) => void;
export type ChainChangedCallback = (chainId: string) => void;

export type EthereumProvider = ethers.Eip1193Provider & {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on(event: 'accountsChanged', callback: AccountsChangedCallback): void;
  on(event: 'chainChanged', callback: ChainChangedCallback): void;
  removeListener(event: 'accountsChanged', callback: AccountsChangedCallback): void;
  removeListener(event: 'chainChanged', callback: ChainChangedCallback): void;
  isConnected?: () => boolean;
  chainId?: string;
  selectedAddress: string | null;
  networkVersion?: string;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export interface ContractSecurityCheck {
  validateAddress(address: string): boolean;
  estimateGas(contract: ethers.Contract, method: string, params: unknown[]): Promise<bigint>;
  checkMethodSafety(method: string): boolean;
}

export const contractSecurityCheck: ContractSecurityCheck = {
  validateAddress(address: string): boolean {
    return ethers.isAddress(address);
  },
  
  async estimateGas(contract: ethers.Contract, method: string, params: unknown[]): Promise<bigint> {
    const estimator = contract.estimateGas[method as keyof typeof contract.estimateGas];
    if (typeof estimator !== 'function') {
      throw new Error(`Method ${method} not found`);
    }
    return await estimator(...params);
  },
  
  checkMethodSafety(method: string): boolean {
    return !['init', 'initialize', 'constructor'].includes(method);
  }
};

export interface ContractCallResult {
  success: boolean;
  data?: string;
  error?: string;
  txHash?: string;
}

export const formatCallResult = (data: unknown): string => {
  if (data === null || data === undefined) {
    return '无数据';
  }

  if (typeof data === 'object') {
    if (data instanceof ethers.Contract) {
      return '合约对象';
    }
    return JSON.stringify(data, null, 2);
  }

  return String(data);
};
