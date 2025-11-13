const express = require('express');
const router = express.Router();
const path = require('path');
const comfyUIController = require('../controllers/index');

// 静态文件服务 - 对于直接访问根路径的情况
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 健康检查端点
router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API路由 - 确保与控制器方法名匹配
router.post('/api/submit', comfyUIController.submitToQueue);
router.get('/api/job-status', comfyUIController.getJobStatus);

// ComfyUI相关路由
router.get('/comfyui/status', comfyUIController.checkComfyUIStatus);
router.post('/comfyui/submit', comfyUIController.submitPrompt);
router.get('/comfyui/result', comfyUIController.fetchResultOnce);
router.get('/comfyui/workflow/validate', comfyUIController.validateWorkflow);

// 队列相关路由
router.post('/queue/submit', comfyUIController.submitToQueue);
router.get('/queue/status', comfyUIController.getJobStatus);
router.get('/queue/stats', comfyUIController.getQueueStats);

module.exports = router;