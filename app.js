const express = require('express');
const path = require('path');
const cors = require('cors');
const indexRouter = require('./routes/index');

const app = express();

// 配置CORS，在生产环境中可以更加精细化控制
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '*').split(',') 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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

// 环境感知的日志中间件，生产环境减少日志
app.use((req, res, next) => {
  // 生产环境只记录关键路径的请求
  const isProduction = process.env.NODE_ENV === 'production';
  const logPaths = ['/api/', '/comfyui/', '/queue/'];
  
  if (!isProduction || logPaths.some(path => req.url.includes(path))) {
    // 生产环境简化日志，避免日志过多
    const logData = isProduction 
      ? `[${new Date().toISOString()}] ${req.method} ${req.url}`
      : {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          headers: req.headers['x-fc-request-uri'] || req.headers['x-fc-request-path'] 
            ? { x_fc_request_uri: req.headers['x-fc-request-uri'], x_fc_request_path: req.headers['x-fc-request-path'] }
            : undefined
        };
    
    console.log(logData);
  }
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

// 404 处理 - 区分API请求和页面请求
app.use((req, res) => {
  // 检查是否为API请求
  const isApiRequest = req.url.startsWith('/api/') || req.url.startsWith('/comfyui/') || req.url.startsWith('/queue/');
  
  if (isApiRequest) {
    res.status(404).json({
      success: false, 
      error: 'Not Found', 
      path: req.path,
      timestamp: new Date().toISOString()
    });
  } else {
    // 非API请求可以返回404页面或重定向到首页
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
  }
});

// 增强的错误处理中间件
app.use((err, req, res, next) => {
  // 简化错误日志，避免暴露敏感信息
  const errorInfo = {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  };
  
  console.error('Unhandled error:', errorInfo);
  
  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, error: err.message });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  
  // 避免在生产环境中暴露详细错误信息
  const responseError = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';
  
  res.status(500).json({
    success: false, 
    error: responseError,
    timestamp: new Date().toISOString()
  });
});

// 导出用于 Serverless（函数计算）入口
module.exports = app;