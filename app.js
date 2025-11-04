const express = require('express');
const path = require('path');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();
app.use(cors());

// 兼容阿里云FC与自定义域名：尽可能从代理头中还原真实路径
app.use((req, res, next) => {
  try {
    const h = req.headers || {};
    const candidate =
      h['x-fc-request-uri'] ||
      h['x-fc-request-path'] ||
      h['x-forwarded-uri'] ||
      h['x-original-uri'] ||
      h['x-rewrite-url'];
    if (typeof candidate === 'string' && candidate.length > 0) {
      const [pathOnly, query] = candidate.split('?');
      req.url = pathOnly + (query ? `?${query}` : '');
    }
  } catch (_) {}
  next();
});

// 中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    x_fc_request_uri: req.headers['x-fc-request-uri'],
    x_fc_request_path: req.headers['x-fc-request-path']
  });
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 统一避免“附件下载”头，强制为 inline 展示
app.use((req, res, next) => {
  try { res.set('Content-Disposition', 'inline'); } catch (_) {}
  next();
});

// 健康检查、根路由与调试端点（API域名不提供静态文件）
app.get('/ping', (req, res) => {
  res.set('content-type', 'text/plain; charset=utf-8');
  res.end('ok');
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get('/debug', (req, res) => {
  res.type('text/plain').send('fanghezi api online');
});
app.get('/__whoami', (req, res) => {
  res.status(200).json({
    seen: {
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      path: req.path,
      httpVersion: req.httpVersion
    },
    headers: req.headers || {}
  });
});
app.get('/info', (req, res) => {
  const headers = req.headers || {};
  res.status(200).json({
    name: 'fanghezi api',
    version: '1.0.0',
    seen: { method: req.method, url: req.url, originalUrl: req.originalUrl, path: req.path },
    headers: {
      host: headers['host'],
      'x-forwarded-proto': headers['x-forwarded-proto'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-fc-request-id': headers['x-fc-request-id'],
      'x-fc-request-uri': headers['x-fc-request-uri'],
      'x-fc-request-path': headers['x-fc-request-path'],
      'x-original-uri': headers['x-original-uri'],
      'x-rewrite-url': headers['x-rewrite-url'],
      'x-forwarded-uri': headers['x-forwarded-uri']
    }
  });
});

// 路由（移除全局上传中间件，由具体路由处理上传）
app.use('/', indexRouter);

// 404 与错误处理，避免空白页
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not Found', path: req.path });
});
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// 导出用于 Serverless（函数计算）入口
module.exports = app;