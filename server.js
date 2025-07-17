const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 更新bullet.js文件
app.post('/api/update-bullets', async (req, res) => {
    try {
        const { bulletConfigs } = req.body;
        
        // 读取当前bullet.js文件
        const bulletPath = path.join(__dirname, 'bullet.js');
        let content = await fs.readFile(bulletPath, 'utf8');
        
        // 更新每种子弹类型的配置
        Object.keys(bulletConfigs).forEach(type => {
            const config = bulletConfigs[type];
            
            console.log(`正在处理子弹类型: ${type}`, config);
            
            // 特殊处理组合case语句（piercing, venom, spiral）
            if (['piercing', 'venom', 'spiral'].includes(type)) {
                // 查找组合case块
                const combinedCaseRegex = /case\s+['"]piercing['"]:\s*case\s+['"]venom['"]:\s*case\s+['"]spiral['"]:[\s\S]*?break;/g;
                const combinedMatch = content.match(combinedCaseRegex);
                
                if (combinedMatch) {
                    let updatedBlock = combinedMatch[0];
                    
                    // 更新width
                    updatedBlock = updatedBlock.replace(
                        /(this\.width\s*=\s*)(\d+)/g,
                        `$1${config.width}`
                    );
                    
                    // 更新height
                    updatedBlock = updatedBlock.replace(
                        /(this\.height\s*=\s*)(\d+)/g,
                        `$1${config.height}`
                    );
                    
                    // 更新color
                    updatedBlock = updatedBlock.replace(
                        /(this\.color\s*=\s*(?:color\s*\|\|\s*)?['"])(#[a-fA-F0-9]{6})(['"])/g,
                        `$1${config.color}$3`
                    );
                    
                    // 更新glowColor
                    updatedBlock = updatedBlock.replace(
                        /(this\.glowColor\s*=\s*['"])(#[a-fA-F0-9]{6})(['"])/g,
                        `$1${config.glowColor}$3`
                    );
                    
                    // 替换原始块
                    content = content.replace(combinedMatch[0], updatedBlock);
                    console.log(`已更新组合case块: ${type}`);
                }
            } else {
                // 处理单独的case语句
                const caseRegex = new RegExp(`case\\s+['"]${type}['"]:[\\s\\S]*?break;`, 'g');
                const caseMatch = content.match(caseRegex);
                
                if (caseMatch) {
                    caseMatch.forEach(caseBlock => {
                        let updatedBlock = caseBlock;
                        
                        // 更新width
                        updatedBlock = updatedBlock.replace(
                            /(this\.width\s*=\s*)(\d+)/g,
                            `$1${config.width}`
                        );
                        
                        // 更新height
                        updatedBlock = updatedBlock.replace(
                            /(this\.height\s*=\s*)(\d+)/g,
                            `$1${config.height}`
                        );
                        
                        // 更新color - 处理powerShot和upgraded的特殊情况
                        if (['powerShot', 'upgraded'].includes(type)) {
                            // 这些类型使用 this.color = color; 的形式，需要替换为具体的颜色值
                            updatedBlock = updatedBlock.replace(
                                /(this\.color\s*=\s*color;)/g,
                                `this.color = '${config.color}';`
                            );
                            updatedBlock = updatedBlock.replace(
                                /(this\.glowColor\s*=\s*color;)/g,
                                `this.glowColor = '${config.glowColor}';`
                            );
                            // 同时处理可能存在的直接颜色赋值
                            updatedBlock = updatedBlock.replace(
                                /(this\.color\s*=\s*['"])([#a-fA-F0-9]{6})(['"];)/g,
                                `this.color = '${config.color}';`
                            );
                            updatedBlock = updatedBlock.replace(
                                /(this\.glowColor\s*=\s*['"])([#a-fA-F0-9]{6})(['"];)/g,
                                `this.glowColor = '${config.glowColor}';`
                            );
                        } else {
                            // 其他类型的常规处理
                            updatedBlock = updatedBlock.replace(
                                /(this\.color\s*=\s*(?:color\s*\|\|\s*)?['"])(#[a-fA-F0-9]{6})(['"])/g,
                                `$1${config.color}$3`
                            );
                            
                            updatedBlock = updatedBlock.replace(
                                /(this\.glowColor\s*=\s*['"])(#[a-fA-F0-9]{6})(['"])/g,
                                `$1${config.glowColor}$3`
                            );
                        }
                        
                        // 替换原始块
                        content = content.replace(caseBlock, updatedBlock);
                        console.log(`已更新单独case块: ${type}`);
                    });
                } else {
                    console.log(`警告: 未找到子弹类型 ${type} 的case语句`);
                }
            }
            
            // 特殊处理：boss类型的三元运算符颜色设置
            if (type.startsWith('boss_')) {
                // 更新三元运算符中的颜色值
                const ternaryColorPattern = `(type\s*===\s*['"]${type}['"]\s*\?\s*['"])(#[a-fA-F0-9]{6})(['"])`;
                content = content.replace(
                    new RegExp(ternaryColorPattern, 'g'),
                    `$1${config.color}$3`
                );
                
                const ternaryGlowPattern = `(type\s*===\s*['"]${type}['"]\s*\?\s*['"])(#[a-fA-F0-9]{6})(['"])`;
                content = content.replace(
                    new RegExp(ternaryGlowPattern, 'g'),
                    `$1${config.glowColor}$3`
                );
            }
        });
        
        console.log('子弹配置更新请求:', bulletConfigs);
        
        // 写入更新后的内容
        await fs.writeFile(bulletPath, content, 'utf8');
        
        res.json({ success: true, message: 'bullet.js 已更新' });
    } catch (error) {
        console.error('更新bullet.js失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 更新enemy.js文件
app.post('/api/update-enemies', async (req, res) => {
    try {
        const { enemyConfigs } = req.body;
        
        // 读取当前enemy.js文件
        const enemyPath = path.join(__dirname, 'enemy.js');
        let content = await fs.readFile(enemyPath, 'utf8');
        
        // 更新每种敌机类型的配置
        Object.keys(enemyConfigs).forEach(type => {
            const config = enemyConfigs[type];
            
            // 更新width
            const widthRegex = new RegExp(`(case\s+['"]${type}['"]:[\s\S]*?this\.width\s*=\s*)(\d+)`, 'g');
            content = content.replace(widthRegex, `$1${config.width}`);
            
            // 更新height
            const heightRegex = new RegExp(`(case\s+['"]${type}['"]:[\s\S]*?this\.height\s*=\s*)(\d+)`, 'g');
            content = content.replace(heightRegex, `$1${config.height}`);
            
            // 更新health
            const healthRegex = new RegExp(`(case\s+['"]${type}['"]:[\s\S]*?this\.health\s*=\s*)(\d+)`, 'g');
            content = content.replace(healthRegex, `$1${config.health}`);
            
            // 更新speed
            const speedRegex = new RegExp(`(case\s+['"]${type}['"]:[\s\S]*?this\.speed\s*=\s*)([\d.]+)`, 'g');
            content = content.replace(speedRegex, `$1${config.speed}`);
            
            // 更新color
            const colorRegex = new RegExp(`(case\s+['"]${type}['"]:[\s\S]*?this\.color\s*=\s*['"])(#[a-fA-F0-9]{6})(['"])`, 'g');
            content = content.replace(colorRegex, `$1${config.color}$3`);
        });
        
        // 写入更新后的内容
        await fs.writeFile(enemyPath, content, 'utf8');
        
        res.json({ success: true, message: 'enemy.js 已更新' });
    } catch (error) {
        console.error('更新enemy.js失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`配置更新服务器运行在 http://localhost:${PORT}`);
    console.log('现在可以在测试页面中使用"保存到文件"功能了！');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n服务器正在关闭...');
    process.exit(0);
});