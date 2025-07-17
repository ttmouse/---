// 道具类
class PowerUp {
    constructor(x, y, type = null, color = null) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = 2;
        this.vx = (Math.random() - 0.5) * 2; // 随机水平速度
        this.vy = this.speed; // 垂直速度
        this.type = type || this.getRandomType();
        this.color = color || this.getColor();
        this.pulseTimer = 0;
        this.bounceCount = 0; // 撞墙次数计数器
        this.maxBounces = 6; // 最大撞墙次数（左右各3次）
    }

    getRandomType() {
        const types = ['health', 'shield', 'rapidFire', 'bulletUpgrade'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getColor() {
        switch(this.type) {
            case 'health': return '#ff0080';
            case 'shield': return '#0080ff';
            case 'rapidFire': return '#ffff00';
            case 'bulletUpgrade': return '#ff6600';
            default: return '#ffffff';
        }
    }

    update() {
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        this.pulseTimer += 0.2;
        
        // 检查边界碰撞
        let bounced = false;
        
        // 左右边界碰撞
        if (this.x <= 0 || this.x + this.width >= canvas.width) {
            this.vx = -this.vx;
            this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
            this.bounceCount++; // 增加撞墙计数
            bounced = true;
        }
        
        // 上下边界碰撞
        if (this.y <= 0 || this.y + this.height >= canvas.height) {
            this.vy = -this.vy;
            this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
            bounced = true;
        }
        
        // 道具碰撞墙壁后改变方向，继续在屏幕内移动
        
        // 限制最大速度
        const maxSpeed = 4;
        if (Math.abs(this.vx) > maxSpeed) this.vx = Math.sign(this.vx) * maxSpeed;
        if (Math.abs(this.vy) > maxSpeed) this.vy = Math.sign(this.vy) * maxSpeed;
    }
    
    // 道具撞墙次数达到上限后会被移除
    shouldRemove() {
        return this.bounceCount >= this.maxBounces;
    }

    draw() {
        const pulse = Math.sin(this.pulseTimer) * 0.2 + 1;
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.scale(pulse, pulse);
        
        // 绘制发光圆圈背景
        const glowRadius = 18;
        const glowIntensity = Math.sin(this.pulseTimer * 1.5) * 0.3 + 0.7;
        
        // 外层发光效果
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        gradient.addColorStop(0, this.color + '80'); // 半透明的道具颜色
        gradient.addColorStop(0.7, this.color + '40');
        gradient.addColorStop(1, this.color + '00'); // 完全透明
        
        ctx.globalAlpha = glowIntensity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内层亮圈
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();
        
        // 重置透明度
        ctx.globalAlpha = 1.0;
        
        // 根据道具类型绘制不同的小蜜蜂风格图标
        switch(this.type) {
            case 'health':
                // 花蜜 - 粉色花朵
                ctx.fillStyle = '#ff69b4';
                // 花瓣
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const petalX = Math.cos(angle) * 8;
                    const petalY = Math.sin(angle) * 8;
                    ctx.beginPath();
                    ctx.ellipse(petalX, petalY, 4, 6, angle, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 花心
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.ellipse(0, 0, 3, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                

            case 'shield':
                // 蜂蜡 - 六边形蜂巢
                ctx.fillStyle = '#ffa500';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = Math.cos(angle) * 10;
                    const y = Math.sin(angle) * 10;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                // 蜂巢纹理
                ctx.strokeStyle = '#ff8c00';
                ctx.lineWidth = 1;
                ctx.stroke();
                // 内部小六边形
                ctx.fillStyle = '#ffb347';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = Math.cos(angle) * 5;
                    const y = Math.sin(angle) * 5;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'rapidFire':
                // 蜂蜜 - 金色液滴
                ctx.fillStyle = '#ffb000';
                // 液滴形状
                ctx.beginPath();
                ctx.ellipse(0, -3, 6, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, 3, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                // 高光
                ctx.fillStyle = '#ffff80';
                ctx.beginPath();
                ctx.ellipse(-2, -5, 2, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                // 滴落效果
                ctx.fillStyle = '#ff8c00';
                ctx.beginPath();
                ctx.ellipse(0, 8, 1.5, 2, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'bulletUpgrade':
                // 强化蜂针 - 橙色尖锐形状
                ctx.fillStyle = '#ff6600';
                // 主体针形
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-4, 0);
                ctx.lineTo(-2, 8);
                ctx.lineTo(2, 8);
                ctx.lineTo(4, 0);
                ctx.closePath();
                ctx.fill();
                // 针尖
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-2, -5);
                ctx.lineTo(2, -5);
                ctx.closePath();
                ctx.fill();
                // 能量光芒
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 4; i++) {
                    const angle = (i * Math.PI * 2) / 4;
                    const rayX = Math.cos(angle) * 8;
                    const rayY = Math.sin(angle) * 8;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(rayX, rayY);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                break;
                
            default:
                // 默认 - 简单圆形
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }

    getSymbol() {
        switch(this.type) {
            case 'health': return '+';
            case 'shield': return 'S';
            case 'rapidFire': return 'R';
            case 'bulletUpgrade': return 'U';
            default: return '?';
        }
    }
}