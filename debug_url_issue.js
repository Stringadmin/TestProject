const axios = require('axios');
const config = require('./config');

/**
 * 详细调试URL问题的脚本
 */
async function debugURLIssue() {
  console.log('=== URL调试工具 ===');
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`原始配置的API URL: ${config.comfyUI.apiUrl}`);
  
  // 模拟服务端的URL处理逻辑
  const processURL = (url) => {
    if (!url) {
      console.error('❌ URL为空');
      return null;
    }
    
    // 去除空格
    const trimmedUrl = url.trim();
    console.log(`处理后的URL: ${trimmedUrl}`);
    
    // 检查URL格式
    try {
      // 尝试构造URL对象来验证格式
      new URL(trimmedUrl);
      console.log('✅ URL格式有效');
      return trimmedUrl;
    } catch (e) {
      console.error(`❌ URL格式无效: ${e.message}`);
      
      // 如果是相对路径，添加完整域名
      if (trimmedUrl.startsWith('/')) {
        const fullUrl = `http://117.50.83.222:8188${trimmedUrl}`;
        console.log(`转换相对路径为完整URL: ${fullUrl}`);
        try {
          new URL(fullUrl);
          console.log('✅ 转换后的URL格式有效');
          return fullUrl;
        } catch (e2) {
          console.error(`❌ 转换后的URL格式仍然无效: ${e2.message}`);
          return null;
        }
      }
      
      // 如果不包含协议，添加https
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        const fullUrl = `https://${trimmedUrl}`;
        console.log(`添加https协议: ${fullUrl}`);
        try {
          new URL(fullUrl);
          console.log('✅ 添加协议后的URL格式有效');
          return fullUrl;
        } catch (e3) {
          console.error(`❌ 添加协议后的URL格式仍然无效: ${e3.message}`);
          return null;
        }
      }
      
      return null;
    }
  };
  
  // 处理URL
  const processedUrl = processURL(config.comfyUI.apiUrl);
  
  if (!processedUrl) {
    console.log('\n❌ URL处理失败，请检查config.js中的配置');
    process.exit(1);
  }
  
  // 测试连接
  console.log('\n=== 测试连接 ===');
  try {
    console.log(`尝试连接到: ${processedUrl}`);
    const response = await axios({
      url: processedUrl,
      method: 'GET',
      timeout: 10000,
      validateStatus: (status) => status >= 200 && status < 600
    });
    
    console.log(`✅ 连接成功! 状态码: ${response.status}`);
    console.log(`响应数据类型: ${typeof response.data}`);
    
    // 测试system_stats端点
    try {
      const statsUrl = `${processedUrl.endsWith('/') ? processedUrl : processedUrl + '/'}system_stats`;
      console.log(`\n测试system_stats端点: ${statsUrl}`);
      const statsResponse = await axios({
        url: statsUrl,
        method: 'GET',
        timeout: 10000
      });
      console.log(`✅ system_stats调用成功! 状态码: ${statsResponse.status}`);
      console.log('系统版本:', statsResponse.data.system?.comfyui_version || '未知');
    } catch (statsError) {
      console.error(`❌ system_stats调用失败: ${statsError.message}`);
    }
    
  } catch (error) {
    console.error(`❌ 连接失败: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('连接被拒绝，请检查服务是否运行');
    } else if (error.code === 'ENOTFOUND') {
      console.error('找不到主机，请检查域名是否正确');
    }
  }
  
  // 建议修复
  console.log('\n=== 建议修复 ===');
  console.log('在config.js中确保comfyUI.apiUrl设置为: http://117.50.83.222:8188');
}

// 运行调试
debugURLIssue().then(() => {
  console.log('\n调试完成');
}).catch(error => {
  console.error('调试过程中发生错误:', error);
});