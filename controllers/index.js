const comfyUIService = require('../services/index');

exports.generateWithComfyUI = async (req, res) => {
    try {
        const { prompt, designImage, workflow, workflowPath } = req.body;
        const result = await comfyUIService.processComfyUIRequest(prompt, designImage, workflow, workflowPath);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkComfyUIStatus = async (req, res) => {
    try {
        const status = await comfyUIService.checkComfyUIConnection();
        res.status(200).json(status);
    } catch (error) {
        res.status(200).json({
            connected: false,
            error: error.message,
            status: 'disconnected'
        });
    }
};

// 校验工作流是否存在
exports.validateWorkflow = async (req, res) => {
    try {
        const name = (req.query.name || req.body.name || req.body.workflow || '').trim();
        const wpath = (req.query.path || req.body.path || req.body.workflowPath || '').trim();
        const result = await comfyUIService.validateWorkflow(name, wpath);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ exists: false, message: error.message });
    }
};