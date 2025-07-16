// 子弹类
class Bullet {
    constructor(x, y, speed, color = '#ffff00', type = 'normal', angle = 0) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.speed = speed;
        this.color = color;
        this.type = type;
        this.angle = angle; // 发射角度（弧度）
        this.vx = Math.sin(angle) * speed; // X方向速度
        this.vy = Math.cos(angle) * speed; // Y方向速度
        this.trail = []; // 子弹轨迹
        this.glowIntensity = 0;
        this.animationTimer = 0;
        this.particles = []; // 子弹粒子效果
        this.rotationAngle = 0; // 旋转角度（用于椭圆形子弹）
        this.rotationSpeed = 0.1; // 旋转速度
        
        // 根据类型设置属性
        switch(type) {
            case 'player':
                this.width = 2;
                this.height = 15;
                this.color = '#ffff00';
                this.glowColor = '#ffff00';
                // 玩家子弹向上发射，修正速度向量
                this.vx = Math.sin(angle) * Math.abs(speed);
                this.vy = -Math.cos(angle) * Math.abs(speed);
                break;
            case 'enemy':
                this.width = 10;
                this.height = 16;
                this.color = color || '#ff8800';
                this.glowColor = '#ffaa00';
                // 敌机子弹 - 椭圆形，支持角度射击（可抵消，尺寸较大）
                this.vx = Math.sin(angle) * speed;
                this.vy = Math.cos(angle) * speed;
                break;
            case 'normal':
            case 'fast':
            case 'scout':
                this.width = 6;
                this.height = 12;
                this.color = color || '#ff8800';
                this.glowColor = '#ffaa00';
                // 敌机子弹 - 椭圆形，支持角度射击
                this.vx = Math.sin(angle) * speed;
                this.vy = Math.cos(angle) * speed;
                break;
            case 'heavy':
            case 'armored':
                this.width = 8;
                this.height = 8;
                this.color = color || '#ff0000';
                this.glowColor = '#ff6600';
                // 重型子弹 - 圆形，支持角度射击
                this.vx = Math.sin(angle) * speed;
                this.vy = Math.cos(angle) * speed;
                break;
            case 'piercing':
            case 'venom':
            case 'spiral':
                this.width = 11; // 缩小到70%
                this.height = 11; // 缩小到70%
                this.color = color || '#ff00ff'; // 改为紫色
                this.glowColor = '#ff66ff';
                // Boss不可抵消子弹 - 圆形，支持角度射击（体积缩小到70%）
                this.vx = Math.sin(angle) * speed;
                this.vy = Math.cos(angle) * speed;
                break;
            case 'boss':
            case 'boss_normal':
            case 'boss_poison':
            case 'boss_pierce':
                this.width = 10;
                this.height = 18;
                this.color = type === 'boss_poison' ? '#00ff00' : type === 'boss_pierce' ? '#ff00ff' : '#ff0000';
                this.glowColor = type === 'boss_poison' ? '#00cc00' : type === 'boss_pierce' ? '#cc00cc' : '#ff6600';
                // Boss子弹 - 支持角度射击
                this.vx = Math.sin(angle) * speed;
                this.vy = Math.cos(angle) * speed;
                break;
            case 'powerShot':
                this.width = 8;
                this.height = 18;
                this.color = '#ffff00';
                this.glowColor = '#ffaa00';
                // 强化子弹向上发射，修正速度向量
                this.vx = Math.sin(angle) * Math.abs(speed);
                this.vy = -Math.cos(angle) * Math.abs(speed);
                break;
            case 'upgraded': 
                this.width = 6;
                this.height = 16;
                this.color = color || '#00ff80';
                this.glowColor = color || '#00ff80';
                // 升级子弹向上发射，修正速度向量
                this.vx = Math.sin(angle) * Math.abs(speed);
                this.vy = -Math.cos(angle) * Math.abs(speed);
                break;
            case 'tracking': // 跟踪导弹
                this.width = 10;
                this.height = 28;
                this.color = '#ff4400';
                this.glowColor = '#ff8800';
                this.trackingSpeed = 0.2; // 跟踪转向速度
                this.maxSpeed = Math.abs(speed);
                // 跟踪导弹初始向上发射
                this.vx = Math.sin(angle) * Math.abs(speed);
                this.vy = -Math.cos(angle) * Math.abs(speed);
                this.angle = angle; // 导弹的视觉角度
                break;
        }
    }

    update() {
        // 保存轨迹
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 8) {
            this.trail.shift();
        }
        
        // 跟踪导弹的特殊逻辑
        if (this.type === 'tracking') {
            // 寻找最近的敌机（所有类型）
            let closestEnemy = null;
            let closestDistance = Infinity;
            
            enemies.forEach(enemy => {
                const dx = (enemy.x + enemy.width / 2) - (this.x + this.width / 2);
                const dy = (enemy.y + enemy.height / 2) - (this.y + this.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            });
            
            // 如果找到敌机，调整导弹方向
            if (closestEnemy) {
                const dx = (closestEnemy.x + closestEnemy.width / 2) - (this.x + this.width / 2);
                const dy = (closestEnemy.y + closestEnemy.height / 2) - (this.y + this.height / 2);
                const targetAngle = Math.atan2(dx, -dy); // 注意Y轴方向
                const currentAngle = Math.atan2(this.vx, -this.vy);
                
                // 计算角度差并限制转向速度
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // 限制每帧的转向角度
                const maxTurnRate = this.trackingSpeed;
                if (Math.abs(angleDiff) > maxTurnRate) {
                    angleDiff = Math.sign(angleDiff) * maxTurnRate;
                }
                
                const newAngle = currentAngle + angleDiff;
                this.vx = Math.sin(newAngle) * this.maxSpeed;
                this.vy = -Math.cos(newAngle) * this.maxSpeed;
                
                // 更新导弹的视觉角度
                this.angle = newAngle;
            } else {
                // 没有目标时，保持当前角度
                this.angle = Math.atan2(this.vx, -this.vy);
            }
        }
        
        // 使用速度向量移动
        this.x += this.vx;
        this.y += this.vy;
        this.animationTimer += 0.3;
        this.glowIntensity = Math.sin(this.animationTimer) * 0.3 + 0.7;
        
        // 更新椭圆形子弹的旋转角度
        if (this.type === 'boss_poison' || this.type === 'boss_pierce' || this.type === 'boss' || this.type === 'enemy' || this.type === 'normal' || this.type === 'fast' || this.type === 'scout') {
            this.rotationAngle += this.rotationSpeed;
        }
        
        // 为玩家子弹添加粒子效果
        if (this.type === 'player' || this.type === 'powerShot') {
            if (Math.random() < 0.3) {
                this.particles.push({
                    x: this.x + this.width/2 + (Math.random() - 0.5) * 4,
                    y: this.y + this.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    life: 15,
                    maxLife: 15,
                    color: this.glowColor
                });
            }
        }
        
        // 更新粒子
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.vx *= 0.95;
            particle.vy *= 0.95;
            return particle.life > 0;
        });
    }

    draw() {
        const ctx = window.ctx; // 使用全局ctx
        if (!ctx) return;
        
        // 绘制轨迹（仅强化子弹有轨迹效果）
        if (this.trail.length > 1 && this.type === 'powerShot') {
            ctx.save();
            for (let i = 0; i < this.trail.length - 1; i++) {
                const alpha = (i + 1) / this.trail.length * 0.5;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = this.color;
                const size = (i + 1) / this.trail.length;
                ctx.fillRect(
                    this.trail[i].x + this.width/2 - size,
                    this.trail[i].y + this.height/2 - size * 2,
                    size * 2,
                    size * 4
                );
            }
            ctx.restore();
        }
        
        // 绘制发光效果
        if (this.glowColor) {
            ctx.save();
            ctx.globalAlpha = 0.2 * this.glowIntensity;
            ctx.fillStyle = this.glowColor;
            
            // 根据子弹类型选择发光形状
            if (this.type === 'boss_normal' || this.type === 'heavy' || this.type === 'armored') {
                // 圆形子弹使用圆形发光效果
                const radius = (this.width / 2) + 3;
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'boss_poison' || this.type === 'boss_pierce' || this.type === 'boss' || this.type === 'enemy' || this.type === 'normal' || this.type === 'fast' || this.type === 'scout') {
                // 椭圆形子弹使用椭圆形发光效果
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                const radiusX = (this.width / 2) + 3;
                const radiusY = (this.height / 2) + 3;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 其他子弹使用矩形发光效果
                ctx.fillRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
            }
            
            ctx.restore();
        }
        
        // 绘制主体 - 小蜜蜂风格
        ctx.save();
        if (this.type === 'player') {
            // 玩家子弹 - 蜜蜂毒针（带角度旋转）
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle || 0);
            ctx.translate(-this.width / 2, -this.height / 2);
            
            // 针刺主体 - 极细的金黄色针身
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(this.width/2 - 0.5, 2, 1, this.height - 4);
            
            // 针尖 - 极其尖锐的针头
            ctx.fillStyle = '#cc9900';
            ctx.beginPath();
            ctx.moveTo(this.width/2, 0);
            ctx.lineTo(this.width/2 - 1, 3);
            ctx.lineTo(this.width/2 + 1, 3);
            ctx.closePath();
            ctx.fill();
            
            // 针刺倒钩 - 蜜蜂针的特征
            ctx.fillStyle = '#cc9900';
            ctx.beginPath();
            ctx.moveTo(this.width/2 - 0.5, 4);
            ctx.lineTo(this.width/2 - 1.5, 5);
            ctx.lineTo(this.width/2 - 0.5, 6);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.width/2 + 0.5, 4);
            ctx.lineTo(this.width/2 + 1.5, 5);
            ctx.lineTo(this.width/2 + 0.5, 6);
            ctx.closePath();
            ctx.fill();
            
            // 毒液效果 - 针尖的绿色毒液
            ctx.fillStyle = '#32cd32';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.width/2, 1, 0.5, 0, Math.PI * 2);
            ctx.fill();
            
            // 移除金色光芒效果
            
            ctx.restore();
            
        } else if (this.type === 'powerShot') {
            // 强化子弹 - 黄色能量光束
            // 光束主体
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(this.x + 1, this.y + 2, this.width - 2, this.height - 4);
            
            // 光束头部
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x, this.y + 3);
            ctx.lineTo(this.x + this.width, this.y + 3);
            ctx.closePath();
            ctx.fill();
            
            // 光束尾部
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height - 4);
            ctx.lineTo(this.x + this.width, this.y + this.height - 4);
            ctx.lineTo(this.x + this.width/2, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            // 能量脉冲
            const pulseY = this.y + this.height - 3 + Math.sin(this.animationTimer) * 2;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(this.x + this.width/2 - 0.25, pulseY, 0.5, 1);
            
        } else if (this.type === 'tracking') {
            // 跟踪导弹 - 橙红色火箭弹（带旋转）
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle || 0);
            ctx.translate(-this.width / 2, -this.height / 2);
            
            // 导弹主体
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(1, 5, this.width - 2, this.height - 10);
            
            // 导弹弹头
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.moveTo(this.width/2, 0);
            ctx.lineTo(0, 5);
            ctx.lineTo(this.width, 5);
            ctx.closePath();
            ctx.fill();
            
            // 导弹尾翼
            ctx.fillStyle = '#cc4400';
            ctx.beginPath();
            ctx.moveTo(0, this.height - 5);
            ctx.lineTo(-2, this.height);
            ctx.lineTo(3, this.height - 5);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.width, this.height - 5);
            ctx.lineTo(this.width + 2, this.height);
            ctx.lineTo(this.width - 3, this.height - 5);
            ctx.closePath();
            ctx.fill();
            
            // 推进器火焰效果
            const flameHeight = 3 + Math.random() * 2;
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(2, this.height - 3);
            ctx.lineTo(this.width - 2, this.height - 3);
            ctx.lineTo(this.width/2, this.height + flameHeight);
            ctx.closePath();
            ctx.fill();
            
            // 高光
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.width/2 - 0.5, 2, 1, 2);
            
            // 跟踪指示灯
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.width/2 - 1, this.height - 8, 2, 2);
            
            ctx.restore();
            
        } else if (this.type === 'upgraded') {
            // 升级子弹 - 绿色能量箭矢
            // 箭矢主体
            ctx.fillStyle = '#00cc66';
            ctx.fillRect(this.x + 1, this.y + 3, this.width - 2, this.height - 6);
            
            // 箭头尖端
            ctx.fillStyle = '#00ff80';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x, this.y + 4);
            ctx.lineTo(this.x + this.width, this.y + 4);
            ctx.closePath();
            ctx.fill();
            
            // 箭羽
            ctx.fillStyle = '#008844';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height - 3);
            ctx.lineTo(this.x + this.width/2, this.y + this.height - 1);
            ctx.lineTo(this.x + this.width, this.y + this.height - 3);
            ctx.lineTo(this.x + this.width/2, this.y + this.height - 5);
            ctx.closePath();
            ctx.fill();
            
            // 能量光芒
            const pulseY = this.y + this.height - 3 + Math.sin(this.animationTimer) * 2;
            ctx.fillStyle = '#00ff80';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(this.x + this.width/2 - 0.5, pulseY, 1, 2);
            
        } else if (this.type === 'boss' || this.type === 'boss_normal' || this.type === 'boss_poison' || this.type === 'boss_pierce') {
            // Boss子弹 - 大型能量球
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const radiusX = this.width / 2;
            const radiusY = this.height / 2;
            
            // 外层发光
            ctx.fillStyle = this.glowColor;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, this.rotationAngle, 0, Math.PI * 2);
            ctx.fill();
            
            // 内层核心
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX * 0.7, radiusY * 0.7, this.rotationAngle, 0, Math.PI * 2);
            ctx.fill();
            
            // 能量纹路
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX * 0.4, radiusY * 0.4, this.rotationAngle + Math.PI / 4, 0, Math.PI * 2);
            ctx.stroke();
            
        } else if (this.type === 'heavy' || this.type === 'armored') {
            // 重型子弹 - 圆形能量球
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const radius = this.width / 2;
            
            // 外层
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // 内层
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            
        } else {
            // 普通敌机子弹 - 椭圆形能量弹
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            const radiusX = this.width / 2;
            const radiusY = this.height / 2;
            
            // 外层
            ctx.fillStyle = '#ff6600';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, this.rotationAngle, 0, Math.PI * 2);
            ctx.fill();
            
            // 内层
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX * 0.7, radiusY * 0.7, this.rotationAngle, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.ellipse(centerX - radiusX * 0.3, centerY - radiusY * 0.3, radiusX * 0.2, radiusY * 0.2, this.rotationAngle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // 绘制粒子
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life / particle.maxLife * 0.7;
            ctx.fillStyle = particle.color;
            ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
            ctx.restore();
        });
    }
}