const express = require('express');
const router = express.Router();
const path = require('path');
const comfyUIController = require('../controllers/index');

// Serve static index.html for GET /
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// New API routes for job queue and services
router.post('/api/submit', comfyUIController.submitJob);
router.get('/api/job-status', comfyUIController.getJobStatus);
router.post('/api/translate', comfyUIController.translateText);

// Keep other existing and necessary routes
router.get('/comfyui/status', comfyUIController.checkComfyUIStatus);
router.get('/comfyui/workflow/validate', comfyUIController.validateWorkflow);

module.exports = router;