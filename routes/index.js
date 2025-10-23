const express = require('express');
const router = express.Router();
const comfyUIController = require('../controllers/index');

// ComfyUI 路由
router.post('/comfyui/generate', comfyUIController.generateWithComfyUI);
router.get('/comfyui/status', comfyUIController.checkComfyUIStatus);
router.get('/comfyui/workflow/validate', comfyUIController.validateWorkflow);

module.exports = router;