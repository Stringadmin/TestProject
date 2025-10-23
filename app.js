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

// 路由
app.use('/', upload.single('file'), indexRouter);

// 作为 Vercel 函数导出（不要在此处 app.listen）
module.exports = app;