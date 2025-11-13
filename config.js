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
    // 优先使用环境变量，生产环境使用相对路径以便配合Vercel重写规则
    apiUrl: isProduction ? 
      process.env.COMFYUI_URL || process.env.COMFYUI_API_URL || '/comfy' : 
      process.env.COMFYUI_URL || process.env.COMFYUI_API_URL || 'http://117.50.83.222:8188',
    timeout: 30000, // 请求超时时间（毫秒）
    workflowDir: path.join(__dirname, 'comfyui_workflows'),
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000 // 重试延迟（毫秒）
    }
  }
};