const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const comfyUIController = require('../controllers/index');

// Serve static index.html for GET /
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 在函数计算环境中使用 /tmp 作为可写目录
const uploadsDir = path.join('/tmp', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  // 目录创建失败时仍允许无上传的请求继续执行
  console.warn('创建上传目录失败:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ComfyUI 路由
router.post('/comfyui/generate', upload.single('file'), comfyUIController.generateWithComfyUI); // 兼容老接口（长等待，不建议在 Vercel 使用）
router.get('/comfyui/status', comfyUIController.checkComfyUIStatus);
router.get('/comfyui/workflow/validate', comfyUIController.validateWorkflow);
// 新增：提交+查询结果（短请求）
router.post('/comfyui/submit', comfyUIController.submitPrompt);
router.get('/comfyui/result', comfyUIController.fetchResultOnce);

module.exports = router;