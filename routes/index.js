const express = require('express');
const router = express.Router();
const path = require('path');
const comfyUIController = require('../controllers/index');

// 环境检测，根据环境选择适当的静态文件处理方式
const isVercel = process.env.VERCEL === '1';

// 在Vercel环境中，静态文件由Vercel平台直接处理
// 在非Vercel环境中，提供静态文件服务
if (!isVercel) {
  // 只在本地或非Vercel环境提供静态文件
  router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  });
  
  // 提供其他HTML页面
  router.get('/more.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'more.html'));
  });
} else {
  // Vercel环境中，让Vercel处理静态文件，这里只提供路由占位符
  router.get('/', (req, res, next) => {
    // 在Vercel中，这个路由会被vercel.json中的重写规则处理
    // 这里只是为了保持代码完整性
    next();
  });
}

// 确保API路由与控制器方法名称一致
// 提交任务到队列
router.post('/api/submit', (req, res) => {
  // 重定向到正确的方法名
  comfyUIController.submitToQueue(req, res);
});

// 获取任务状态
router.get('/api/job-status', comfyUIController.getJobStatus);

// 获取队列统计信息
router.get('/api/queue-stats', comfyUIController.getQueueStats);

// ComfyUI相关路由
router.get('/comfyui/status', comfyUIController.checkComfyUIStatus);
router.get('/comfyui/workflow/validate', comfyUIController.validateWorkflow);
router.post('/comfyui/submit', comfyUIController.submitPrompt);
router.get('/comfyui/result', comfyUIController.fetchResultOnce);

// 健康检查端点，用于Vercel监控
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;