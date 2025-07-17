// 敌机类
class Enemy {
    constructor(x, y, type = 'normal', color = null) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.lifeTimer = 0;
        this.phaseChangeTimer = 0;
        
        // 根据敌机类型设置不同属性
        switch(type) {
            case 'boss':
                this.width = 80;
                this.height = 60;
                this.speed = 1;
                this.color = color || '#ff0000';
                this.health = 150;
                 this.maxHealth = 150;
                this.shootInterval = 50;
                this.movePattern = 'boss';
                this.phase = 1; // Boss阶段
                this.behaviorState = 'normal'; // normal, retreat, hover, escaping, crossing
                this.targetX = x;
                this.targetY = y + 100;
                this.hoverTime = 0;
                this.maxHoverTime = 180; // 3秒悬停
                break;
            case 'fast': //快速 黄色方块
                this.width = 25;
                this.height = 25;
                this.speed = 4;
                this.color = color || '#ffff00';
                this.health = 3;
                this.maxHealth = 3;
                this.shootInterval = 80;
                this.movePattern = 'zigzag';
                this.behaviorState = 'normal';
                break;
            case 'heavy': //重型  棕色
                this.width = 45;
                this.height = 40;
                this.speed = 1.5;
                this.color = color || '#8b4513';
                this.health = 15;
                this.maxHealth = 15;
                this.shootInterval = 100;
                this.movePattern = 'straight';
                this.behaviorState = 'normal';
                break;
            case 'armored': //装甲  绿色
                this.width = 30;
                this.height = 25;
                this.speed = 2;
                this.color = color || '#666666';
                this.health = 9;
                this.maxHealth = 9;
                this.shootInterval = 90;
                this.movePattern = 'straight';
                this.behaviorState = 'normal';
                break;
            case 'scout': // 绿色 蜻蜓
                this.width = 25;
                this.height = 25;
                this.speed = 5;
                this.color = color || '#00ff00';
                this.health = 3;
                this.maxHealth = 3;
                this.shootInterval = 60;
                this.movePattern = 'scout';
                this.behaviorState = 'normal';
                break;
            default: // normal
                this.width = 35;
                this.height = 20;
                this.speed = 2.4;
                this.color = color || '#ff8800';
                this.health = 3;
                this.maxHealth = 3;
                this.shootInterval = 60;
                this.movePattern = 'straight';
                this.behaviorState = 'normal';
                break;
        }
        
