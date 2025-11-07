const { submitComfyUIPrompt } = require('./services/index');
const config = require('./config');

/**
 * 测试URL修复逻辑
 * 模拟环境变量设置为相对路径的情况
 */
async function testUrlFix() {
  console.log('=== 测试URL修复逻辑 ===');
  
  // 先保存原始配置，测试完成后恢复
  const originalApiUrl = config.comfyUI.apiUrl;
  
  try {
    // 测试1: 模拟相对路径URL（'/comfy'）
    console.log('\n测试场景1: 相对路径URL（\'/comfy\'）');
    config.comfyUI.apiUrl = '/comfy';
    console.log(`设置API URL为: ${config.comfyUI.apiUrl}`);
    
    // 调用submitComfyUIPrompt函数，但使用无效的工作流名称，这样会在连接检查后就失败，不会执行实际的提交
    try {
      await submitComfyUIPrompt('测试提示词', null, 'non_existent_workflow', null);
    } catch (error) {
      console.log('预期的错误:', error.message);
    }
    
    // 测试2: 模拟缺少协议的URL
    console.log('\n测试场景2: 缺少协议的URL');
    config.comfyUI.apiUrl = '117.50.83.222:8188';
    console.log(`设置API URL为: ${config.comfyUI.apiUrl}`);
    
    try {
      await submitComfyUIPrompt('测试提示词', null, 'non_existent_workflow', null);
    } catch (error) {
      console.log('预期的错误:', error.message);
    }
    
    // 测试3: 模拟完全无效的URL
    console.log('\n测试场景3: 完全无效的URL');
    config.comfyUI.apiUrl = 'invalid-url-format';
    console.log(`设置API URL为: ${config.comfyUI.apiUrl}`);
    
    try {
      await submitComfyUIPrompt('测试提示词', null, 'non_existent_workflow', null);
    } catch (error) {
      console.log('预期的错误:', error.message);
    }
    
    console.log('\n✅ URL修复逻辑测试完成');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  } finally {
    // 恢复原始配置
    config.comfyUI.apiUrl = originalApiUrl;
    console.log('\n已恢复原始配置');
  }
}

// 运行测试
testUrlFix().then(() => {
  console.log('\n测试脚本执行完成');
}).catch(error => {
  console.error('测试脚本执行失败:', error);
});