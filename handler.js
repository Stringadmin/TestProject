const app = require('./app');
const serverless = require('serverless-http');

// 配置serverless-http以优化Vercel性能
const serverlessOptions = {
  // 启用二进制支持，处理图像等二进制数据
  binary: ['*/*'],
  // 配置响应体大小限制
  response: {
    contentLengthHeader: false // Vercel会自动设置正确的Content-Length
  },
  // 保留原有的路径解析行为
  preserveStage: false
};

// 使用serverless-http包装Express应用，适配Vercel无服务器环境
module.exports.handler = serverless(app, serverlessOptions);

// 导出app以便在需要时直接使用
module.exports.app = app;