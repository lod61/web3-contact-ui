import { ethers } from 'ethers';
import type { 
  EthereumProvider, 
  AccountsChangedCallback, 
  ChainChangedCallback 
} from '../types';

// 错误类型
export class Web3Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'Web3Error';
  }
}

// 网络配置类型定义
type NetworkConfigType = {
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

// 网络配置
export const NETWORK_CONFIGS: Record<string, NetworkConfigType> = {
  '1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/your-project-id',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://etherscan.io'
  },
  '5': {
    chainId: '0x5',
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/your-project-id',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://goerli.etherscan.io'
  },
  '137': {
    chainId: '0x89',
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    blockExplorer: 'https://polygonscan.com'
  }
};

// 获取以太坊提供者
export const getEthereumProvider = (): EthereumProvider => {
  if (typeof window === 'undefined') {
    throw new Web3Error('非浏览器环境', 'BROWSER_REQUIRED');
  }

  const ethereum = window.ethereum;
  if (!ethereum || !ethereum.selectedAddress) {
    throw new Web3Error('请安装 MetaMask', 'PROVIDER_NOT_FOUND');
  }

  return ethereum;
};

// 钱包连接函数
export const connectWallet = async (): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  currentAccount: string;
}> => {
  try {
    const ethereum = getEthereumProvider();
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Web3Error('未找到账户', 'NO_ACCOUNTS');
    }

    const currentAccount = accounts[0];
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    return { provider, signer, currentAccount };
  } catch (error) {
    if (error instanceof Web3Error) {
      throw error;
    }
    throw new Web3Error(
      '连接钱包失败',
      'CONNECT_ERROR',
      error instanceof Error ? error.message : '未知错误'
    );
  }
};

// 检查网络是否支持
export const isSupportedNetwork = (chainId: string): boolean => {
  return Object.keys(NETWORK_CONFIGS).includes(chainId);
};

// 切换网络函数
export const switchNetwork = async (chainId: string): Promise<void> => {
  const ethereum = getEthereumProvider();
  
  if (!isSupportedNetwork(chainId)) {
    throw new Web3Error(`不支持的网络: ${chainId}`, 'UNSUPPORTED_NETWORK');
  }

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK_CONFIGS[chainId].chainId }],
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 4902) {
        await addNetwork(chainId);
      } else {
        throw new Web3Error('切换网络失败', 'SWITCH_ERROR', error);
      }
    }
  }
};

// 获取网络信息函数
export const getNetworkInfo = async (provider: ethers.BrowserProvider): Promise<{
  chainId: string;
  name: string;
}> => {
  try {
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    const networkConfig = NETWORK_CONFIGS[chainId];
    
    return {
      chainId,
      name: networkConfig?.name || '未知网络'
    };
  } catch (error) {
    throw new Web3Error(
      '获取网络信息失败',
      'NETWORK_INFO_ERROR',
      error instanceof Error ? error.message : '未知错误'
    );
  }
};

// 断开钱包连接函数
export const disconnectWallet = async (): Promise<void> => {
  const ethereum = getEthereumProvider();
  // eslint-disable-next-line no-console
  const accountsCallback: AccountsChangedCallback = (accounts) => {
    console.log('账户已更改:', accounts);
  };
  // eslint-disable-next-line no-console
  const chainCallback: ChainChangedCallback = (chainId) => {
    console.log('链已更改:', chainId);
  };
  
  ethereum.removeListener('accountsChanged', accountsCallback);
  ethereum.removeListener('chainChanged', chainCallback);
};

// 监听账户变化
export const listenToAccountChanges = (callback: AccountsChangedCallback): void => {
  const ethereum = getEthereumProvider();
  ethereum.on('accountsChanged', callback);
};

// 监听链变化
export const listenToChainChanges = (callback: ChainChangedCallback): void => {
  const ethereum = getEthereumProvider();
  ethereum.on('chainChanged', callback);
};

// 消息签名函数
export const signMessage = async (message: string): Promise<string> => {
  if (!window.ethereum) {
    throw new Web3Error('MetaMask not detected', 'PROVIDER_NOT_FOUND');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return await signer.signMessage(message);
  } catch (error) {
    if (error instanceof Error) {
      throw new Web3Error(error.message, 'SIGN_ERROR');
    }
    throw new Web3Error('Failed to sign message', 'UNKNOWN_ERROR');
  }
};

// 获取合约实例
export const getContract = async (
  address: string, 
  abi: ethers.InterfaceAbi
): Promise<ethers.Contract> => {
  if (!window.ethereum) {
    throw new Web3Error('MetaMask not detected', 'PROVIDER_NOT_FOUND');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(address, abi, signer);
  } catch (error) {
    if (error instanceof Error) {
      throw new Web3Error(error.message, 'CONTRACT_ERROR');
    }
    throw new Web3Error('Failed to get contract', 'UNKNOWN_ERROR');
  }
};

// 判断地址是否有效
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
};

// 格式化地址
export const formatAddress = (address: string): string => {
  try {
    const formattedAddress = ethers.getAddress(address);
    return `${formattedAddress.slice(0, 6)}...${formattedAddress.slice(-4)}`;
  } catch {
    return '无效地址';
  }
};

// 添加参数类型验证
export const validateParam = (type: string, value: string): boolean => {
  try {
    switch (type) {
      case 'address':
        return ethers.isAddress(value);
      case 'uint256':
      case 'int256':
        return !isNaN(Number(value)) && BigInt(value) !== undefined;
      case 'bool':
        return ['true', 'false'].includes(value.toLowerCase());
      // 添加更多类型验证
      default:
        return true;
    }
  } catch {
    return false;
  }
};

// 添加 addNetwork 函数
const addNetwork = async (chainId: string): Promise<void> => {
  const ethereum = getEthereumProvider();
  const config = NETWORK_CONFIGS[chainId];
  
  await ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [
      {
        chainId: config.chainId,
        chainName: config.name,
        nativeCurrency: config.nativeCurrency,
        rpcUrls: [config.rpcUrl],
        blockExplorerUrls: [config.blockExplorer],
      },
    ],
  });
};
