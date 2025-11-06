// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 27017,
    name: 'mydb'
  },
  jwtSecret: 'your-secret-key',
  translation: {
    // 网易有道翻译API配置
    provider: 'youdao',
    appKey: 'mBD80PCSZNYgP45c6qwUwgDWbstycF', // 从截图中获取的应用密钥
    appSecret: '在此处粘贴您的网易有道翻译API密钥',
    endpoint: 'https://openapi.youdao.com/api'
  },
  comfyUI: {
    // 在生产环境中使用'/comfy'（通过Vercel代理），在开发环境中直接连接到实际服务器
    apiUrl: process.env.COMFYUI_API_URL || (isProduction ? '/comfy' : 'https://comfyui.oopshub.cn'),
    timeout: process.env.COMFYUI_TIMEOUT || 180000,
    workflowDir: process.env.COMFYUI_WORKFLOW_DIR || 'comfyui_workflows'
  }
};