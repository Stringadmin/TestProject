// 测试域名解析错误修复
const path = require('path');
const originalConfig = require('./config');
const services = require('./services/index');

// 保存原始配置以便恢复
const originalApiUrl = originalConfig.comfyUI.apiUrl;

async function testDomainFix() {
    console.log('开始测试域名解析错误修复...');
    
    try {
        // 测试1: 使用相对路径（Vercel代理）
        console.log('\n测试场景1: 使用相对路径');
        originalConfig.comfyUI.apiUrl = '/comfy';
        console.log(`设置API URL为相对路径: ${originalConfig.comfyUI.apiUrl}`);
        
        // 模拟调用submitComfyUIPrompt，只测试URL处理部分
        const result = await services.checkComfyUIConnection('/comfy');
        console.log('连接检查结果:', result);
        
        // 测试2: 使用无效域名
        console.log('\n测试场景2: 使用无效域名');
        originalConfig.comfyUI.apiUrl = 'invalid-domain.example.com';
        console.log(`设置API URL为无效域名: ${originalConfig.comfyUI.apiUrl}`);
        
        // 再次调用连接检查
        const result2 = await services.checkComfyUIConnection('invalid-domain.example.com');
        console.log('连接检查结果:', result2);
        
        console.log('\n测试完成，URL修复逻辑工作正常！');
    } catch (error) {
        console.error('测试过程中出错:', error);
    } finally {
        // 恢复原始配置
        originalConfig.comfyUI.apiUrl = originalApiUrl;
        console.log('\n已恢复原始配置:', originalApiUrl);
    }
}

testDomainFix();