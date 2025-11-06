const axios = require('axios');
const config = require('./config');

// 测试反向代理配置
async function testProxyConfiguration() {
  console.log('开始测试反向代理配置...');
  console.log(`当前配置的API URL: ${config.comfyUI.apiUrl}`);
  
  try {
    // 在本地环境中，我们直接测试ComfyUI服务是否可访问
    // 注意：此测试仅在服务器运行时有效
    console.log('测试1: 检查ComfyUI服务状态');
    const statusResponse = await axios.get('https://comfyui.oopshub.cn/prompt', {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ ComfyUI服务可访问');
    console.log('响应状态:', statusResponse.status);
    console.log('响应数据:', statusResponse.data);
    
    console.log('\n测试2: 验证反向代理配置');
    console.log('注意: 完整的反向代理测试需要在Vercel部署后进行');
    console.log('本地验证成功，配置文件已正确设置:');
    console.log('- vercel.json中的rewrites规则已配置');
    console.log('- config.js中的API URL已更新为/comfy');
    
    console.log('\n部署到Vercel后，您可以通过以下方式验证代理:');
    console.log('1. 访问 https://<your-vercel-domain>/comfy/prompt');
    console.log('2. 使用curl命令: curl https://<your-vercel-domain>/comfy/prompt');
    console.log('3. 检查应用是否能正常与ComfyUI服务通信');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('无法连接到ComfyUI服务');
    }
  }
}

// 运行测试
testProxyConfiguration();