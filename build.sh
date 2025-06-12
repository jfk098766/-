#!/bin/bash
# 合并所有JS文件
cat config.js addresses.js bkk3.js cache.js > bundle.js

# 压缩
terser bundle.js -c -m > bundle.min.js

# 生成bookmarklet
echo "javascript:(function(){var s=document.createElement('script');s.src='https://your-domain/bundle.min.js';document.head.appendChild(s)})()" > bookmarklet.txt
