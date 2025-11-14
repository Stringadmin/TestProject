const { v4: uuidv4 } = require('uuid');
const comfyuiService = require('./services');

const queue = [];
let isProcessing = false;
const jobs = new Map();

async function processQueue() {
    if (isProcessing || queue.length === 0) {
        return;
    }
    isProcessing = true;
    const jobId = queue.shift();
    const job = jobs.get(jobId);

    if (!job) {
        isProcessing = false;
        return processQueue();
    }

    try {
        console.log(`Processing job ${jobId}...`);
        job.status = 'processing';
        jobs.set(jobId, job);

        // 1. 提交任务到ComfyUI，获取promptId
        const submitResult = await comfyuiService.submitComfyUIPrompt(job.prompt, null, 'test', 'comfyui_workflows/test.json');
        const promptId = submitResult.promptId;
        console.log(`Job ${jobId} submitted with promptId: ${promptId}`);
        
        // 2. 轮询等待结果
        const maxWaitTime = 300000; // 5分钟
        const pollInterval = 2500; // 每2.5秒检查一次
        const startTime = Date.now();
        let images = [];
        
        while (Date.now() - startTime < maxWaitTime) {
            const result = await comfyuiService.fetchComfyUIResultOnce(promptId);
            
            if (result.ready && result.images && result.images.length > 0) {
                images = result.images;
                console.log(`Job ${jobId} completed with ${images.length} images`);
                break;
            }
            
            if (result.error) {
                console.warn(`Job ${jobId} polling warning:`, result.error);
            }
            
            // 等待后再次检查
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        if (images.length === 0) {
            throw new Error('ComfyUI任务超时或未生成图片');
        }
        
        job.status = 'completed';
        job.result = {
            generatedImages: images,
            images: images, // 同时提供两种字段名，确保兼容性
            promptId: promptId,
            executionTime: Date.now() - startTime
        };
        jobs.set(jobId, job);
        console.log(`Job ${jobId} completed successfully with result:`, JSON.stringify(job.result, null, 2));
    } catch (error) {
        console.error(`Job ${jobId} failed:`, error);
        job.status = 'failed';
        job.error = error.message;
        jobs.set(jobId, job);
    } finally {
        isProcessing = false;
        processQueue();
    }
}

function addJob(prompt, workflow) {
    const jobId = uuidv4();
    const job = {
        id: jobId,
        status: 'pending',
        prompt,
        workflow,
        position: queue.length + 1,
        createdAt: new Date(),
    };
    jobs.set(jobId, job);
    queue.push(jobId);
    console.log(`Job ${jobId} added to the queue. Position: ${job.position}`);
    processQueue();
    return jobId;
}

function getJobStatus(jobId) {
    const job = jobs.get(jobId);
    if (!job) {
        return null;
    }
    if (job.status === 'pending') {
        const currentPosition = queue.findIndex(id => id === jobId) + 1;
        return { ...job, position: currentPosition };
    }
    return job;
}

module.exports = {
    addJob,
    getJobStatus,
};