// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';
const path = require('path');

module.exports = {
  // 应用配置
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    host: 'localhost',
    port: 27017,
    name: 'mydb'
  },
  
  jwtSecret: 'your-secret-key',
  
  comfyUI: {
    // 支持多个环境变量，优先使用Vercel环境变量
    apiUrl: process.env.COMFYUI_URL || process.env.COMFYUI_API_URL || process.env.VERCEL_COMFYUI_URL || process.env.REACT_APP_COMFYUI_URL || 'http://117.50.83.222:8188',
    timeout: parseInt(process.env.COMFYUI_TIMEOUT || '30000', 10), // 请求超时时间（毫秒）
    workflowDir: path.join(__dirname, 'comfyui_workflows'),
    retryConfig: {
      maxRetries: parseInt(process.env.COMFYUI_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.COMFYUI_RETRY_DELAY || '2000', 10) // 重试延迟（毫秒）
    }
  }
};