# Vercel部署填写指南

## 1. 项目基本信息填写

根据您的截图界面，以下是具体的填写说明：

### Framework Preset
- 从下拉菜单中选择：`Express`
- 这是因为我们的项目使用Express.js作为后端框架

### Root Directory
- 保持默认值：`./`
- 这表示使用当前仓库的根目录作为部署根目录

## 2. Build and Output Settings

### Build Command
- 选择：`None`
- 我们的项目不需要特殊的构建步骤，Node.js应用会直接运行

### Output Directory
- 设置为：`N/A`
- 对于Express项目，不需要指定特定的输出目录

### Install Command
- 使用默认设置即可：`'yarn install', 'pnpm install', 'npm install', or 'bun install'`
- Vercel会根据项目中的lock文件自动选择合适的包管理器

## 3. 环境变量配置

在Environment Variables部分，需要添加以下环境变量：

### 必要的环境变量

| Key | Value | 说明 |
|-----|-------|------|
| NODE_ENV | production | 设置运行环境为生产环境 |
| COMFYUI_API_URL | https://comfyui.oopshub.cn/ | ComfyUI API的基础URL |
| COMFYUI_TIMEOUT | 180000 | 请求超时时间（毫秒） |

### 配置方法
1. 在Environment Variables部分，点击"Add More"按钮
2. 为每个环境变量填写Key和Value
3. 或者点击"Import .env"按钮，选择本地的.env文件导入

## 4. 确认部署选项并执行部署

### 反向代理配置

我们采用了 **方案B：零代码 — Vercel rewrites 透明转发** 来实现反向代理，解决用户直连ComfyUI服务可能遇到的网络问题。

#### 配置说明

1. **vercel.json配置**
   - 添加了`rewrites`规则，将`/comfy/:path*`请求透明转发到`https://comfyui.oopshub.cn/:path*`
   - 移除了原有的`routes`配置，改用`rewrites`和顶层`headers`配置
   - 保留了必要的CORS头信息，确保前端可以正常访问

2. **应用配置**
   - 更新了`config.js`中的`comfyUI.apiUrl`默认值为`/comfy`
   - 这样应用会通过Vercel的反向代理访问ComfyUI服务，而不是直接连接

### 部署前检查
在点击Deploy按钮前，请再次检查所有配置项：
- Framework Preset是否正确选择为Express
- Build Command是否设置为None
- Output Directory是否设置为N/A
- 所有必要的环境变量是否都已添加
- 验证反向代理配置是否正确
  - 检查`vercel.json`中的`rewrites`规则
  - 确认`config.js`中的API URL已更新为`/comfy`

### 执行部署
1. 确认所有配置无误后，点击页面底部的黑色"Deploy"按钮
2. Vercel将开始构建和部署过程
3. 等待部署完成，这可能需要几分钟时间
4. 部署完成后，您将看到一个成功消息和项目的URL

## 5. 验证部署结果

### 访问部署的应用
1. 部署成功后，Vercel会提供一个URL（通常是 https://[project-name]-[username].vercel.app）
2. 在浏览器中访问此URL，检查应用是否正常运行

### 测试API端点
1. 测试主要的API端点，例如：
   - GET https://[your-vercel-url]/api/
   - POST https://[your-vercel-url]/api/comfyui/prompt

### 验证反向代理配置
特别验证反向代理是否正常工作，这是解决网络问题的关键：

```bash
# 直接测试代理路径（应该返回ComfyUI的响应）
curl https://[your-vercel-url]/comfy/prompt

# 检查反向代理的网络延迟
curl -w "\n响应时间: %{time_total}s\n" https://[your-vercel-url]/comfy/prompt
```

### 验证530错误处理
1. 由于我们实现了530错误降级机制，即使ComfyUI服务不可用，系统也应该返回模拟响应
2. 测试时观察是否在遇到530错误时能够正常提供模拟数据

### 使用测试脚本验证代理（可选）
项目中包含了一个测试脚本来验证代理配置：

```bash
# 在本地运行测试脚本
node test_proxy.js
```

这个脚本会检查以下内容：
- ComfyUI服务是否可访问
- 配置文件是否正确设置
- 提供部署后验证代理的方法

### 使用curl进行验证
您可以使用以下命令在终端中测试API和代理配置：

```bash
# 测试根路径
curl -X GET https://[your-vercel-url]/

# 测试API健康检查
curl -X GET https://[your-vercel-url]/api/

# 直接测试反向代理路径
curl -i https://[your-vercel-url]/comfy/prompt

# 测试ComfyUI提示提交（使用模拟数据）
curl -X POST https://[your-vercel-url]/api/comfyui/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试提示", "workflow": "test"}'

# 测试结果获取（使用模拟的promptId）
curl -X GET https://[your-vercel-url]/api/comfyui/result/mock_test123
```

### 查看部署日志
1. 在Vercel仪表板中，选择您的项目
2. 点击"Deployments"选项卡
3. 选择最新的部署
4. 查看"Logs"以了解部署过程和可能的错误

## 6. 检查points

请确保在填写这些信息时：
- 项目根目录包含package.json文件
- package.json中定义了正确的启动脚本
- index.js文件作为Express应用的入口点
- vercel.json文件配置正确，已经包含了必要的路由和构建设置
- 所有必要的环境变量都已正确配置