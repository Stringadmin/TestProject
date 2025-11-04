const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const config = require('../config');

// 连接状态缓存 (5秒有效期)
const connectionCache = {
    lastCheck: 0,
    status: null,
    expireTime: 5000 // 5秒缓存
};

// 日志记录器
const logger = {
    logRequest: (method, url, data, headers) => {
        console.log(`[${new Date().toISOString()}] Request: ${method} ${url}`, {
            data: data,
            headers: headers
        });
    },
    logResponse: (response) => {
        console.log(`[${new Date().toISOString()}] Response: ${response.status} ${response.statusText}`, {
            data: response.data,
            headers: response.headers
        });
    },
    logError: (error) => {
        console.error(`[${new Date().toISOString()}] Error: ${error.message}`, {
            stack: error.stack,
            code: error.code,
            config: error.config,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : null
        });
    }
};

// ComfyUI配置 - 从config.js获取
const COMFYUI_CONFIG = {
    API_URL: (config.comfyUI.apiUrl || '').trim(), // 初始化时就去除空格
    PROMPT_ENDPOINT: 'prompt',
    UPLOAD_ENDPOINT: 'upload/image',
    HISTORY_ENDPOINT: 'history',
    TIMEOUT: config.comfyUI.timeout,
    WORKFLOW_DIR: path.join(__dirname, '..', config.comfyUI.workflowDir)
};

