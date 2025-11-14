// 使用动态import来导入uuid，解决ESM兼容性问题
let uuidv4;

// 预加载uuid模块
(async () => {
  const uuidModule = await import('uuid');
  uuidv4 = uuidModule.v4;
})();

// 备用的UUID生成函数（以防动态导入失败）
function fallbackGenerateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 任务队列管理服务
class QueueService {
  constructor() {
    // 任务状态常量
    this.STATUS = {
      PENDING: 'pending',     // 排队中
      PROCESSING: 'processing', // 处理中
      COMPLETED: 'completed',   // 已完成
      FAILED: 'failed'          // 失败
    };
    
    // 任务队列
    this.queue = [];
    // 正在处理的任务
    this.processingJobs = new Map();
    // 已完成/失败的任务（短期缓存）
    this.completedJobs = new Map();
    // 最大缓存时间（毫秒）
    this.COMPLETED_JOB_CACHE_TIME = 3600000; // 1小时
    
    // 启动工作进程
    this.startWorker();
    // 启动清理过期任务的定时器
    this.startCleanupTimer();
  }
  
  /**
   * 添加任务到队列
   * @param {Object} taskData - 任务数据
   * @returns {Object} 任务信息，包含jobId
   */
  addTask(taskData) {
    // 使用uuidv4，如果未加载完成则使用备用函数
    const jobId = uuidv4 ? uuidv4() : fallbackGenerateUUID();
    const job = {
      jobId,
      status: this.STATUS.PENDING,
      createdAt: new Date(),
      position: this.queue.length + 1,
      data: taskData,
      error: null,
      result: null,
      startTime: null,
      endTime: null
    };
    
    // 添加到队列
    this.queue.push(job);
    console.log(`[Queue] 任务已添加到队列: ${jobId}, 位置: ${job.position}`);
    
    // 更新所有队列中任务的位置
    this.updateQueuePositions();
    
    return { jobId, position: job.position };
  }
  
  /**
   * 获取任务状态
   * @param {string} jobId - 任务ID
   * @returns {Object} 任务状态信息
   */
  getJobStatus(jobId) {
    // 检查处理中的任务
    if (this.processingJobs.has(jobId)) {
      const job = this.processingJobs.get(jobId);
      return {
        jobId: job.jobId,
        status: job.status,
        position: 0, // 处理中的任务没有位置
        error: job.error,
        result: job.result,
        createdAt: job.createdAt
      };
    }
    
    // 检查队列中的任务
    const queueIndex = this.queue.findIndex(job => job.jobId === jobId);
    if (queueIndex !== -1) {
      const job = this.queue[queueIndex];
      return {
        jobId: job.jobId,
        status: job.status,
        position: queueIndex + 1,
        error: job.error,
        result: job.result,
        createdAt: job.createdAt
      };
    }
    
    // 检查已完成的任务缓存
    if (this.completedJobs.has(jobId)) {
      const job = this.completedJobs.get(jobId);
      return {
        jobId: job.jobId,
        status: job.status,
        position: 0,
        error: job.error,
        result: job.result,
        createdAt: job.createdAt
      };
    }
    
    // 任务不存在
    return null;
  }
  
  /**
   * 更新队列中所有任务的位置
   */
  updateQueuePositions() {
    this.queue.forEach((job, index) => {
      job.position = index + 1;
    });
  }
  
  /**
   * 启动工作进程
   */
  startWorker() {
    console.log('[Queue Worker] 启动工作进程');
    
    // 工作循环
    const workerLoop = async () => {
      try {
        // 如果没有正在处理的任务且队列不为空，则取出一个任务处理
        if (this.processingJobs.size === 0 && this.queue.length > 0) {
          const job = this.queue.shift();
          this.updateQueuePositions();
          
          // 标记任务为处理中
          job.status = this.STATUS.PROCESSING;
          job.startTime = new Date();
          this.processingJobs.set(job.jobId, job);
          
          console.log(`[Queue Worker] 开始处理任务: ${job.jobId}`);
          
          try {
            // 调用ComfyUI处理任务
            const comfyUIService = require('./index');
            const { prompt, designImage, workflow, workflowPath } = job.data;
            const result = await comfyUIService.processComfyUIRequest(
              prompt, designImage, workflow, workflowPath
            );
            
            // 任务完成
            job.status = this.STATUS.COMPLETED;
            job.result = result;
            job.endTime = new Date();
            
            console.log(`[Queue Worker] 任务完成: ${job.jobId}`);
          } catch (error) {
            // 任务失败
            job.status = this.STATUS.FAILED;
            job.error = error.message;
            job.endTime = new Date();
            
            console.error(`[Queue Worker] 任务失败: ${job.jobId}, 错误:`, error.message);
          } finally {
            // 从处理中列表移除，添加到已完成缓存
            this.processingJobs.delete(job.jobId);
            this.completedJobs.set(job.jobId, job);
          }
        }
      } catch (error) {
        console.error('[Queue Worker] 工作进程错误:', error);
      } finally {
        // 延迟后继续下一次检查
        setTimeout(workerLoop, 1000); // 每秒检查一次
      }
    };
    
    // 启动工作循环
    workerLoop();
  }
  
  /**
   * 启动清理过期任务的定时器
   */
  startCleanupTimer() {
    setInterval(() => {
      const now = new Date();
      const expiredJobs = [];
      
      this.completedJobs.forEach((job, jobId) => {
        const age = now - job.endTime;
        if (age > this.COMPLETED_JOB_CACHE_TIME) {
          expiredJobs.push(jobId);
        }
      });
      
      expiredJobs.forEach(jobId => {
        this.completedJobs.delete(jobId);
        console.log(`[Queue Cleanup] 清理过期任务: ${jobId}`);
      });
      
      console.log(`[Queue Cleanup] 当前队列状态 - 排队中: ${this.queue.length}, 处理中: ${this.processingJobs.size}, 已缓存: ${this.completedJobs.size}`);
    }, 60000); // 每分钟清理一次
  }
  
  /**
   * 获取队列统计信息
   * @returns {Object} 队列统计
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      processingCount: this.processingJobs.size,
      completedCacheCount: this.completedJobs.size
    };
  }
}

// 创建单例实例
const queueService = new QueueService();
module.exports = queueService;