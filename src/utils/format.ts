import { ethers } from 'ethers';

// 格式化哈希值
export const formatHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// 格式化调用结果
export const formatCallResult = (data: unknown): string => {
  if (data === null || data === undefined) {
    return '无数据';
  }

  if (typeof data === 'object') {
    if (data instanceof ethers.Contract) {
      return '合约对象';
    }
    return JSON.stringify(data, null, 2);
  }

  return String(data);
};

// 获取类型描述
export const getTypeDescription = (type: string): string => {
  switch (type) {
    case 'uint256':
    case 'uint':
      return '无符号整数，例如: 123';
    case 'int256':
    case 'int':
      return '有符号整数，例如: -123';
    case 'address':
      return '以太坊地址，例如: 0x1234...';
    case 'bool':
      return '布尔值: true 或 false';
    case 'string':
      return '字符串';
    case 'bytes':
      return '字节数据，十六进制格式';
    default:
      if (type.endsWith('[]')) {
        return '数组，用逗号分隔';
      }
      return '请按照类型要求输入';
  }
};

// 获取类型提示
export const getTypeHint = (type: string): string => {
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
      if (type.endsWith('[]')) {
        return '数组，用逗号分隔';
      }
      return '请按照类型要求输入';
  }
}; 