// 检查ComfyUI连接状态 (增强版本)
exports.checkComfyUIConnection = async () => {
    // 强制清除缓存，确保使用最新的URL处理
    connectionCache.status = null;
    
    // 确保COMFYUI_CONFIG.API_URL不包含空格
    if (COMFYUI_CONFIG.API_URL) {
        COMFYUI_CONFIG.API_URL = COMFYUI_CONFIG.API_URL.trim();
    }

    try {
        console.log(`[${new Date().toISOString()}] 检查ComfyUI连接: ${COMFYUI_CONFIG.API_URL}`);
        
        // 保存原始URL用于调试
        const originalUrl = COMFYUI_CONFIG.API_URL;
        
        // 尝试多种连接方式，增加可靠性
        let response;
        let attemptUrl = originalUrl;
        
        // 尝试1: 直接访问根路径
        try {
            console.log(`[${new Date().toISOString()}] 尝试连接1: ${attemptUrl}`);
            response = await axios.get(attemptUrl, {
                timeout: 5000,
                validateStatus: function (status) {
                    // 接受任何状态码，只要连接成功就认为服务正常
                    return status >= 200 && status < 600;
                }
            });
        } catch (firstAttemptError) {
            // 尝试2: 添加斜杠
            if (!originalUrl.endsWith('/')) {
                attemptUrl = originalUrl + '/';
                console.log(`[${new Date().toISOString()}] 尝试连接2: ${attemptUrl} (添加了斜杠)`);
                try {
                    response = await axios.get(attemptUrl, {
                        timeout: 5000,
                        validateStatus: function (status) {
                            return status >= 200 && status < 600;
                        }
                    });
                } catch (secondAttemptError) {
                    // 尝试3: 直接访问queue接口
                    attemptUrl = originalUrl.endsWith('/') ? 
                        `${originalUrl}queue` : 
                        `${originalUrl}/queue`;
                    console.log(`[${new Date().toISOString()}] 尝试连接3: ${attemptUrl} (queue接口)`);
                    response = await axios.get(attemptUrl, {
                        timeout: 5000,
                        validateStatus: function (status) {
                            return status >= 200 && status < 600;
                        }
                    });
                }
            } else {
                throw firstAttemptError;
            }
        }
        
        console.log(`[${new Date().toISOString()}] ComfyUI连接成功: ${attemptUrl}, HTTP ${response.status}`);
        
        // 尝试获取版本信息（如果响应包含）
        let version = '1.28.7'; // 默认值
        if (response.data && response.data.version) {
            version = response.data.version;
        }
        
        const status = {
            connected: true,
            version: version,
            status: 'running',
            httpStatus: response.status,
            url: attemptUrl.trim(), // 去除URL两端的空格
            timestamp: new Date().toISOString()
        };
        
        // 更新缓存
        connectionCache.status = status;
        connectionCache.lastCheck = Date.now();
        
        return status;
        
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ComfyUI连接失败:`, {
            message: error.message,
            code: error.code,
            config: error.config ? { url: error.config.url } : null,
            response: error.response ? { status: error.response.status } : null
        });
        
        const errorResult = {
            connected: false,
            error: `无法连接到ComfyUI服务: ${error.message}`,
            status: 'disconnected',
            errorCode: error.code,
            url: COMFYUI_CONFIG.API_URL.trim(), // 去除URL两端的空格
            timestamp: new Date().toISOString()
        };
        
        // 更新缓存为错误状态
        connectionCache.status = errorResult;
        connectionCache.lastCheck = Date.now();
        
        return errorResult;
    }
};

// 上传图片到ComfyUI
exports.uploadImageToComfyUI = async (imageBuffer, filename) => {
    try {
        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: filename,
            contentType: 'image/jpeg'
        });

        // 使用更安全的URL拼接方法
        const apiUrl = COMFYUI_CONFIG.API_URL.replace(/\/$/, ''); // 确保没有尾部斜杠
        const uploadUrl = `${apiUrl}/${COMFYUI_CONFIG.UPLOAD_ENDPOINT}`;
        
        const response = await axios.post(
            uploadUrl,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: COMFYUI_CONFIG.TIMEOUT
            }
        );

        return response.data;
    } catch (error) {
        throw new Error(`图片上传失败: ${error.message}`);
    }
};

// 处理ComfyUI请求（适配1.28.7版本）
exports.processComfyUIRequest = async (prompt, designImage, workflowName, workflowPath) => {
    try {
        // 1. 检查ComfyUI连接状态
        const connectionStatus = await exports.checkComfyUIConnection();
        if (!connectionStatus.connected) {
            throw new Error(`ComfyUI连接失败: ${connectionStatus.error}`);
        }

        // 2. 解析工作流模板路径：优先使用传入的绝对路径；其次使用配置目录 + 名称
        const candidatePaths = [];
        const normalizedPath = workflowPath ? path.normalize(workflowPath) : null;
        if (normalizedPath) {
            const provided = path.isAbsolute(normalizedPath)
                ? normalizedPath
                : path.resolve(__dirname, '..', normalizedPath);
            candidatePaths.push(provided);
            // 兼容以服务启动目录为基准的相对路径
            if (!path.isAbsolute(normalizedPath)) {
                candidatePaths.push(path.resolve(process.cwd(), normalizedPath));
            }
        }
        if (workflowName) {
            candidatePaths.push(path.join(COMFYUI_CONFIG.WORKFLOW_DIR, `${workflowName}.json`));
            // 额外回退：项目根目录同名文件
            candidatePaths.push(path.resolve(__dirname, '..', `${workflowName}.json`));
        }
        console.log('[ComfyUI Request] name=%s, path=%s, candidates=%o', workflowName, workflowPath, candidatePaths);
        const finalPath = candidatePaths.find(p => {
            try { return !!p && fs.existsSync(p); } catch { return false; }
        });
        console.log('[ComfyUI Request] finalPath=%s', finalPath);
        if (!finalPath) {
            throw new Error(`工作流模板不存在：${workflowName || workflowPath}`);
        }
        const workflow = JSON.parse(fs.readFileSync(finalPath, 'utf8'));

        // 检测工作流文件格式（UI工作流 vs API Prompt）
        const isUIPrompt = workflow && Array.isArray(workflow.nodes);
        const isAPIPrompt = workflow && !isUIPrompt && Object.values(workflow).some(v => v && typeof v === 'object' && v.class_type && v.inputs);
        if (isUIPrompt && !isAPIPrompt) {
            throw new Error('工作流文件为UI工作流格式，需转换为API Prompt格式（包含class_type/inputs结构）。请在ComfyUI中导出正确的Prompt格式JSON或提供已转换文件。');
        }

        // 3. 注入提示词到工作流（如果提供了prompt且为API Prompt格式）
        if (isAPIPrompt && typeof prompt === 'string' && prompt.trim()) {
            try {
                for (const nodeId of Object.keys(workflow)) {
                    const node = workflow[nodeId];
                    if (node && typeof node === 'object' && /CLIPTextEncode/i.test(node.class_type)) {
                        if (!node.inputs) node.inputs = {};
                        node.inputs.text = prompt.trim();
                    }
                }
                console.log('[ComfyUI Request] 提示词已注入到CLIPTextEncode节点');
            } catch (e) {
                console.warn('提示词注入失败，不影响执行：', e.message);
            }
        }

        // 4. 准备API请求数据（适配1.28.7 API格式）
        const payload = {
            prompt: workflow,
            client_id: 'archvisualizer-web'
        };

        // 4. 调用ComfyUI API
        // 使用更安全的URL拼接方法
        const apiUrl = COMFYUI_CONFIG.API_URL.replace(/\/$/, ''); // 确保没有尾部斜杠
        const fullUrl = `${apiUrl}/${COMFYUI_CONFIG.PROMPT_ENDPOINT}`;
        
        logger.logRequest('POST', fullUrl, payload, { 'Content-Type': 'application/json' });
        let response;
        try {
            response = await axios.post(
                fullUrl,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: COMFYUI_CONFIG.TIMEOUT
                }
            );
            logger.logResponse(response);
        } catch (error) {
            logger.logError(error);
            throw error;
        }

        // 5. 获取执行结果
        if (response.data && response.data.prompt_id) {
            const promptId = response.data.prompt_id;
            const result = await exports.waitForComfyUIResult(promptId);
            return {
                generatedImages: result.images,
                status: 'success',
                workflow: workflowName || path.basename(finalPath, '.json'),
                promptId: promptId,
                executionTime: result.executionTime
            };
        } else {
            throw new Error('ComfyUI API返回无效数据');
        }
    } catch (error) {
        console.error('ComfyUI交互错误:', error);
        if (error.code === 'ECONNABORTED') {
            throw new Error('ComfyUI API请求超时');
        } else if (error.response) {
            throw new Error(`ComfyUI API错误: ${error.response.status} - ${error.response.data}`);
        } else {
            throw new Error(`ComfyUI处理失败: ${error.message}`);
        }
    }
};

// 等待ComfyUI任务完成
exports.waitForComfyUIResult = async (promptId, maxWaitTime = 300000) => { // 5分钟最大等待时间
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            // 使用更安全的URL拼接方法
            const apiUrl = COMFYUI_CONFIG.API_URL.replace(/\/$/, ''); // 确保没有尾部斜杠
            const historyUrl = `${apiUrl}/${COMFYUI_CONFIG.HISTORY_ENDPOINT}/${promptId}`;
            
            const response = await axios.get(
                historyUrl,
                { timeout: 10000 }
            );
            
            if (response.data && response.data[promptId]) {
                const output = response.data[promptId].outputs;
                
                // 检查是否有图片输出
                for (const nodeId in output) {
                    if (output[nodeId].images && output[nodeId].images.length > 0) {
                        const images = output[nodeId].images.map(img => ({
                            filename: img.filename,
                            subfolder: img.subfolder,
                            type: img.type,
                            url: `${apiUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
                        }));
                        
                        return {
                            images: images,
                            executionTime: Date.now() - startTime
                        };
                    }
                }
            }
            
            // 等待2秒后重试
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            if (Date.now() - startTime > maxWaitTime) {
                throw new Error('ComfyUI任务执行超时');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    throw new Error('ComfyUI任务执行超时');
};

