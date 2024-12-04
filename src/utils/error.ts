export class ContractError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ContractError';
  }

  static fromError(error: unknown): ContractError {
    if (error instanceof ContractError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new ContractError(error.message, 'UNKNOWN_ERROR');
    }
    
    return new ContractError('未知错误', 'UNKNOWN_ERROR');
  }
}

export const errorMessages = {
  WALLET_NOT_FOUND: '请安装 MetaMask 钱包',
  NETWORK_ERROR: '网络连接错误',
  CONTRACT_ERROR: '合约调用失败',
  INVALID_PARAMS: '无效的参数',
  // ...其他错误类型
} as const; 