const app = require('./app');
const serverless = require('serverless-http');

// 使用 serverless-http 最简适配，配合 app.js 中的 x-fc-request-uri 中间件修正路径
module.exports.handler = serverless(app);