// 校验工作流模板是否存在，并返回路径信息
exports.validateWorkflow = async (workflowName, workflowPath) => {
    try {
        // 按优先级检查：给定绝对/相对路径 -> 配置目录 + 名称
        const candidates = [];
        const normalizedPath = workflowPath ? path.normalize(workflowPath) : null;
        if (normalizedPath) {
            candidates.push(path.isAbsolute(normalizedPath) ? normalizedPath : path.resolve(__dirname, '..', normalizedPath));
            if (!path.isAbsolute(normalizedPath)) {
                candidates.push(path.resolve(process.cwd(), normalizedPath));
            }
        }
        if (workflowName) {
            candidates.push(path.join(COMFYUI_CONFIG.WORKFLOW_DIR, `${workflowName}.json`));
            // 额外回退：项目根目录同名文件
            candidates.push(path.resolve(__dirname, '..', `${workflowName}.json`));
        }
        console.log('[Workflow Validate] name=%s, path=%s, candidates=%o', workflowName, workflowPath, candidates);
        const found = candidates.find(p => {
            try { return !!p && fs.existsSync(p); } catch { return false; }
        });
        console.log('[Workflow Validate] found=%s', found);
        if (found) {
            return { exists: true, name: workflowName || path.basename(found, '.json'), path: found, dir: path.dirname(found) };
        }
        return { exists: false, name: workflowName || null, path: workflowPath || path.join(COMFYUI_CONFIG.WORKFLOW_DIR, `${workflowName || ''}.json`) };
    } catch (err) {
        return { exists: false, name: workflowName || null, path: workflowPath || null, error: err.message };
    }
};

