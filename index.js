const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const app = express();

// 中间件
app.use(cors()); // 添加CORS支持
app.use(express.json()); // JSON请求体解析
app.use(express.urlencoded({ extended: true })); // URL编码请求体解析

// 路由
const routes = require('./routes');
app.use('/', routes);

// 前端页面：将 test.html 作为首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});