import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

declare module 'ethers' {
  interface Contract {
    // 自定义合约交互方法
    safeCall(method: string, ...args: any[]): Promise<ethers.TransactionResponse>;
    estimateFee(method: string, ...args: any[]): Promise<bigint>;
  }

  interface Signer {
    // 签名增强
    signTypedData(domain: any, types: any, value: any): Promise<string>;
  }
}

// 支持的以太坊网络类型
export type EthereumChain = 
  | 'ethereum'
  | 'goerli'
  | 'polygon'
  | 'mumbai'
  | 'binance-smart-chain';

// 钱包连接配置
export interface WalletConnectOptions {
  chain?: EthereumChain;
  rpcUrl?: string;
}

// 合约交互安全检查接口
export interface ContractSecurityCheck {
  validateAddress(address: string): boolean;
  estimateGas(contract: ethers.Contract, method: string, params: any[]): Promise<bigint>;
  checkMethodSafety(method: string): boolean;
}
