// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

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
    // 在生产环境中使用'/comfy'（通过Vercel代理），在开发环境中直接连接到Cloudflare隧道
    apiUrl: process.env.COMFYUI_API_URL || (isProduction ? 'https://comfyui.oopshub.cn' : 'https://comfyui.oopshub.cn'),
    timeout: process.env.COMFYUI_TIMEOUT || 180000,
    workflowDir: process.env.COMFYUI_WORKFLOW_DIR || 'comfyui_workflows',
    // 添加重试配置以提高连接稳定性
    retryConfig: {
      maxRetries: 3,
      retryDelay: 2000
    }
  }
};