// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';
const path = require('path');

module.exports = {
  // 应用配置
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // 翻译服务配置
  translation: {
    // 这里可以配置不同的翻译服务
    provider: 'youdao',
    endpoint: 'https://openapi.youdao.com/api'
  },
  
  // 网易有道翻译API配置
  youdao: {
    appKey: 'mBD80PCSZNYgP45c6qwUwgDWbsiycF',
    appSecret: 'mBD80PCSZNYgP45c6qwUwgDWbsiycF'
  },
  
  database: {
    host: 'localhost',
    port: 27017,
    name: 'mydb'
  },
  
  jwtSecret: 'your-secret-key',
  
  comfyUI: {
    // 所有环境都使用公网IP地址
    apiUrl: process.env.COMFYUI_URL || process.env.COMFYUI_API_URL || 'http://117.50.83.222:8188',
    timeout: 30000, // 请求超时时间（毫秒）
    workflowDir: path.join(__dirname, 'comfyui_workflows'),
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000 // 重试延迟（毫秒）
    }
  }
};