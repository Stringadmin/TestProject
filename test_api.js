const axios = require('axios');

// 简单的测试脚本，直接测试后端API
async function testSubmitPrompt() {
  console.log('开始测试后端API...');
  
  try {
    const response = await axios.post('http://localhost:3000/comfyui/submit', {
      prompt: '测试图像生成',
      workflow: 'test',
      workflowPath: 'comfyui_workflows/test.json'
    });
    
    console.log('测试请求成功！');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', response.data);
  } catch (error) {
    console.error('测试请求失败:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 执行测试
testSubmitPrompt();