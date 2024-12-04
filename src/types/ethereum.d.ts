import { providers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      chainId: string;
      selectedAddress: string | null;
      networkVersion: string;
    };
  }
}

export interface EthereumProvider extends providers.ExternalProvider {
  isMetaMask?: boolean;
  chainId: string;
}
