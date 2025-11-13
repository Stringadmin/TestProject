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

        const result = await comfyuiService.submitComfyUIPrompt(job.prompt, null, 'test', 'comfyui_workflows/test.json');
        job.status = 'completed';
        job.result = result;
        jobs.set(jobId, job);
        console.log(`Job ${jobId} completed successfully.`);
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