// 提交任务，仅返回 prompt_id（不长等待）
exports.submitComfyUIPrompt = async (prompt, designImage, workflowName, workflowPath) => {
    // 基于 processComfyUIRequest 的前半段逻辑，但不等待结果
    // 1. 检查连接
    const connectionStatus = await exports.checkComfyUIConnection();
    if (!connectionStatus.connected) {
        throw new Error(`ComfyUI连接失败: ${connectionStatus.error}`);
    }

    // 2. 定位工作流
    const candidatePaths = [];
    const normalizedPath = workflowPath ? path.normalize(workflowPath) : null;
    if (normalizedPath) {
        const provided = path.isAbsolute(normalizedPath)
            ? normalizedPath
            : path.resolve(__dirname, '..', normalizedPath);
        candidatePaths.push(provided);
        if (!path.isAbsolute(normalizedPath)) {
            candidatePaths.push(path.resolve(process.cwd(), normalizedPath));
        }
    }
    if (workflowName) {
        candidatePaths.push(path.join(COMFYUI_CONFIG.WORKFLOW_DIR, `${workflowName}.json`));
        candidatePaths.push(path.resolve(__dirname, '..', `${workflowName}.json`));
    }
    const finalPath = candidatePaths.find(p => {
        try { return !!p && fs.existsSync(p); } catch { return false; }
    });
    if (!finalPath) {
        throw new Error(`工作流模板不存在：${workflowName || workflowPath}`);
    }
    const workflow = JSON.parse(fs.readFileSync(finalPath, 'utf8'));

    // 3. 注入提示词（若可能）
    const isUIPrompt = workflow && Array.isArray(workflow.nodes);
    const isAPIPrompt = workflow && !isUIPrompt && Object.values(workflow).some(v => v && typeof v === 'object' && v.class_type && v.inputs);
    if (isUIPrompt && !isAPIPrompt) {
        throw new Error('工作流文件为UI工作流格式，需转换为API Prompt格式（包含class_type/inputs结构）。');
    }
    if (isAPIPrompt && typeof prompt === 'string' && prompt.trim()) {
        try {
            for (const nodeId of Object.keys(workflow)) {
                const node = workflow[nodeId];
                if (node && typeof node === 'object' && /CLIPTextEncode/i.test(node.class_type)) {
                    if (!node.inputs) node.inputs = {};
                    node.inputs.text = prompt.trim();
                }
            }
        } catch (_) {}
    }

    // 4. 提交任务并返回 prompt_id
    const payload = { prompt: workflow, client_id: 'archvisualizer-web' };
    // 使用更安全的URL拼接方法
    const apiUrl = COMFYUI_CONFIG.API_URL.replace(/\/$/, ''); // 确保没有尾部斜杠
    const fullUrl = `${apiUrl}/${COMFYUI_CONFIG.PROMPT_ENDPOINT}`;
    
    logger.logRequest('POST', fullUrl, payload, { 'Content-Type': 'application/json' });
    const response = await axios.post(
        fullUrl,
        payload,
        { headers: { 'Content-Type': 'application/json' }, timeout: COMFYUI_CONFIG.TIMEOUT }
    );
    logger.logResponse(response);
    if (!response.data || !response.data.prompt_id) {
        throw new Error('ComfyUI 未返回 prompt_id');
    }
    return { promptId: response.data.prompt_id };
};

// 单次查询任务结果（不阻塞长时间）
exports.fetchComfyUIResultOnce = async (promptId) => {
    try {
        if (!promptId) throw new Error('缺少 promptId');
        
        // 使用统一的URL拼接方法
        const apiUrl = COMFYUI_CONFIG.API_URL.replace(/\/$/, ''); // 确保没有尾部斜杠
        const historyUrl = `${apiUrl}/${COMFYUI_CONFIG.HISTORY_ENDPOINT}/${encodeURIComponent(promptId)}`;
        
        logger.logRequest('GET', historyUrl, null, {});
        const response = await axios.get(
            historyUrl,
            {
                timeout: 8000,
                validateStatus: function (status) {
                    // 接受任何状态码，以便处理各种情况
                    return status >= 200 && status < 600;
                }
            }
        );
        logger.logResponse(response);
        
        if (response.data && response.data[promptId]) {
            const output = response.data[promptId].outputs || {};
            for (const nodeId in output) {
                if (output[nodeId].images && output[nodeId].images.length > 0) {
                    const images = output[nodeId].images.map(img => ({
                        filename: img.filename,
                        subfolder: img.subfolder,
                        type: img.type,
                        // 使用更安全的URL构建方法，确保API_URL和view端点之间有正确的分隔
                        url: new URL(`/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder)}&type=${encodeURIComponent(img.type)}`, apiUrl).href
                    }));
                    return { ready: true, images };
                }
            }
        }
        return { ready: false };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 查询ComfyUI结果失败:`, error.message);
        // 出错时也返回ready: false而不是抛出异常，以便前端可以继续轮询
        return { ready: false, error: error.message };
    }
};

module.exports = exports;