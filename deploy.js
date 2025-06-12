// 快速部署脚本
const QuickDeploy = {
    // 生成单文件版本
    bundle() {
        const files = [
            'config.js',
            'addresses.js', 
            'cache.js',
            'test-toolkit.js'
        ];
        
        let bundle = '/* Clipboard System Bundle */\n\n';
        
        files.forEach(file => {
            bundle += `\n// ========== ${file} ==========\n`;
            bundle += readFileSync(file);
            bundle += '\n';
        });
        
        return bundle;
    },
    
    // 生成压缩版
    minify(code) {
        // 使用 terser 或其他压缩工具
        return code; // 简化示例
    },
    
    // 生成 bookmarklet
    bookmarklet() {
        const code = `
            (function(){
                const s=document.createElement('script');
                s.src='https://your-domain.com/bundle.min.js';
                document.head.appendChild(s);
            })();
        `;
        return 'javascript:' + encodeURIComponent(code.replace(/\s+/g, ' '));
    }
};
