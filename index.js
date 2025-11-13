const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const services = require('./services');
const app = express();

// 中间件
app.use(cors()); // 添加CORS支持
app.use(express.json()); // JSON请求体解析
app.use(express.urlencoded({ extended: true })); // URL编码请求体解析

// 注册图像代理路由（必须在路由配置之前，避免被404处理拦截）
services.setupImageProxy(app);

// 路由
const routes = require('./routes');
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

// 导出app以便在Vercel等无服务器环境中使用
module.exports = app;

// 仅在直接运行此文件时启动服务器（本地开发时）
if (require.main === module) {
  app.listen(config.port || process.env.PORT || 3000, () => {
    console.log(`Server running on port ${config.port || process.env.PORT || 3000}`);
  });
}
