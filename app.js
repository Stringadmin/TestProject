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

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});