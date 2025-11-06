const { checkComfyUIConnection } = require('./services/index');

/**
 * 测试修复后的ComfyUI连接检查功能
 */
async function testConnectionFix() {
  console.log('=== 测试连接修复 ===');
  
  try {
    // 调用修复后的连接检查函数
    console.log('调用checkComfyUIConnection...');
    const result = await checkComfyUIConnection();
    
    console.log('\n连接检查结果:');
    console.log(`连接状态: ${result.connected ? '✅ 已连接' : '❌ 未连接'}`);
    console.log(`使用的URL: ${result.url}`);
    if (result.connected) {
      console.log(`版本: ${result.version}`);
      console.log(`HTTP状态码: ${result.httpStatus}`);
    } else {
      console.log(`错误: ${result.error}`);
      console.log(`错误代码: ${result.errorCode}`);
    }
    console.log(`时间戳: ${result.timestamp}`);
    
    if (result.connected) {
      console.log('\n✅ 连接修复测试通过!');
    } else {
      console.log('\n❌ 连接修复测试失败，请检查配置');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testConnectionFix().then(() => {
  console.log('\n测试完成');
}).catch(error => {
  console.error('测试失败:', error);
});