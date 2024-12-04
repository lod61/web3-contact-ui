import { describe, it, expect, vi } from 'vitest';
import { validateParam, formatAddress } from '../web3';

describe('web3 utils', () => {
  describe('validateParam', () => {
    it('should validate address correctly', () => {
      expect(validateParam('address', '0x1234....')).toBe(true);
      expect(validateParam('address', 'invalid')).toBe(false);
    });

    it('should validate numbers correctly', () => {
      expect(validateParam('uint256', '123')).toBe(true);
      expect(validateParam('uint256', 'abc')).toBe(false);
    });
  });

  describe('formatAddress', () => {
    it('should format address correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(formatAddress(address)).toBe('0x1234...5678');
    });
  });
}); 