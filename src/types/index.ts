import { ethers } from 'ethers';

export type ChainId = '1' | '5' | '137' | '80001' | '56';

export interface WalletState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  currentAccount: string | null;
  isConnecting: boolean;
}

export interface ContractFunction {
  name: string;
  type: string;
  stateMutability?: string;
  inputs: Array<{
    name: string;
    type: string;
  }>;
  outputs: Array<{
    type: string;
  }>;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
} 