import React from 'react';
import { Box, VStack, Button, FormControl, FormLabel, Input, Text } from '@chakra-ui/react';
import { AbiEntry } from '../types';
import { getTypeHint } from '../utils/format';

interface ContractFormProps {
  selectedFunction: AbiEntry | null;
  functionParams: string[];
  onParamChange: (index: number, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const ContractForm = React.memo<ContractFormProps>(({
  selectedFunction,
  functionParams,
  onParamChange,
  onSubmit,
  isLoading
}) => {
  if (!selectedFunction) return null;

  const isView = selectedFunction.stateMutability === 'view';
  const isValid = functionParams.every(param => param.trim() !== '');

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <VStack spacing={4}>
        <Text fontSize="sm" color="gray.600">
          {selectedFunction.name} ({selectedFunction.stateMutability})
        </Text>
        
        {selectedFunction.inputs.map((input, index) => (
          <FormControl key={index} isRequired>
            <FormLabel>
              {input.name || `参数 ${index + 1}`} ({input.type})
            </FormLabel>
            <Input
              value={functionParams[index]}
              onChange={(e) => onParamChange(index, e.target.value)}
              placeholder={getTypeHint(input.type)}
            />
          </FormControl>
        ))}

        <Button
          colorScheme={isView ? 'blue' : 'green'}
          onClick={onSubmit}
          isDisabled={!isValid || isLoading}
          isLoading={isLoading}
          loadingText={isView ? '查询中...' : '交易确认中...'}
          w="full"
        >
          {isView ? '查询' : '发送交易'}
        </Button>
      </VStack>
    </Box>
  );
});

ContractForm.displayName = 'ContractForm'; 