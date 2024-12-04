#!/bin/bash

echo "🔍 开始项目全面检查 🔍"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # 无颜色

# 功能检查函数
check_feature() {
    if [ "$2" = true ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

# 检查钱包连接功能
wallet_connect=$(grep -q "connectWallet" src/ContractInteractor.tsx && echo true || echo false)
check_feature "钱包连接" $wallet_connect

# 检查消息签名功能
message_sign=$(grep -q "signMessage" src/ContractInteractor.tsx && echo true || echo false)
check_feature "消息签名" $message_sign

# 检查链切换功能
chain_switch=$(grep -q "switchChain" src/ContractInteractor.tsx && echo true || echo false)
check_feature "链切换" $chain_switch

# 检查 ABI 解析
abi_parse=$(grep -q "parseAbi" src/App.tsx && echo true || echo false)
check_feature "ABI 解析" $abi_parse

# 代码风格检查
echo -e "\n${YELLOW}代码风格检查:${NC}"
npx eslint src/**/*.{ts,tsx} || true

# 类型检查
echo -e "\n${YELLOW}TypeScript 类型检查:${NC}"
npx tsc --noEmit

# 依赖安全性
echo -e "\n${YELLOW}依赖安全性检查:${NC}"
npm audit || true

echo -e "\n🏁 项目检查完成 🏁"
