import { useReducer } from 'react';
import { ethers } from 'ethers';
import { AbiEntry, ContractState } from '../types';

type ContractAction = 
  | { type: 'SET_CONTRACT'; payload: ethers.Contract }
  | { type: 'SET_FUNCTIONS'; payload: AbiEntry[] }
  | { type: 'SELECT_FUNCTION'; payload: AbiEntry | null }
  | { type: 'SET_PARAMS'; payload: string[] }
  | { type: 'RESET' };

const initialState: ContractState = {
  provider: null,
  signer: null,
  contract: null,
  currentAccount: null,
  chainId: '1',
  contractFunctions: [],
  selectedFunction: null,
  functionParams: [],
  transactions: []
};

const contractReducer = (state: ContractState, action: ContractAction): ContractState => {
  switch (action.type) {
    case 'SET_CONTRACT':
      return { ...state, contract: action.payload };
    case 'SET_FUNCTIONS':
      return { ...state, contractFunctions: action.payload };
    case 'SELECT_FUNCTION':
      return { 
        ...state, 
        selectedFunction: action.payload,
        functionParams: new Array(action.payload?.inputs.length || 0).fill('')
      };
    case 'SET_PARAMS':
      return { ...state, functionParams: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const useContractState = () => {
  return useReducer(contractReducer, initialState);
}; 