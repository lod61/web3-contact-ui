# Web3 合约 UI

该项目是一个用于与以太坊智能合约交互的网页界面。它允许用户连接他们的 MetaMask 钱包，签署消息，在以太坊兼容链之间切换，并通过提供 ABI 和地址与智能合约进行交互。

## 功能

- **连接钱包**：使用 MetaMask 连接您的以太坊钱包。
- **签署消息**：使用您的钱包签署任意消息。
- **切换链**：在以太坊兼容链之间切换（例如，以太坊主网，Ropsten 等）。
- **与合约交互**：输入合约 ABI 和地址，以动态生成用于与合约交互的 UI。

## 入门指南

该项目使用 [Create React App](https://github.com/facebook/create-react-app) 引导创建。

### 可用脚本

在项目目录中，您可以运行：

#### `npm start`

在开发模式下运行应用程序。\
打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看。

如果您进行编辑，页面将重新加载。\
您还将在控制台中看到任何 lint 错误。

#### `npm test`

以交互式监视模式启动测试运行器。\
有关更多信息，请参阅关于 [运行测试](https://facebook.github.io/create-react-app/docs/running-tests) 的部分。

#### `npm run build`

将应用程序构建为生产环境的 `build` 文件夹。\
它在生产模式下正确打包 React，并优化构建以获得最佳性能。

构建被缩小，文件名包括哈希。\
您的应用程序已准备好部署！

有关更多信息，请参阅关于 [部署](https://facebook.github.io/create-react-app/docs/deployment) 的部分。

## 设置说明

1. 克隆存储库。
2. 运行 `npm install` 以安装依赖项。
3. 使用 `npm start` 启动开发服务器。

## 依赖项

- React
- Chakra UI
- Ethers.js
- MetaMask

## 注意

确保在您的浏览器中安装 MetaMask 以使用钱包功能。
