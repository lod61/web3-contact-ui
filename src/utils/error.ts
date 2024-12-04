export class Web3Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'Web3Error';
  }
}

export const handleWeb3Error = (error: unknown): string => {
  if (error instanceof Web3Error) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
}; 