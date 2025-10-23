const express = require('express');
const multer = require('multer');
const path = require('path');
const indexRouter = require('./routes/index');

const app = express();

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 静态文件与首页
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});
app.get('/more.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'more.html'));
});

// 路由
app.use('/', upload.single('file'), indexRouter);

// 作为 Vercel 函数导出（不要在此处 app.listen）
module.exports = app;