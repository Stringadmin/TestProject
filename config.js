module.exports = {
  port: 3000,
  database: {
    host: 'localhost',
    port: 27017,
    name: 'mydb'
  },
  jwtSecret: 'your-secret-key',
  comfyUI: {
    apiUrl: process.env.COMFYUI_API_URL || 'http://127.0.0.1:8188',
    timeout: process.env.COMFYUI_TIMEOUT || 180000,
    workflowDir: process.env.COMFYUI_WORKFLOW_DIR || 'comfyui_workflows'
  }
};