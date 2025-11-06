const translationService = require('./services/translationService');

/**
 * 测试翻译服务功能
 */
async function testTranslationService() {
  console.log('开始测试翻译服务...');
  console.log(`当前使用的翻译服务: ${translationService.TRANSLATION_SERVICE}`);
  
  try {
    // 测试1: 中文到英文的翻译
    const test1Text = '你好，这是一段测试文本。';
    console.log(`\n测试1: 中文到英文`);
    console.log(`原始文本: ${test1Text}`);
    const test1Result = await translationService.translate(test1Text, 'zh', 'en');
    console.log(`翻译结果: ${test1Result}`);
    
    // 测试2: 英文到中文的翻译
    const test2Text = 'Hello, this is a test text.';
    console.log(`\n测试2: 英文到中文`);
    console.log(`原始文本: ${test2Text}`);
    const test2Result = await translationService.translate(test2Text, 'en', 'zh');
    console.log(`翻译结果: ${test2Result}`);
    
    // 测试3: 语言检测功能
    console.log(`\n测试3: 语言检测`);
    const detectText = '你好，世界！';
    const detectedLang = await translationService.detectLanguage(detectText);
    console.log(`文本: ${detectText}`);
    console.log(`检测到的语言: ${detectedLang}`);
    
    // 测试4: 自动检测语言进行翻译
    console.log(`\n测试4: 自动检测语言进行翻译`);
    const autoDetectText = 'こんにちは、世界！';
    console.log(`原始文本: ${autoDetectText}`);
    const autoDetectResult = await translationService.translate(autoDetectText, 'auto', 'zh');
    console.log(`翻译结果: ${autoDetectResult}`);
    
    console.log('\n翻译服务测试完成！');
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testTranslationService().then(() => {
  console.log('\n所有测试用例执行完毕');
  process.exit(0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});