const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

// 配置翻译服务类型
const TRANSLATION_SERVICE = 'mock'; // 可选: 'google', 'youdao', 'microsoft'

/**
 * 网易有道翻译服务
 * @param {string} text - 需要翻译的文本
 * @param {string} fromLang - 源语言代码
 * @param {string} toLang - 目标语言代码
 * @returns {Promise<string>} 翻译后的文本
 */
async function youdaoTranslate(text, fromLang, toLang) {
  // 检查必要的配置
  if (!config.youdao || !config.youdao.appKey || !config.youdao.appSecret) {
    console.log('网易有道翻译服务配置不完整，使用模拟翻译');
    return mockTranslate(text, fromLang, toLang);
  }

  try {
    // 如果文本过长，进行截断处理
    const maxLength = 5000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
      console.log('文本过长，已截断处理');
    }

    const appKey = config.youdao.appKey;
    const appSecret = config.youdao.appSecret;
    const salt = Date.now();
    const signStr = appKey + text + salt + appSecret;
    const sign = generateSign(signStr);

    const params = {
      q: text,
      from: convertLangCode(fromLang),
      to: convertLangCode(toLang),
      appKey: appKey,
      salt: salt,
      sign: sign
    };

    console.log('正在调用网易有道翻译API...');
    const response = await axios.get('https://openapi.youdao.com/api', { params });
    
    if (response.data && response.data.errorCode === '0') {
      console.log('网易有道翻译API调用成功');
      return response.data.translation.join('');
    } else {
      console.error('网易有道翻译API调用失败:', response.data.errorCode, response.data.errorMsg);
      // 出错时回退到模拟翻译
      return mockTranslate(text, fromLang, toLang);
    }
  } catch (error) {
    console.error('网易有道翻译服务请求失败:', error.message);
    // 网络错误时回退到模拟翻译
    return mockTranslate(text, fromLang, toLang);
  }
}

/**
 * 生成签名
 * @param {string} signStr - 签名字符串
 * @returns {string} 签名结果
 */
function generateSign(signStr) {
  const hash = crypto.createHash('md5');
  hash.update(signStr);
  return hash.digest('hex');
}

/**
 * 转换语言代码以适配网易有道API
 * @param {string} langCode - 标准语言代码
 * @returns {string} 网易有道API使用的语言代码
 */
function convertLangCode(langCode) {
  const langMap = {
    'zh': 'zh-CHS',
    'en': 'EN',
    'ja': 'JA',
    'ko': 'KO',
    'fr': 'FR',
    'de': 'DE',
    'es': 'ES',
    'pt': 'PT',
    'ru': 'RU',
    'ar': 'AR',
    'auto': 'auto'
  };
  
  return langMap[langCode] || 'auto';
}

/**
 * 模拟翻译服务（当其他翻译服务不可用时作为回退）
 * @param {string} text - 需要翻译的文本
 * @param {string} fromLang - 源语言代码
 * @param {string} toLang - 目标语言代码
 * @returns {Promise<string>} 模拟翻译后的文本
 */
async function mockTranslate(text, fromLang, toLang) {
  console.log('使用模拟翻译服务');
  // 简单的模拟逻辑，实际应用中可以根据需求扩展
  if (fromLang !== toLang) {
    return `[${toLang}] ${text}`;
  }
  return text;
}

/**
 * 翻译服务主函数
 * @param {string} text - 需要翻译的文本
 * @param {string} fromLang - 源语言代码（默认为自动检测）
 * @param {string} toLang - 目标语言代码（默认为英文）
 * @returns {Promise<string>} 翻译后的文本
 */
async function translate(text, fromLang = 'auto', toLang = 'en') {
  try {
    switch (TRANSLATION_SERVICE) {
      case 'youdao':
        return await youdaoTranslate(text, fromLang, toLang);
      case 'google':
        // 预留Google翻译服务接口
        console.log('Google翻译服务未实现，使用模拟翻译');
        return await mockTranslate(text, fromLang, toLang);
      case 'microsoft':
        // 预留Microsoft翻译服务接口
        console.log('Microsoft翻译服务未实现，使用模拟翻译');
        return await mockTranslate(text, fromLang, toLang);
      default:
        console.log('未配置翻译服务，使用模拟翻译');
        return await mockTranslate(text, fromLang, toLang);
    }
  } catch (error) {
    console.error('翻译服务调用失败:', error);
    // 确保在任何情况下都能回退到模拟翻译
    return await mockTranslate(text, fromLang, toLang);
  }
}

/**
 * 检测文本语言
 * @param {string} text - 需要检测的文本
 * @returns {Promise<string>} 检测到的语言代码
 */
async function detectLanguage(text) {
  try {
    // 简单的语言检测逻辑
    // 实际应用中可以调用专门的语言检测API
    const chineseRegex = /[\u4e00-\u9fa5]/;
    const japaneseRegex = /[\u3040-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;
    
    if (chineseRegex.test(text)) {
      return 'zh';
    } else if (japaneseRegex.test(text)) {
      return 'ja';
    } else if (koreanRegex.test(text)) {
      return 'ko';
    } else {
      return 'en'; // 默认假设为英文
    }
  } catch (error) {
    console.error('语言检测失败:', error);
    return 'en'; // 出错时默认返回英文
  }
}

module.exports = {
  translate,
  detectLanguage,
  TRANSLATION_SERVICE
};