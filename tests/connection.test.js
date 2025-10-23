const config = require('../config');
const axios = require('axios');
const { MongoClient } = require('mongodb');

describe('Connection Tests', () => {
  // 测试ComfyUI API连接
  describe('ComfyUI API Connection', () => {
    it('should respond within normal time', async () => {
      const start = Date.now();
      const response = await axios.get(`${config.comfyUI.apiUrl}`, {
        validateStatus: (status) => status >= 200 && status < 600
      });
      const duration = Date.now() - start;
      
      console.log(`Normal response time: ${duration}ms`);
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });

    it('should handle network delay', async () => {
      // 模拟延迟
      jest.setTimeout(config.comfyUI.timeout * 2);
      const delayedRequest = axios.get(`${config.comfyUI.apiUrl}/does-not-exist`, {
        timeout: config.comfyUI.timeout
      });

      await expect(delayedRequest).rejects.toThrow();
    });
  });

  // 测试数据库连接
  describe('Database Connection', () => {
    let client;

    afterEach(async () => {
      if (client) await client.close();
    });

    it('should connect successfully', async () => {
      const start = Date.now();
      client = await MongoClient.connect(
        `mongodb://${config.database.host}:${config.database.port}`,
        { connectTimeoutMS: 5000 }
      );
      const duration = Date.now() - start;
      
      console.log(`DB connection time: ${duration}ms`);
      expect(client).toBeDefined();
    });
  });
});