import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { ethers } from 'ethers';
import * as web3 from '../utils/web3';

export const useWallet = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const toast = useToast();

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { provider, signer, currentAccount } = await web3.connectWallet();
      setProvider(provider);
      setSigner(signer);
      setCurrentAccount(currentAccount);
      
      toast({
        title: '钱包已连接',
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: '连接失败',
        status: 'error',
        duration: 3000
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    try {
      await web3.disconnectWallet();
      setProvider(null);
      setSigner(null);
      setCurrentAccount(null);
      
      toast({
        title: '已断开连接',
        status: 'info',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: '断开连接失败',
        status: 'error',
        duration: 3000
      });
    }
  }, [toast]);

  return {
    provider,
    signer,
    currentAccount,
    isConnecting,
    connect,
    disconnect
  };
}; 