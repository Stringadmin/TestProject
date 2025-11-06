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
        console.log('收到/comfyui/status请求');
        const status = await comfyUIService.checkComfyUIConnection();
        console.log('ComfyUI连接检查结果:', status);
        // 手动构建JSON字符串，确保完全没有多余空格
        const cleanUrl = (status.url || '').replace(/\s+/g, ''); // 移除所有空白字符
        const jsonString = `{"connected":${status.connected},"version":"${status.version || '1.28.7'}","status":"${status.status}","httpStatus":${status.httpStatus || 200},"url":"${cleanUrl}","timestamp":"${new Date().toISOString()}"}`;
        
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(jsonString);
    } catch (error) {
        console.error('检查ComfyUI连接状态失败:', error);
        // 错误情况下也手动构建JSON字符串
        const jsonString = `{"connected":false,"error":"${error.message.replace(/"/g, '\\"')}","status":"disconnected"}`;
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(jsonString);
    }
};

// 新增：提交任务，只返回 prompt_id
exports.submitPrompt = async (req, res) => {
    try {
        console.log('================================================');
        console.log('收到/comfyui/submit请求！时间:', new Date().toISOString());
        console.log('请求方法:', req.method);
        console.log('请求URL:', req.originalUrl);
        console.log('请求头:', req.headers);
        console.log('请求体:', req.body);
        
        const { prompt, designImage, workflow, workflowPath } = req.body;
        console.log(`解析到的参数: prompt=${prompt}, designImage=${!!designImage}, workflow=${workflow}, workflowPath=${workflowPath}`);
        
        // 验证必要参数
        if (!prompt) {
            console.error('错误: prompt参数缺失');
            return res.status(400).json({ success: false, message: '提示词不能为空' });
        }
        
        console.log('调用comfyUIService.submitComfyUIPrompt');
        const result = await comfyUIService.submitComfyUIPrompt(prompt, designImage, workflow, workflowPath);
        console.log('服务处理结果:', result);
        
        // 确保将isMock标志传递给前端
        res.status(200).json({ 
            success: true, 
            data: {
                promptId: result.promptId,
                isMock: result.isMock || false
            }
        });
    } catch (error) {
        console.error('提交提示词失败:', { name: error.name, message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: error.message || '提交任务失败' });
    }
};

// 新增：查询一次结果（短超时）
exports.fetchResultOnce = async (req, res) => {
    try {
        const promptId = (req.query.promptId || req.body.promptId || '').trim();
        if (!promptId) return res.status(400).json({ success: false, message: '缺少 promptId' });
        
        console.log(`收到/comfyui/result请求，查询promptId: ${promptId}`);
        
        // 检查是否为模拟promptId
        if (promptId.startsWith('mock_')) {
            console.log(`检测到模拟promptId，调用waitForComfyUIResult获取模拟结果`);
            // 对于模拟promptId，直接调用waitForComfyUIResult获取模拟结果
            const result = await comfyUIService.waitForComfyUIResult(promptId, 5000);
            console.log('模拟结果获取成功:', result);
            res.status(200).json({ success: true, data: result });
        } else {
            // 正常情况调用fetchComfyUIResultOnce
            const result = await comfyUIService.fetchComfyUIResultOnce(promptId);
            res.status(200).json({ success: true, data: result });
        }
    } catch (error) {
        console.error('获取结果失败:', { name: error.name, message: error.message });
        res.status(500).json({ success: false, message: error.message });
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