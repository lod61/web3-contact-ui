import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { WalletConnector } from '../components/WalletConnector';

describe('WalletConnector', () => {
  const mockProps = {
    currentAccount: null,
    isConnecting: false,
    onConnect: jest.fn(),
    onDisconnect: jest.fn()
  };

  it('shows connect button when not connected', () => {
    render(
      <ChakraProvider>
        <WalletConnector {...mockProps} />
      </ChakraProvider>
    );
    expect(screen.getByText('连接钱包')).toBeInTheDocument();
  });

  it('shows disconnect button when connected', () => {
    render(
      <ChakraProvider>
        <WalletConnector 
          {...mockProps} 
          currentAccount="0x1234...5678"
        />
      </ChakraProvider>
    );
    expect(screen.getByText(/断开连接/)).toBeInTheDocument();
  });
}); 