        this.shootTimer = Math.random() * this.shootInterval;
        this.hitFlash = 0;
        this.direction = 1; // 用于左右移动
    }

    update() {
        this.lifeTimer++;
        
        // Boss阶段变化动画计时器
        if (this.phaseChangeTimer > 0) {
            this.phaseChangeTimer--;
        }
        
        // 根据行为状态执行不同的移动逻辑
        switch(this.behaviorState) {
            case 'normal':
                // 正常移动模式
                switch(this.movePattern) {
                    case 'boss':
                        // Boss移动到目标位置后悬停
                        const distanceToTarget = Math.sqrt(
                            Math.pow(this.targetX - this.x, 2) + 
                            Math.pow(this.targetY - this.y, 2)
                        );
                        
                        if (distanceToTarget > 5) {
                            // 移动到目标位置
                            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                            this.x += Math.cos(angle) * this.speed;
                            this.y += Math.sin(angle) * this.speed;
                        } else {
                            // 到达目标位置，开始悬停
                            this.behaviorState = 'hover';
                        }
                        break;
                    case 'zigzag':
                        this.y += this.speed;
                        this.x += Math.sin(this.lifeTimer * 0.1) * 2;
                        break;
                    case 'scout':
                        this.y += this.speed;
                        this.x += Math.sin(this.lifeTimer * 0.15) * 3;
                        break;
                    default:
                        this.y += this.speed;
                        break;
                }
                break;
                
            case 'hover':
                // Boss悬停状态
                this.hoverTime++;
                // 悬停时轻微摆动
                this.x += Math.sin(this.hoverTime * 0.05) * 0.5;
                
                if (this.hoverTime >= this.maxHoverTime) {
                    // 悬停结束，选择新的目标位置
                    this.targetX = Math.random() * (canvas.width - this.width);
                    this.targetY = Math.random() * 150 + 50; // 在屏幕上半部分
                    this.hoverTime = 0;
                    this.behaviorState = 'normal';
                }
                break;
                
            case 'retreat':
                // 撤退移动 - 向上移动并左右摆动
                this.y -= this.speed * 1.5;
                this.x += Math.sin(this.lifeTimer * 0.2) * 2;
                break;
                
            case 'escaping':
                // 快速逃离
                this.y -= this.speed * 3;
                this.x += (Math.random() - 0.5) * 4;
                break;
                
            case 'crossing':
                // 快速穿越
                this.y += this.speed * 2;
                this.x += this.direction * this.speed * 1.5;
                break;
        }
        
        // 边界检查
        if (this.x < 0) {
            this.x = 0;
            this.direction *= -1;
        }
        if (this.x + this.width > canvas.width) {
            this.x = canvas.width - this.width;
            this.direction *= -1;
        }
        
        // 被击中闪烁效果
        if (this.hitFlash > 0) {
            this.hitFlash--;
        }
        
        // 敌机射击
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shoot();
            this.shootTimer = 0;
        }
    }

    takeDamage(damage = 1) {
        this.health -= damage;
        this.hitFlash = 10;
        
        // Boss阶段变化逻辑
        if (this.type === 'boss') {
            const healthPercent = this.health / this.maxHealth;
            const newPhase = healthPercent > 0.66 ? 1 : healthPercent > 0.33 ? 2 : 3;
            
            if (newPhase !== this.phase) {
                this.phase = newPhase;
                this.phaseChangeTimer = 60; // 1秒的阶段变化特效
                
                // 根据阶段调整属性
                switch(this.phase) {
                    case 2:
                        this.shootInterval = 40; // 射击频率降低一倍
                        this.speed = 1.5;
                        break;
                    case 3:
                        this.shootInterval = 30; // 射击频率降低一倍
                        this.speed = 2;
                        break;
                }
            }
        }
        
        // 侦察机受击后逃跑
        if (this.type === 'scout' && this.behaviorState === 'normal') {
            this.behaviorState = 'escaping';
        }
        
        // 重型敌机受击后有概率提前撤退
        if (this.type === 'heavy' && this.health <= this.maxHealth / 2 && this.behaviorState === 'normal') {
            if (Math.random() < 0.3) {
                this.behaviorState = 'retreat';
            }
        }
        
        return this.health <= 0;
    }

    shoot() {
        // 限制射击角度，确保敌机向下射击
        const maxAngle = Math.PI / 6; // 30度
        
        if (this.type === 'boss') {
            // Boss根据阶段有不同的攻击模式
            switch(this.phase) {
                case 1:
                    // 第一阶段：基础攻击
                    enemyBullets.push(new Bullet(
                        this.x + this.width / 2,
                        this.y + this.height,
                        2.5,
                        '#ff6600',
                        'enemy'
                    ));
                    break;
                case 2:
                    // 第二阶段：三连发（中间可抵消，两边不可抵消）
                    for (let i = -1; i <= 1; i++) {
                        const angle = i * 0.3;
                        const bulletType = i === 0 ? 'enemy' : 'venom'; // 中间子弹可抵消
                        const bulletColor = i === 0 ? '#ff6600' : '#00ff62'; // venom子弹使用绿色
                        enemyBullets.push(new Bullet(
                            this.x + this.width / 2 + i * 10,
                            this.y + this.height,
                            3,
                            bulletColor,
                            bulletType,
                            angle
                        ));
                    }
                    break;
                case 3:
                    // 第三阶段：扇形弹幕（交替可抵消和不可抵消）
                    for (let i = -2; i <= 2; i++) {
                        const angle = i * 0.2;
                        const bulletType = i % 2 === 0 ? 'enemy' : 'piercing'; // 偶数位置可抵消
                        const bulletColor = i % 2 === 0 ? '#ff6600' : '#ff00ff'; // piercing子弹使用紫色
                        enemyBullets.push(new Bullet(
                            this.x + this.width / 2,
                            this.y + this.height,
                            3.5,
                            bulletColor,
                            bulletType,
                            angle
                        ));
                    }
                    // 额外的螺旋弹（可抵消）
                    const spiralAngle = this.lifeTimer * 0.1;
                    enemyBullets.push(new Bullet(
                        this.x + this.width / 2,
                        this.y + this.height,
                        2.5,
                        '#ff6600',
                        'enemy',
                        Math.sin(spiralAngle) * 0.5
                    ));
                    break;
            }
        } else {
            // 其他敌机的射击逻辑
            let bulletType = 'enemy';
            let bulletColor = '#ff8800';
            let bulletSpeed = 3;
            let angle = 0;
            
            switch(this.type) {
                case 'fast':
                    bulletType = 'fast';
                    bulletColor = '#ffff00';
                    bulletSpeed = 5;
                    break;
                case 'heavy':
                    bulletType = 'heavy';
                    bulletColor = '#ff4400';
                    bulletSpeed = 2;
                    // 重型敌机发射三发子弹
                    for (let i = -1; i <= 1; i++) {
                        angle = Math.max(-maxAngle, Math.min(maxAngle, i * 0.3));
                        enemyBullets.push(new Bullet(
                            this.x + this.width / 2 + i * 8,
                            this.y + this.height,
                            bulletSpeed,
                            bulletColor,
                            bulletType,
                            angle
                        ));
                    }
                    return;
                case 'armored':
                    bulletType = 'piercing';
                    bulletColor = '#ff00ff'; // piercing子弹使用紫色
                    bulletSpeed = 4;
                    break;
                case 'scout':
                    if (this.behaviorState === 'escaping') {
                        return; // 逃跑时不射击
                    }
                    bulletType = 'scout';
                    bulletColor = '#00ff88';
                    bulletSpeed = 3;
                    break;
            }
            
            // 计算向玩家射击的角度，但限制在合理范围内
            if (typeof player !== 'undefined') {
                const dx = player.x + player.width / 2 - (this.x + this.width / 2);
                const dy = player.y + player.height / 2 - (this.y + this.height);
                angle = Math.atan2(dx, dy); // 正确的角度计算，dx为sin分量，dy为cos分量
                angle = Math.max(-maxAngle, Math.min(maxAngle, angle));
            }
            
            enemyBullets.push(new Bullet(
                this.x + this.width / 2,
                this.y + this.height,
                bulletSpeed,
                bulletColor,
                bulletType,
                angle
            ));
        }
    }

    draw() {
        if (this.hitFlash > 0 && this.hitFlash % 4 < 2) {
            return; // 闪烁效果
        }
        
        const isFlashing = this.hitFlash > 0;
        
        if (this.type === 'boss') {
            // Boss绘制逻辑
            let bodyColor, headColor, eyeColor, legColor, fangColor, patternColor;
            
            // 根据阶段改变颜色
            switch(this.phase) {
                case 1:
                    bodyColor = isFlashing ? '#ffffff' : '#8b0000';
                    headColor = isFlashing ? '#000000' : '#a0522d';
                    eyeColor = isFlashing ? '#000000' : '#ff4500';
                    legColor = isFlashing ? '#ffffff' : '#654321';
                    fangColor = isFlashing ? '#000000' : '#ffffff';
                    patternColor = isFlashing ? '#000000' : '#ffff00';
                    break;
                case 2:
                    bodyColor = isFlashing ? '#ffffff' : '#4b0000';
                    headColor = isFlashing ? '#000000' : '#8b4513';
                    eyeColor = isFlashing ? '#000000' : '#ff6347';
                    legColor = isFlashing ? '#ffffff' : '#2f1b14';
                    fangColor = isFlashing ? '#000000' : '#ff4500';
                    patternColor = isFlashing ? '#000000' : '#ff8c00';
                    break;
                case 3:
                    bodyColor = isFlashing ? '#ffffff' : '#2b0000';
                    headColor = isFlashing ? '#000000' : '#654321';
                    eyeColor = isFlashing ? '#000000' : '#ff0000';
                    legColor = isFlashing ? '#ffffff' : '#220000';
                    fangColor = isFlashing ? '#000000' : '#ff0000';
                    patternColor = isFlashing ? '#000000' : '#ff0000';
            }
            
            // 腹部（主体）- 根据阶段调整大小
            const sizeMultiplier = 1 + (this.phase - 1) * 0.1;
            ctx.fillStyle = bodyColor;
            ctx.fillRect(this.x + this.width/4, this.y + this.height/4, this.width/2 * sizeMultiplier, this.height/2 * sizeMultiplier);
            
            // 头胸部
            ctx.fillStyle = headColor;
            ctx.fillRect(this.x + this.width/3, this.y, this.width/3 * sizeMultiplier, this.height/3);
            
            // 多只眼睛 - 第三阶段增加更多眼睛
            ctx.fillStyle = eyeColor;
            const eyeCount = this.phase === 3 ? 8 : 6;
            for (let i = 0; i < eyeCount; i++) {
                const eyeX = this.x + this.width/3 + (i % (this.phase === 3 ? 4 : 3)) * 5;
                const eyeY = this.y + 5 + Math.floor(i / (this.phase === 3 ? 4 : 3)) * 4;
                ctx.fillRect(eyeX, eyeY, 2, 2);
            }
            
            // 蜘蛛腿 - 根据阶段调整数量和长度
            ctx.fillStyle = legColor;
            const legCount = this.phase === 3 ? 6 : 4;
            const legLength = 8 + this.phase * 2;
            for (let i = 0; i < legCount; i++) {
                const legY = this.y + this.height/4 + i * (this.phase === 3 ? 6 : 8);
                // 左侧腿
                ctx.fillRect(this.x - legLength, legY, legLength + 4, 2);
                ctx.fillRect(this.x - legLength - 4, legY + 2, legLength, 2);
                // 右侧腿
                ctx.fillRect(this.x + this.width - 4, legY, legLength + 4, 2);
                ctx.fillRect(this.x + this.width + 4, legY + 2, legLength, 2);
            }
            
            // 毒牙 - 第二阶段开始增大
            ctx.fillStyle = fangColor;
            const fangSize = this.phase === 1 ? 8 : this.phase === 2 ? 12 : 16;
            ctx.fillRect(this.x + this.width/2 - 3, this.y + this.height/3 - 2, 2, fangSize);
            ctx.fillRect(this.x + this.width/2 + 1, this.y + this.height/3 - 2, 2, fangSize);
            
            // 腹部花纹 - 根据阶段变化
            ctx.fillStyle = patternColor;
            if (this.phase === 1) {
                ctx.fillRect(this.x + this.width/3, this.y + this.height/3, this.width/3, 3);
                ctx.fillRect(this.x + this.width/3, this.y + this.height/2, this.width/3, 3);
            } else if (this.phase === 2) {
                // 第二阶段 - 更复杂的花纹
                for (let i = 0; i < 4; i++) {
                    ctx.fillRect(this.x + this.width/4, this.y + this.height/3 + i * 4, this.width/2, 2);
                }
            } else {
                // 第三阶段 - 骷髅花纹
                ctx.fillRect(this.x + this.width/3, this.y + this.height/3, this.width/3, 2);
                ctx.fillRect(this.x + this.width/3, this.y + this.height/2, this.width/3, 2);
                ctx.fillRect(this.x + this.width/2 - 4, this.y + this.height/3 + 4, 8, 2);
                ctx.fillRect(this.x + this.width/2 - 6, this.y + this.height/2 + 4, 12, 2);
            }
            
            // 阶段变化特效
            if (this.phaseChangeTimer > 0) {
                ctx.fillStyle = this.phase === 2 ? '#ff00ff' : '#ff0000';
                ctx.globalAlpha = 0.3 + Math.sin(this.phaseChangeTimer * 0.3) * 0.3;
                ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
                ctx.globalAlpha = 1;
            }
            
            // 绘制Boss血量条
            const barWidth = this.width;
            const barHeight = 6;
            const healthPercent = this.health / this.maxHealth;
            
            // 血量条背景
            ctx.fillStyle = '#333333';
            ctx.fillRect(this.x, this.y - 15, barWidth, barHeight);
            
            // 血量条
            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.2 ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x, this.y - 15, barWidth * healthPercent, barHeight);
            
            // 血量条边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y - 15, barWidth, barHeight);
        } else {
            // 根据敌机类型绘制不同外观
            ctx.fillStyle = isFlashing ? '#ffffff' : this.color;
            
            switch(this.type) {
                case 'armored':
                    // 装甲敌机 - 犀牛甲虫风格
                    // 主体甲壳 - 椭圆形
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#66aa44';
                    ctx.fillRect(this.x + 2, this.y + 3, this.width - 4, this.height - 6);
                    
                    // 头部甲壳
                    ctx.fillStyle = isFlashing ? '#000000' : '#44cc33';
                    ctx.fillRect(this.x + this.width/4, this.y, this.width/2, 8);
                    
                    // 甲壳光泽条纹
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#88dd66';
                    ctx.fillRect(this.x + 4, this.y + 5, this.width - 8, 1);
                    ctx.fillRect(this.x + 6, this.y + 8, this.width - 12, 1);
                    ctx.fillRect(this.x + 4, this.y + 11, this.width - 8, 1);
                    
                    // 犀牛角
                    ctx.fillStyle = isFlashing ? '#000000' : '#8b4513';
                    ctx.fillRect(this.x + this.width/2 - 1, this.y - 4, 2, 6);
                    ctx.fillRect(this.x + this.width/2 - 2, this.y - 2, 4, 2);
                    
                    // 复眼
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ff4500';
                    ctx.fillRect(this.x + this.width/2 - 4, this.y + 2, 2, 2);
                    ctx.fillRect(this.x + this.width/2 + 2, this.y + 2, 2, 2);
                    
                    // 触角 - 弯曲状
                    ctx.fillStyle = isFlashing ? '#000000' : '#aa7744';
                    ctx.fillRect(this.x + this.width/2 - 6, this.y - 1, 1, 3);
                    ctx.fillRect(this.x + this.width/2 - 7, this.y - 2, 2, 1);
                    ctx.fillRect(this.x + this.width/2 + 5, this.y - 1, 1, 3);
                    ctx.fillRect(this.x + this.width/2 + 5, this.y - 2, 2, 1);
                    
                    // 六条腿 - 更真实的节肢动物腿
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#666666';
                    for (let i = 0; i < 3; i++) {
                        const legY = this.y + 6 + i * 4;
                        // 左腿
                        ctx.fillRect(this.x - 2, legY, 4, 1);
                        ctx.fillRect(this.x - 3, legY + 1, 2, 1);
                        // 右腿
                        ctx.fillRect(this.x + this.width - 2, legY, 4, 1);
                        ctx.fillRect(this.x + this.width + 1, legY + 1, 2, 1);
                    }
                    break;
                    
                case 'scout':
                    // 侦察机 - 蜻蜓风格
                    // 细长身体 - 蜻蜓特征
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#44dd44';
                    ctx.fillRect(this.x + this.width/2 - 2, this.y + 2, 4, this.height - 4);
                    
                    // 头部 - 大复眼
                    ctx.fillStyle = isFlashing ? '#000000' : '#66ff66';
                    ctx.fillRect(this.x + this.width/2 - 4, this.y, 8, 6);
                    
                    // 巨大复眼
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ff6347';
                    ctx.fillRect(this.x + this.width/2 - 6, this.y + 1, 3, 3);
                    ctx.fillRect(this.x + this.width/2 + 3, this.y + 1, 3, 3);
                    
                    // 复眼细节
                    ctx.fillStyle = isFlashing ? '#000000' : '#ff4444';
                    ctx.fillRect(this.x + this.width/2 - 5, this.y + 2, 1, 1);
                    ctx.fillRect(this.x + this.width/2 + 4, this.y + 2, 1, 1);
                    
                    // 四片透明翅膀
                    const wingFlutter = this.behaviorState === 'escaping' ? Math.sin(this.lifeTimer * 0.5) * 2 : 0;
                    ctx.fillStyle = isFlashing ? '#000000' : 'rgba(173, 216, 230, 0.7)';
                    // 上翅膀
                    ctx.fillRect(this.x - 6, this.y + 4 + wingFlutter, 8, 3);
                    ctx.fillRect(this.x + this.width - 2, this.y + 4 + wingFlutter, 8, 3);
                    // 下翅膀
                    ctx.fillRect(this.x - 5, this.y + 8 - wingFlutter, 7, 3);
                    ctx.fillRect(this.x + this.width - 2, this.y + 8 - wingFlutter, 7, 3);
                    
                    // 翅膀纹理
                    ctx.strokeStyle = isFlashing ? '#ffffff' : '#4682b4';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(this.x - 6, this.y + 4 + wingFlutter, 8, 3);
                    ctx.strokeRect(this.x + this.width - 2, this.y + 4 + wingFlutter, 8, 3);
                    
                    // 短触角
                    ctx.fillStyle = isFlashing ? '#000000' : '#44aa44';
                    ctx.fillRect(this.x + this.width/2 - 3, this.y - 1, 1, 2);
                    ctx.fillRect(this.x + this.width/2 + 2, this.y - 1, 1, 2);
                    
                    // 身体分节
                    ctx.fillStyle = isFlashing ? '#000000' : '#44aa44';
                    for (let i = 0; i < 4; i++) {
                        ctx.fillRect(this.x + this.width/2 - 2, this.y + 6 + i * 3, 4, 1);
                    }
                    
                    if (this.behaviorState === 'escaping') {
                        // 逃跑时翅膀快速振动效果
                        ctx.fillStyle = '#ffff00';
                        ctx.fillRect(this.x - 8, this.y + 3, this.width + 16, 1);
                        ctx.fillRect(this.x - 8, this.y + 10, this.width + 16, 1);
                    }
                    break;
                    
                case 'fast':
                    // 快速敌机 - 胡蜂风格
                    // 胡蜂身体 - 细腰设计
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ffd700';
                    ctx.fillRect(this.x + 6, this.y + 2, this.width - 12, 6); // 胸部
                    ctx.fillRect(this.x + 4, this.y + 10, this.width - 8, this.height - 12); // 腹部
                    
                    // 细腰连接
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ffb347';
                    ctx.fillRect(this.x + this.width/2 - 1, this.y + 8, 2, 2);
                    
                    // 黄黑警告条纹
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#000000';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(this.x + 5, this.y + 11 + i * 3, this.width - 10, 1);
                    }
                    
                    // 头部
                    ctx.fillStyle = isFlashing ? '#000000' : '#ffb347';
                    ctx.fillRect(this.x + this.width/2 - 3, this.y, 6, 4);
                    
                    // 复眼
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ff4444';
                    ctx.fillRect(this.x + this.width/2 - 4, this.y + 1, 2, 2);
                    ctx.fillRect(this.x + this.width/2 + 2, this.y + 1, 2, 2);
                    
                    // 触角
                    ctx.fillStyle = isFlashing ? '#000000' : '#aa7744';
                    ctx.fillRect(this.x + this.width/2 - 2, this.y - 1, 1, 2);
                    ctx.fillRect(this.x + this.width/2 + 1, this.y - 1, 1, 2);
                    
                    // 透明翅膀 - 快速振动
                    const wingBlur = Math.sin(this.lifeTimer * 0.8) * 1;
                    ctx.fillStyle = isFlashing ? '#000000' : 'rgba(255, 255, 255, 0.6)';
                    ctx.fillRect(this.x - 2, this.y + 3 + wingBlur, 6, 4);
                    ctx.fillRect(this.x + this.width - 4, this.y + 3 + wingBlur, 6, 4);
                    
                    // 翅膀纹理
                    ctx.strokeStyle = isFlashing ? '#ffffff' : '#ddd';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(this.x - 2, this.y + 3, 6, 4);
                    ctx.strokeRect(this.x + this.width - 4, this.y + 3, 6, 4);
                    
                    // 六条腿
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#8b4513';
                    for (let i = 0; i < 3; i++) {
                        const legY = this.y + 4 + i * 2;
                        ctx.fillRect(this.x + 2, legY, 2, 1);
                        ctx.fillRect(this.x + this.width - 4, legY, 2, 1);
                    }
                    
                    // 毒刺
                    ctx.fillStyle = isFlashing ? '#000000' : '#ff0000';
                    ctx.fillRect(this.x + this.width/2 - 1, this.y + this.height, 2, 4);
                    ctx.fillRect(this.x + this.width/2 - 0.5, this.y + this.height + 2, 1, 2);
                    break;
                    
                case 'heavy':
                    // 重型敌机 - 锹甲虫风格
                    // 厚重甲壳主体
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#aa6644';
                    ctx.fillRect(this.x + 1, this.y + 2, this.width - 2, this.height - 4);
                    
                    // 头部甲壳
                    ctx.fillStyle = isFlashing ? '#000000' : '#884422';
                    ctx.fillRect(this.x + 3, this.y, this.width - 6, 8);
                    
                    // 甲壳光泽
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#8b4513';
                    ctx.fillRect(this.x + 3, this.y + 4, this.width - 6, 1);
                    ctx.fillRect(this.x + 5, this.y + 7, this.width - 10, 1);
                    ctx.fillRect(this.x + 3, this.y + 10, this.width - 6, 1);
                    
                    // 巨大锹甲 - 分叉设计
                    ctx.fillStyle = isFlashing ? '#000000' : '#cc8855';
                    ctx.fillRect(this.x + this.width/2 - 1, this.y - 6, 2, 8);
                    // 锹甲分叉
                    ctx.fillRect(this.x + this.width/2 - 3, this.y - 4, 2, 1);
                    ctx.fillRect(this.x + this.width/2 + 1, this.y - 4, 2, 1);
                    ctx.fillRect(this.x + this.width/2 - 4, this.y - 3, 1, 2);
                    ctx.fillRect(this.x + this.width/2 + 3, this.y - 3, 1, 2);
                    
                    // 小复眼
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#ff4500';
                    ctx.fillRect(this.x + this.width/2 - 3, this.y + 2, 1, 1);
                    ctx.fillRect(this.x + this.width/2 + 2, this.y + 2, 1, 1);
                    
                    // 触角 - 锯齿状
                    ctx.fillStyle = isFlashing ? '#000000' : '#dd9966';
                    for (let i = 0; i < 3; i++) {
                        ctx.fillRect(this.x + this.width/2 - 5 - i, this.y - 1 + i, 1, 1);
                        ctx.fillRect(this.x + this.width/2 + 4 + i, this.y - 1 + i, 1, 1);
                    }
                    
                    // 强壮的六条腿
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#aa6644';
                    for (let i = 0; i < 3; i++) {
                        const legY = this.y + 5 + i * 4;
                        // 左腿 - 更粗壮
                        ctx.fillRect(this.x - 3, legY, 5, 2);
                        ctx.fillRect(this.x - 4, legY + 2, 3, 1);
                        // 右腿
                        ctx.fillRect(this.x + this.width - 2, legY, 5, 2);
                        ctx.fillRect(this.x + this.width + 1, legY + 2, 3, 1);
                    }
                    
                    // 甲壳边缘锯齿
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#654321';
                    for (let i = 0; i < 5; i++) {
                        ctx.fillRect(this.x + 2 + i * 6, this.y + 1, 1, 1);
                        ctx.fillRect(this.x + 2 + i * 6, this.y + this.height - 2, 1, 1);
                    }
                    break;
                    
                default:
                    // 普通敌机 - 工蚁风格
                    // 蚂蚁头部 - 较大
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#dd8844';
                    ctx.fillRect(this.x + this.width/2 - 4, this.y, 8, 7);
                    
                    // 胸部 - 中等大小
                    ctx.fillStyle = isFlashing ? '#000000' : '#cc7744';
                    ctx.fillRect(this.x + this.width/2 - 3, this.y + 6, 6, 6);
                    
                    // 腹部 - 最大
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#dd8844';
                    ctx.fillRect(this.x + this.width/2 - 5, this.y + 11, 10, this.height - 13);
                    
                    // 复眼
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#000000';
                    ctx.fillRect(this.x + this.width/2 - 3, this.y + 2, 1, 1);
                    ctx.fillRect(this.x + this.width/2 + 2, this.y + 2, 1, 1);
                    
                    // 弯曲触角 - 蚂蚁特征
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#aa7744';
                    ctx.fillRect(this.x + this.width/2 - 2, this.y - 1, 1, 3);
                    ctx.fillRect(this.x + this.width/2 - 3, this.y - 2, 2, 1);
                    ctx.fillRect(this.x + this.width/2 + 1, this.y - 1, 1, 3);
                    ctx.fillRect(this.x + this.width/2 + 1, this.y - 2, 2, 1);
                    
                    // 强壮的大颚
                    ctx.fillStyle = isFlashing ? '#000000' : '#aa6644';
                    ctx.fillRect(this.x + this.width/2 - 1, this.y + 5, 2, 2);
                    
                    // 六条腿 - 蚂蚁特有的强壮腿
                    ctx.fillStyle = isFlashing ? '#000000' : '#aa7744';
                    for (let i = 0; i < 3; i++) {
                        const legY = this.y + 7 + i * 3;
                        // 左腿 - 多节
                        ctx.fillRect(this.x + 1, legY, 3, 1);
                        ctx.fillRect(this.x - 1, legY + 1, 2, 1);
                        // 右腿
                        ctx.fillRect(this.x + this.width - 4, legY, 3, 1);
                        ctx.fillRect(this.x + this.width - 1, legY + 1, 2, 1);
                    }
                    
                    // 身体分节线 - 蚂蚁特征
                    ctx.fillStyle = isFlashing ? '#000000' : '#aa6644';
                    ctx.fillRect(this.x + this.width/2 - 4, this.y + 6, 8, 1); // 头胸分界
                    ctx.fillRect(this.x + this.width/2 - 3, this.y + 11, 6, 1); // 胸腹分界
                    
                    // 腹部条纹
                    ctx.fillStyle = isFlashing ? '#ffffff' : '#aa7744';
                    for (let i = 0; i < 2; i++) {
                        ctx.fillRect(this.x + this.width/2 - 4, this.y + 14 + i * 3, 8, 1);
                    }
                    break;
            }
            
            // 为多血量敌机绘制血量指示器
            if (this.maxHealth > 1) {
                const barWidth = this.width * 0.8;
                const barHeight = 3;
                const healthPercent = this.health / this.maxHealth;
                
                // 血量条背景
                ctx.fillStyle = '#333333';
                ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 8, barWidth, barHeight);
                
                // 血量条
                ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
                ctx.fillRect(this.x + (this.width - barWidth) / 2, this.y - 8, barWidth * healthPercent, barHeight);
            }
            
            // 行为状态指示器
            if (this.behaviorState === 'escaping') {
                // 逃跑状态显示警告标志
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.x + this.width - 8, this.y - 8, 6, 6);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + this.width - 6, this.y - 6, 2, 2);
            }
        }
    }
}