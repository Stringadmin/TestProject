const axios = require('axios');
const config = require('./config');

/**
 * 测试ComfyUI API连接
 */
async function testComfyUIConnection() {
  console.log('开始测试ComfyUI API连接...');
  console.log(`使用的API URL: ${config.comfyUI.apiUrl}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  
  try {
    // 构建完整的API URL用于测试
    let apiUrl = config.comfyUI.apiUrl;
    // 如果是相对路径，使用Cloudflare隧道的完整URL进行测试
    if (apiUrl.startsWith('/')) {
      // 尝试直接使用主域名
      apiUrl = `https://comfyui.oopshub.cn`;
      console.log(`注意: 测试时使用完整URL: ${apiUrl}`);
    }
    
    // 发送请求到ComfyUI API
    const response = await axios({
      url: `${apiUrl}/system_stats`,
      method: 'GET',
      timeout: config.comfyUI.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n连接成功！');
    console.log('API响应:', response.status, response.statusText);
    console.log('系统状态:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('\n连接失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应，请检查网络连接或API地址是否正确');
      console.error('请确认Cloudflare隧道是否正常运行');
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    return false;
  }
}

/**
 * 带重试的连接测试
 */
async function testWithRetry() {
  let success = false;
  const maxRetries = config.comfyUI.retryConfig?.maxRetries || 3;
  const retryDelay = config.comfyUI.retryConfig?.retryDelay || 2000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`\n尝试 ${attempt}/${maxRetries}...`);
    success = await testComfyUIConnection();
    
    if (success) {
      break;
    }
    
    if (attempt < maxRetries) {
      console.log(`\n等待 ${retryDelay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  if (!success) {
    console.log('\n连接测试失败，请检查以下几点：');
    console.log('1. Cloudflare隧道是否正常运行');
    console.log('2. Vercel配置是否正确');
    console.log('3. 网络连接是否正常');
    console.log('4. API地址是否正确');
  }
  
  return success;
}

// 运行测试
testWithRetry().then(success => {
  console.log('\n测试完成:', success ? '成功' : '失败');
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});