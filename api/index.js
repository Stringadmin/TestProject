const app = require('../app');
const axios = require('axios');

// 在生产环境中为axios设置baseURL，解决Vercel Serverless环境中的相对路径问题
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    axios.defaults.baseURL = `${protocol}://${req.headers.host}`;
    console.log(`[${new Date().toISOString()}] axios baseURL set to: ${axios.defaults.baseURL}`);
  }
  next();
});

module.exports = app;