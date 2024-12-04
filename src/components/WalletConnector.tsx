import React from 'react';
import { Button, Text, HStack } from '@chakra-ui/react';

interface Props {
  currentAccount: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WalletConnector: React.FC<Props> = ({
  currentAccount,
  isConnecting,
  onConnect,
  onDisconnect
}) => (
  <HStack spacing={4}>
    {currentAccount ? (
      <>
        <Text fontSize="sm">已连接: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</Text>
        <Button size="sm" colorScheme="red" onClick={onDisconnect}>
          断开连接
        </Button>
      </>
    ) : (
      <Button colorScheme="blue" onClick={onConnect} isLoading={isConnecting}>
        连接钱包
      </Button>
    )}
  </HStack>
); 