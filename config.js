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
  

  
  comfyUI: {
    // 优先从环境变量读取 ComfyUI 地址，环境变量在 vercel.json 中配置
    apiUrl: process.env.COMFYUI_URL || process.env.COMFYUI_API_URL || 'http://117.50.83.222:8188',
    timeout: 30000, // 请求超时时间（毫秒）
    workflowDir: 'comfyui_workflows', // 相对路径，将在services中解析为绝对路径
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000 // 重试延迟（毫秒）
    }
  }
};