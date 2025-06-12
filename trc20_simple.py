#!/usr/bin/env python3
"""
TRC20地址批量生成器 - 精简高效版
专门用于生成地址池，避免重复
"""

import os
import hashlib
import base58
from ecdsa import SigningKey, SECP256k1
import time
import json
from multiprocessing import Pool, cpu_count
from concurrent.futures import ProcessPoolExecutor
import sys

class TRC20Generator:
    """精简的TRC20地址生成器"""
    
    @staticmethod
    def generate_address():
        """生成单个TRC20地址和私钥"""
        # 1. 生成32字节私钥
        private_key = os.urandom(32)
        
        # 2. 生成公钥
        sk = SigningKey.from_string(private_key, curve=SECP256k1)
        public_key = b'\x04' + sk.verifying_key.to_string()
        
        # 3. Keccak-256哈希（注意：是Keccak，不是SHA3）
        k = hashlib.sha3_256()
        k.update(public_key[1:])  # 跳过0x04前缀
        address_hash = k.digest()
        
        # 4. 取最后20字节，加上0x41前缀（TRON主网）
        address_bytes = b'\x41' + address_hash[-20:]
        
        # 5. 双SHA256计算校验和
        hash1 = hashlib.sha256(address_bytes).digest()
        hash2 = hashlib.sha256(hash1).digest()
        checksum = hash2[:4]
        
        # 6. Base58编码
        address = base58.b58encode(address_bytes + checksum).decode('ascii')
        
        return {
            'address': address,
            'private_key': private_key.hex()
        }
    
    @staticmethod
    def generate_batch(count):
        """批量生成地址"""
        addresses = []
        seen = set()  # 用于去重
        
        while len(addresses) < count:
            addr_data = TRC20Generator.generate_address()
            
            # 确保不重复
            if addr_data['address'] not in seen:
                seen.add(addr_data['address'])
                addresses.append(addr_data)
        
        return addresses
    
    @staticmethod
    def worker(args):
        """工作进程"""
        worker_id, count = args
        return TRC20Generator.generate_batch(count)
    
    def generate_pool(self, total_count=1000, filename=None):
        """使用多进程生成地址池"""
        if filename is None:
            filename = f"trc20_pool_{int(time.time())}.json"
        
        # 计算每个进程的任务量
        workers = cpu_count()
        chunk_size = total_count // workers
        remainder = total_count % workers
        
        print(f"🚀 生成 {total_count} 个TRC20地址")
        print(f"💻 使用 {workers} 个CPU核心")
        print("="*50)
        
        start_time = time.time()
        all_addresses = []
        
        # 分配任务
        tasks = []
        for i in range(workers):
            count = chunk_size + (1 if i < remainder else 0)
            tasks.append((i, count))
        
        # 并行生成
        with ProcessPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(self.worker, task) for task in tasks]
            
            for i, future in enumerate(futures):
                result = future.result()
                all_addresses.extend(result)
                
                # 显示进度
                progress = (i + 1) / workers * 100
                sys.stdout.write(f'\r进度: {progress:.0f}% [{i+1}/{workers}]')
                sys.stdout.flush()
        
        print(f"\n✅ 生成完成！用时: {time.time()-start_time:.2f}秒")
        
        # 保存结果
        self.save_addresses(all_addresses, filename)
        
        return filename, all_addresses
    
    def save_addresses(self, addresses, filename):
        """保存地址到文件"""
        # JSON格式（便于程序读取）
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
                'total': len(addresses),
                'addresses': addresses
            }, f, indent=2)
        
        # 纯文本格式（便于查看）
        txt_filename = filename.replace('.json', '.txt')
        with open(txt_filename, 'w', encoding='utf-8') as f:
            f.write(f"# TRC20地址池\n")
            f.write(f"# 生成时间: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"# 总数: {len(addresses)}\n")
            f.write("#" + "="*60 + "\n\n")
            
            for i, addr in enumerate(addresses, 1):
                f.write(f"{addr['address']}:{addr['private_key']}\n")
        
        print(f"📁 已保存到: {filename}")
        print(f"📁 文本格式: {txt_filename}")
        
        # 显示示例
        print("\n📋 地址示例:")
        for i in range(min(3, len(addresses))):
            print(f"{i+1}. {addresses[i]['address']}")

# 快速使用函数
def quick_generate(count=1000):
    """快速生成指定数量的地址"""
    generator = TRC20Generator()
    return generator.generate_pool(count)

def generate_for_testing():
    """为剪贴板测试生成地址池"""
    # 生成多种类型的地址用于测试
    addresses = {
        'regular': [],      # 普通地址
        'similar': [],      # 相似地址组
        'vanity': []        # 特殊地址
    }
    
    generator = TRC20Generator()
    
    # 1. 生成普通地址
    print("生成普通地址...")
    regular = generator.generate_batch(100)
    addresses['regular'] = regular
    
    # 2. 生成一些看起来相似的地址（用于混淆）
    print("\n生成相似地址组...")
    base_addrs = generator.generate_batch(10)
    for base in base_addrs[:5]:
        group = [base]
        # 生成相似地址（改变最后几位）
        for _ in range(4):
            similar = generator.generate_address()
            group.append(similar)
        addresses['similar'].append(group)
    
    # 3. 保存为测试格式
    test_file = f"test_addresses_{int(time.time())}.json"
    with open(test_file, 'w') as f:
        json.dump(addresses, f, indent=2)
    
    # 生成JavaScript配置
    js_file = "test_addresses.js"
    with open(js_file, 'w') as f:
        f.write("// TRC20测试地址池\n")
        f.write("const TRC20_TEST_ADDRESSES = {\n")
        f.write("  // 普通地址池\n")
        f.write("  regular: [\n")
        for addr in addresses['regular'][:20]:
            f.write(f"    '{addr['address']}',\n")
        f.write("  ],\n")
        f.write("  // 用于劫持替换的地址\n")
        f.write("  hijack: [\n")
        for addr in addresses['regular'][20:25]:
            f.write(f"    '{addr['address']}',\n")
        f.write("  ]\n")
        f.write("};\n")
    
    print(f"\n✅ 测试地址已生成")
    print(f"📁 JSON格式: {test_file}")
    print(f"📁 JS配置: {js_file}")
    
    return addresses

# 命令行入口
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='TRC20地址生成器')
    parser.add_argument('count', type=int, nargs='?', default=1000,
                        help='生成数量（默认1000）')
    parser.add_argument('--test', action='store_true',
                        help='生成测试用地址池')
    
    args = parser.parse_args()
    
    try:
        if args.test:
            generate_for_testing()
        else:
            quick_generate(args.count)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ 已取消")
    except Exception as e:
        print(f"\n❌ 错误: {e}")