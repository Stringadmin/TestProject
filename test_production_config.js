const axios = require('axios');
const config = require('./config');

/**
 * 测试生产环境配置
 */
async function testProductionConfig() {
  console.log('开始测试生产环境配置...');
  console.log(`COMFYUI API URL: ${config.comfyUI.apiUrl}`);
  
  try {
    const response = await axios({
      url: `${config.comfyUI.apiUrl}/system_stats`,
      method: 'GET',
      timeout: config.comfyUI.timeout || 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n配置测试成功！');
    console.log('API响应状态:', response.status);
    console.log('连接到:', config.comfyUI.apiUrl);
    console.log('\n系统信息:');
    console.log('- 系统:', response.data.system.os);
    console.log('- ComfyUI版本:', response.data.system.comfyui_version);
    console.log('- 设备:', response.data.devices[0]?.name || '无GPU设备');
    
    return true;
  } catch (error) {
    console.error('\n配置测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
    } else if (error.request) {
      console.error('无法连接到服务器');
    }
    return false;
  }
}

// 运行测试
testProductionConfig().then(success => {
  console.log('\n测试结果:', success ? '成功' : '失败');
  console.log('\n结论:');
  if (success) {
    console.log('✅ ComfyUI API连接配置正确，Cloudflare隧道工作正常');
    console.log('✅ Vercel部署后将能够正确连接到ComfyUI服务');
  } else {
    console.log('❌ 请检查Cloudflare隧道是否正常运行');
    console.log('❌ 确认IP地址117.50.83.222:8188是否已正确配置');
  }
  process.exit(success ? 0 : 1);
});