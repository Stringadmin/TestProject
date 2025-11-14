const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const app = express();
const cors = require('cors');
const config = require('../config');
const services = require('../services');
const routes = require('../routes');

// 中间件
app.use(cors()); // 添加CORS支持
app.use(express.json({ limit: '10mb' })); // JSON请求体解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL编码请求体解析


// 注册图像代理路由（必须在路由配置之前，避免被404处理拦截）
services.setupImageProxy(app);

// 路由
app.use('/', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 使用serverless-http包装Express应用，适配Vercel无服务器环境
// 添加默认导出，确保Vercel能正确识别Express应用
module.exports = app;
// 同时保留handler导出，用于其他可能的无服务器环境
module.exports.handler = serverless(app);
