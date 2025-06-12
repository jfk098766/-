/**
 * 智能地址池管理
 * 支持多币种、动态轮换、相似度生成
 */

const AddressPool = {
  // 默认地址池
  pools: {
    BTC: {
      mainnet: [
        'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '3FKjvBDaEs6BeUga3VcuBLmPJd4XRZzE5u'
      ],
      testnet: [
        'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7'
      ]
    },
    ETH: {
      mainnet: [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f2bd20',
        '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
        '0x5aAeb6053F3E94c9b9876A699EF3a8d1f7E7dc51'
      ],
      polygon: [
        '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
      ]
    },
    USDT: {
      tron: [
        'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW6',
        'TLa2FYzGUXRGqBPYYxV6C6WtYVqhNmq7kG'
      ],
      erc20: [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7'
      ]
    }
  },
  
  // 智能获取地址
  get(type = 'ETH', network = 'mainnet') {
    const pool = this.pools[type]?.[network] || this.pools[type]?.mainnet || [];
    
    if (pool.length === 0) {
      console.warn(`No addresses for ${type}/${network}`);
      return null;
    }
    
    // 轮换策略
    const index = this.getRotationIndex(type);
    return pool[index % pool.length];
  },
  
  // 轮换索引管理
  _rotationIndexes: {},
  getRotationIndex(type) {
    if (!this._rotationIndexes[type]) {
      this._rotationIndexes[type] = 0;
    }
    
    // 基于时间的轮换
    const hoursSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60));
    return (this._rotationIndexes[type] + hoursSinceEpoch) % 100;
  },
  
  // 添加新地址
  add(type, network, address) {
    if (!this.pools[type]) {
      this.pools[type] = {};
    }
    if (!this.pools[type][network]) {
      this.pools[type][network] = [];
    }
    
    if (!this.pools[type][network].includes(address)) {
      this.pools[type][network].push(address);
      this.save();
    }
  },
  
  // 批量导入
  import(data) {
    for (const [type, networks] of Object.entries(data)) {
      for (const [network, addresses] of Object.entries(networks)) {
        addresses.forEach(addr => this.add(type, network, addr));
      }
    }
  },
  
  // 本地持久化
  save() {
    try {
      localStorage.setItem('cbh_addresses', JSON.stringify(this.pools));
    } catch (e) {
      console.error('Failed to save addresses:', e);
    }
  },
  
  // 加载本地数据
  load() {
    try {
      const saved = localStorage.getItem('cbh_addresses');
      if (saved) {
        this.pools = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    }
  }
};

// 初始化时加载
AddressPool.load();
