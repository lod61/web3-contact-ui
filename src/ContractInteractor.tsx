/* eslint-disable react/prop-types */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  ChakraProvider, 
  Box, 
  Input, 
  Button, 
  Textarea, 
  VStack, 
  HStack, 
  Text, 
  Select,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  AlertIcon,
  AlertDescription,
  FormControl,
  FormLabel,
  FormHelperText
} from '@chakra-ui/react';
import { AbiEntry, Transaction, ContractState, ContractCallResult } from './types';
import * as web3 from './utils/web3';
import { formatHash, formatCallResult, getTypeDescription } from './utils/format';

// 支持的链配置
const SUPPORTED_CHAINS = {
  '1': 'Ethereum Mainnet',
  '5': 'Goerli Testnet',
  '137': 'Polygon Mainnet',
  '80001': 'Mumbai Testnet',
  '56': 'Binance Smart Chain',
} as const;

type ChainId = keyof typeof SUPPORTED_CHAINS;

// 拆分复杂函数
const handleBasicValue = (type: string, value: string): unknown => {
  if (!value) return '';

  switch (type) {
    case 'uint256':
    case 'uint':
    case 'int256':
    case 'int':
      return ethers.toBigInt(value);
    case 'address':
      return ethers.getAddress(value);
    case 'bool':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
};

const handleSpecialValue = (type: string, value: string): unknown => {
  if (type === 'bytes') {
    return ethers.toUtf8Bytes(value);
  }
  if (type.startsWith('bytes')) {
    return value;
  }
  return value;
};

const convertBasicValue = (type: string, value: string): unknown => {
  if (!value) return '';
  return type === 'bytes' || type.startsWith('bytes')
    ? handleSpecialValue(type, value)
    : handleBasicValue(type, value);
};

const convertValue = (type: string, value: string): unknown => {
  try {
    if (type.endsWith('[]')) {
      const arrayValues = value.split(',').map(v => v.trim());
      const baseType = type.slice(0, -2);
      return arrayValues.map(v => convertBasicValue(baseType, v));
    }
    return convertBasicValue(type, value);
  } catch (error) {
    throw new Error(`参数转换失败: ${type} - ${value}`);
  }
};

const getTypeHint = (type: string): string => {
  switch (type) {
    case 'uint256':
    case 'uint':
    case 'int256':
    case 'int':
      return '请输入整数';
    case 'address':
      return '请输入以 0x 开头的地址';
    case 'bool':
      return '请输入 true 或 false';
    case 'string':
      return '请输入字符串';
    case 'bytes':
      return '请输入十六进制字符串';
    default:
      return '请输参数';
  }
};

const SAMPLE_ABI = JSON.stringify([
  {
    "inputs": [],
    "name": "getValue",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
], null, 2);

const ContractInteractor: React.FC = () => {
  const [provider, setProvider] = useState<ContractState['provider']>(null);
  const [signer, setSigner] = useState<ContractState['signer']>(null);
  const [currentAccount, setCurrentAccount] = useState<ContractState['currentAccount']>(null);
  const [abiJson, setAbiJson] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [message, setMessage] = useState('');
  const [chainId, setChainId] = useState<ChainId>('1');
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contractFunctions, setContractFunctions] = useState<ContractState['contractFunctions']>([]);
  const [selectedFunction, setSelectedFunction] = useState<ContractState['selectedFunction']>(null);
  const [functionParams, setFunctionParams] = useState<ContractState['functionParams']>([]);
  const [transactions, setTransactions] = useState<ContractState['transactions']>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [lastCallResult, setLastCallResult] = useState<ContractCallResult | null>(null);

  const toast = useToast();

  // 统一的错误处理函数
  const handleError = useCallback((error: Error | unknown, title = '错误') => {
    console.error(error);
    const message = error instanceof Error ? error.message : '未知错误';
    
    // 特殊处理 MetaMask 相关错误
    if (message.includes('MetaMask') || message.includes('ethereum')) {
      window.open('https://metamask.io/download.html', '_blank');
    }
    
    setError(message);
    toast({
      title,
      description: message,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // 辅助函数：检查网络连接状态
  const checkNetworkConnection = useCallback(async () => {
    if (!provider) {
      throw new Error('未连接到以太坊网络');
    }
    const network = await provider.getNetwork();
    const chainId = network.chainId.toString();
    if (!SUPPORTED_CHAINS[chainId as ChainId]) {
      throw new Error('不支持的网络');
    }
    return chainId;
  }, [provider]);

  // 辅助函数：验证合约地址
  const validateContractAddress = useCallback((address: string) => {
    try {
      return ethers.getAddress(address); // 规范化地址格式
    } catch {
      throw new Error('效的合约地址');
    }
  }, []);

  // 辅助函数：验证并解析 ABI
  const validateAndParseAbi = useCallback((abiString: string) => {
    try {
      // 检查输入是否为空
      if (!abiString.trim()) {
        throw new Error('ABI 不能为空');
      }

      // 尝试解析 JSON
      const parsed = JSON.parse(abiString);
      
      // 验证是否为数组
      if (!Array.isArray(parsed)) {
        throw new Error('ABI 必须是数组格式');
      }
      
      // 验证数组内容
      if (parsed.length === 0) {
        throw new Error('ABI 数组不能为空');
      }

      // 验证每个元素是否包含必要的字段
      parsed.forEach((item, index) => {
        if (!item.type) {
          throw new Error(`ABI 项 ${index + 1} 缺少 type 字段`);
        }
      });

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('ABI JSON 格式错误，请检格式是否正确');
      }
      throw error;
    }
  }, []);

  // 拆分 handleFunctionSelect 函数
  const resetFunctionParams = useCallback(() => {
    setFunctionParams(new Array(selectedFunction?.inputs.length || 0).fill(''));
  }, [selectedFunction]);

  const handleFunctionSelect = useCallback((functionName: string) => {
    const selected = contractFunctions.find(f => f.name === functionName);
    if (!selected) {
      handleError(new Error('未找到选中的函数'));
      return;
    }
    setSelectedFunction(selected);
    resetFunctionParams();
  }, [contractFunctions, handleError, resetFunctionParams]);

  // 处理参数更新
  const handleParamChange = useCallback((index: number, value: string) => {
    setFunctionParams(prev => {
      const newParams = [...prev];
      newParams[index] = value;
      return newParams;
    });
  }, []);

  // 格式化交易记录显示
  const formatTransaction = useCallback((tx: Transaction) => {
    return {
      ...tx,
      shortHash: `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-4)}`,
      formattedParams: tx.params.join(', '),
      formattedTime: new Date(tx.timestamp).toLocaleString()
    };
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await web3.disconnectWallet();
      setProvider(null);
      setSigner(null);
      setCurrentAccount(null);
      setContract(null);
      setContractFunctions([]);
      setSelectedFunction(null);
      setFunctionParams([]);
      
      toast({
        title: '钱包已断开连接',
        status: 'info',
        duration: 3000,
      });
    } catch (error) {
      handleError(error, '断开连接失败');
    }
  }, [toast, handleError]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { provider: newProvider, signer: newSigner, currentAccount: account } = await web3.connectWallet();
      setProvider(newProvider);
      setSigner(newSigner);
      setCurrentAccount(account);
      
      toast({
        title: '钱包已连接',
        description: `地址: ${account.slice(0, 6)}...${account.slice(-4)}`,
        status: 'success',
        duration: 3000,
      });

      // 设置事件监听
      web3.listenToAccountChanges((accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setCurrentAccount(accounts[0]);
        }
      });

      web3.listenToChainChanges((newChainId: string) => {
        setChainId(newChainId.toLowerCase() as ChainId);
      });

    } catch (error) {
      handleError(error, '连接钱包失败');
    } finally {
      setIsConnecting(false);
    }
  }, [toast, handleError, disconnectWallet]);

  const initializeContract = useCallback(async () => {
    if (!signer || !contractAddress || !abiJson) {
      handleError(new Error('请先连接钱包并输入合约地址和 ABI'));
      return;
    }

    try {
      // 解析 ABI
      const parsedAbi = validateAndParseAbi(abiJson);
      
      // 创建合约实例
      const newContract = new ethers.Contract(
        validateContractAddress(contractAddress),
        parsedAbi,
        signer
      );

      // 过滤出函数类型的 ABI 条目
      const functions = parsedAbi.filter(
        (item: AbiEntry) => item.type === 'function'
      );

      setContract(newContract);
      setContractFunctions(functions);
      setSelectedFunction(null);
      setFunctionParams([]);

      toast({
        title: '合约初始化成功',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      handleError(error, '合约初始化失败');
    }
  }, [signer, contractAddress, abiJson, toast, handleError, validateAndParseAbi, validateContractAddress]);

  const signMessage = useCallback(async () => {
    if (!signer) {
      handleError(new Error('请先连接钱包'));
      return;
    }

    try {
      const signature = await signer.signMessage(message);
      toast({
        title: '消息签名成功',
        description: `签名结果: ${signature.slice(0, 10)}...${signature.slice(-8)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      handleError(error, '消息签名失败');
    }
  }, [signer, message, toast, handleError]);

  const switchChain = useCallback(async (newChainId: ChainId) => {
    if (!window.ethereum) {
      handleError(new Error('请安装 MetaMask!'));
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(newChainId).toString(16)}` }],
      });
      setChainId(newChainId);
      
      toast({
        title: '链换成功',
        description: `已切换到 ${SUPPORTED_CHAINS[newChainId]}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      handleError(error, '链切换失败');
    }
  }, [toast, handleError]);

  // 拆分 callContractMethod 函数
  const handleTransactionResult = async (
    result: ethers.ContractTransactionResponse,
    functionName: string,
    params: unknown[]
  ): Promise<ContractCallResult> => {
    setPendingTx(result.hash);
    const receipt = await result.wait();
    setPendingTx(null);

    if (!receipt) {
      throw new Error('交易回执为空');
    }
    
    const txRecord: Transaction = {
      functionName,
      params,
      txHash: receipt.hash,
      status: receipt.status === 1 ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      receipt: receipt
    };
    
    setTransactions(prev => [txRecord, ...prev]);
    return {
      success: receipt.status === 1,
      txHash: receipt.hash,
      data: receipt.status === 1 ? '交易成功' : '交易失败'
    };
  };

  const callContractMethod = useCallback(async () => {
    if (!contract || !selectedFunction) return;
    
    setIsLoading(true);
    setError(null);
    setLastCallResult(null);
    
    try {
      const validatedParams = await validateParams(selectedFunction, functionParams);
      const method = contract[selectedFunction.name];
      const result = await method(...validatedParams);

      if (typeof result.wait === 'function') {
        setLastCallResult(
          await handleTransactionResult(result, selectedFunction.name, validatedParams)
        );
      } else {
        setLastCallResult({
          success: true,
          data: result
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setLastCallResult({
        success: false,
        error: errorMessage
      });
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [contract, selectedFunction, functionParams, handleError]);

  // 添加参数验证函数
  const validateAndConvertParam = async (type: string, value: string): Promise<unknown> => {
    if (!value.trim()) {
      throw new Error('参数不能为空');
    }

    try {
      return convertValue(type, value.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      throw new Error(`参数格式错误: ${message}`);
    }
  };

  // 修改 validateParams 函数
  const validateParams = async (
    selectedFunction: AbiEntry,
    params: string[]
  ): Promise<unknown[]> => {
    return Promise.all(
      params.map(async (param, index) => {
        const input = selectedFunction.inputs[index];
        try {
          return await validateAndConvertParam(input.type, param);
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误';
          throw new Error(`参数 ${input.name || index + 1} (${input.type}) 验证失败: ${message}`);
        }
      })
    );
  };

  useEffect(() => {
    // 监听网络变化
    if (provider) {
      const handleNetworkChange = async () => {
        try {
          const chainId = await checkNetworkConnection();
          setChainId(chainId as ChainId);
        } catch (error) {
          handleError(error, '网络连接错误');
        }
      };
      
      handleNetworkChange();
      return () => {
        // 清理监听器
      };
    }
  }, [provider, checkNetworkConnection, handleError]);

  useEffect(() => {
    if (!provider || !contractAddress || !abiJson) return;

    try {
      const instance = new ethers.Contract(contractAddress, abiJson, provider);
      setContract(instance);
    } catch (error) {
      handleError(error, '创建合约实例失败');
    }
  }, [provider, contractAddress, abiJson, handleError]);

  // 1. 使用 useMemo 优化计算密集型操作
  const supportedChainOptions = useMemo(() => 
    Object.entries(SUPPORTED_CHAINS).map(([id, name]) => ({
      value: id,
      label: name
    })), 
  []);

  // 3. 使用 React.memo 优化子组件
  interface TransactionItemProps {
    transaction: Transaction;
  }

  const TransactionItem = React.memo<TransactionItemProps>(({ transaction }) => {
    const formatted = formatTransaction(transaction);
    return (
      <Box p={3} borderWidth="1px" borderRadius="md" fontSize="sm">
        <Text>交易哈希: {formatted.shortHash}</Text>
        <Text>函数名: {transaction.functionName}</Text>
        <Text>参数: {formatted.formattedParams}</Text>
        <Text>状态: {transaction.status}</Text>
        <Text>时间: {formatted.formattedTime}</Text>
      </Box>
    );
  });

  TransactionItem.displayName = 'TransactionItem';

  return (
    <ChakraProvider>
      <Box p={6} maxW="container.lg" mx="auto">
        <VStack spacing={6} align="stretch">
          {error && (
            <Alert status="error" variant="left-accent">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* 顶部操作栏 */}
          <HStack justify="space-between" w="full">
            <HStack spacing={4}>
              {currentAccount ? (
                <>
                  <Text fontSize="sm">已连接: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}</Text>
                  <Button size="sm" colorScheme="red" onClick={disconnectWallet}>
                    断开连接
                  </Button>
                </>
              ) : (
                <Button colorScheme="blue" onClick={connectWallet} isLoading={isConnecting}>
                  连接钱包
                </Button>
              )}
            </HStack>
            <Select
              w="200px"
              value={chainId}
              onChange={(e) => switchChain(e.target.value as ChainId)}
            >
              {supportedChainOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </HStack>

          {/* 消息签名区域 */}
          <Box>
            <HStack spacing={4} mb={4}>
              <Input
                flex={1}
                placeholder="输入消息"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                colorScheme="green"
                onClick={signMessage}
                isDisabled={!currentAccount || !message}
              >
                签名消息
              </Button>
            </HStack>
          </Box>

          {/* 合约交互区域 */}
          <VStack spacing={4} align="stretch">
            <Box>
              <Textarea
                placeholder="输入合约 ABI JSON"
                value={abiJson}
                onChange={(e) => setAbiJson(e.target.value)}
                minH="200px"
              />
              <Button
                size="sm"
                onClick={() => setAbiJson(SAMPLE_ABI)}
                mt={2}
              >
                加载示例 ABI
              </Button>
            </Box>
            <Input
              placeholder="输入合约地址"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
            <Button
              colorScheme="purple"
              onClick={initializeContract}
              isDisabled={!abiJson || !contractAddress}
              w="full"
            >
              初始化合约
            </Button>

            {/* 函数选择和参数输入 */}
            {contractFunctions.length > 0 && (
              <Box borderWidth="1px" borderRadius="lg" p={4}>
                <VStack spacing={4} align="stretch">
                  <Select
                    placeholder="选择合约函数"
                    onChange={(e) => handleFunctionSelect(e.target.value)}
                  >
                    {contractFunctions.map((func) => (
                      <option key={func.name} value={func.name}>
                        {func.name} ({func.stateMutability || 'nonpayable'})
                      </option>
                    ))}
                  </Select>

                  {selectedFunction && (
                    <>
                      <Text fontSize="sm" color="gray.600">
                        函数类型: {selectedFunction.stateMutability || 'nonpayable'}
                      </Text>
                      
                      {selectedFunction.inputs.map((input, index) => (
                        <FormControl key={index} isRequired>
                          <FormLabel>
                            {input.name || `参数 ${index + 1}`} ({input.type})
                          </FormLabel>
                          <Input
                            value={functionParams[index]}
                            onChange={(e) => handleParamChange(index, e.target.value)}
                            placeholder={getTypeHint(input.type)}
                          />
                          <FormHelperText>
                            {getTypeDescription(input.type)}
                          </FormHelperText>
                        </FormControl>
                      ))}
                      
                      <Button
                        colorScheme="teal"
                        onClick={callContractMethod}
                        isDisabled={!selectedFunction || functionParams.some(param => param === '') || isLoading}
                        isLoading={isLoading}
                        loadingText={selectedFunction?.stateMutability === 'view' ? '查询中...' : '交易确认中...'}
                        w="full"
                        mt={4}
                      >
                        {selectedFunction?.stateMutability === 'view' ? '查询' : '发送交易'} {selectedFunction?.name}
                      </Button>
                    </>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>

          {/* 交易历史区域 */}
          <Accordion allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    交易历史 ({transactions.length})
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                {transactions.length > 0 ? (
                  <VStack spacing={2} align="stretch">
                    {transactions.map((tx, index) => (
                      <TransactionItem key={index} transaction={tx} />
                    ))}
                  </VStack>
                ) : (
                  <Text color="gray.500">暂无交易记录</Text>
                )}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* 添加交易状态显示 */}
          {pendingTx && (
            <Alert status="info">
              <AlertIcon />
              <Box>
                <Text>交易理中...</Text>
                <Text fontSize="sm">
                  交易哈希: {formatHash(pendingTx)}
                </Text>
              </Box>
            </Alert>
          )}

          {/* 显示最后一次调用结果 */}
          {lastCallResult && (
            <Alert status={lastCallResult.success ? 'success' : 'error'}>
              <AlertIcon />
              <Box flex="1">
                <Text>
                  {lastCallResult.success ? '调用成功' : '调用失败'}
                </Text>
                {lastCallResult.data && (
                  <Text fontSize="sm">
                    返回值: {formatCallResult(lastCallResult.data)}
                  </Text>
                )}
                {lastCallResult.error && (
                  <Text fontSize="sm">
                    错误: {lastCallResult.error}
                  </Text>
                )}
              </Box>
            </Alert>
          )}
        </VStack>
      </Box>
    </ChakraProvider>
  );
};

export default ContractInteractor;
