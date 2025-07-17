// 游戏状态
const gameState = {
    score: 0,
    lives: 3,
    gameOver: false,
    level: 1,
    enemiesKilled: 0,
    enemiesPerLevel: 10,
    keys: {},
    activePowerUps: [],
    totalEnemiesKilled: 0,
    bossSpawnCount: 20,
    invulnerable: false,
    invulnerableTime: 0,
    bulletLevel: 1,
    // 保护光圈系统
    protectionShields: 3, // 最多存储3个
    protectionCooldown: 0, // CD计时器
    protectionCooldownMax: 600, // 10秒 = 600帧 (60fps)
    // 自动射击系统
    autoShoot: false // 自动射击开关
};

// 游戏对象数组
let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let powerUps = [];
let protectionRings = []; // 保护光圈数组

// 玩家对象
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 30,
    speed: 5
};

// 射击计时器
let shootTimer = 0;
const normalShootInterval = 15;
const rapidShootInterval = 8;

// 跟踪导弹计时器
let trackingMissileTimer = 0;
let trackingMissileInterval = 30; // 0.75秒间隔（增加2倍频率）

// 根据子弹等级和道具效果计算射击间隔
function getShootInterval() {
    const hasRapidFire = gameState.activePowerUps.some(p => p.type === 'rapidFire');
    const baseInterval = hasRapidFire ? rapidShootInterval : normalShootInterval;
    
    // 子弹等级越高，射击间隔越短
    const levelBonus = gameState.bulletLevel * 2;
    return Math.max(baseInterval - levelBonus, 5); // 最小间隔为5帧
}

// 初始化音频
function initAudio() {
    if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume();
    }
}

// 键盘事件处理
document.addEventListener('keydown', (e) => {
    // 首次按键时启动音频
    initAudio();
    
    gameState.keys[e.key.toLowerCase()] = true;
    
    // 游戏结束时按任意键重启
    if (gameState.gameOver) {
        restartGame();
        return;
    }
    
    // 音效开关
    if (e.key.toLowerCase() === 'm') {
        audioManager.toggleMute();
    }
    
    // K键触发保护光圈
    if (e.key.toLowerCase() === 'k') {
        activateProtectionRing();
    }
    
    // J键切换自动射击
    if (e.key.toLowerCase() === 'j') {
        gameState.autoShoot = !gameState.autoShoot;
        // 播放切换音效
        audioManager.play('powerUp');
    }
    
    // 测试功能（数字键）
    if (e.key >= '1' && e.key <= '6') {
        const num = parseInt(e.key);
        switch(num) {
            case 1:
                gameState.bulletLevel = 1;
                updatePowerUpDisplay();
                break;
            case 2:
                gameState.bulletLevel = 2;
                updatePowerUpDisplay();
                break;
            case 3:
                gameState.bulletLevel = 3;
                updatePowerUpDisplay();
                break;
            case 4:
                gameState.lives = Math.min(gameState.lives + 1, 5);
                break;
            case 5:
                // 新增Boss
                const bossX = Math.random() * (canvas.width - 80);
                enemies.push(new Enemy(bossX, -60, 'boss', null));
                break;
            case 6:
                // 清空敌人
                enemies = [];
                break;
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key.toLowerCase()] = false;
});

// 玩家射击
function shoot() {
    // 播放射击音效
    audioManager.play('playerShoot');
    
    // 根据子弹等级和道具效果决定子弹属性
    const hasRapidFire = gameState.activePowerUps.some(p => p.type === 'rapidFire');
    const bulletLevel = gameState.bulletLevel || 0;
    
    let bulletSpeed = 8 + (bulletLevel * 2); // 基础速度8，每级增加2
    let bulletColor = '#ffff00';
    let bulletType = 'player';
    
    // 快速射击道具效果
    if (hasRapidFire) {
        bulletSpeed += 3;
        bulletColor = '#ffff00';
        bulletType = 'powerShot';
    }
    
    // 子弹等级效果 - 保持针状子弹外观，只改变颜色
    if (bulletLevel >= 1) {
        bulletColor = '#ff00ff'; // 紫色针
        bulletType = 'player'; // 保持针状外观
    }
    if (bulletLevel >= 2) {
        bulletColor = '#ff6600'; // 橙色针
    }
    if (bulletLevel >= 3) {
        bulletColor = '#ff0000'; // 红色针
    }
    
    // 基础散射（所有等级都有）
    bullets.push(new Bullet(
        player.x + player.width / 2,
        player.y,
        -bulletSpeed,
        bulletColor,
        bulletType
    ));
    
    // 子弹升级后的多弹道
    if (bulletLevel >= 1) {
        // 左右两侧子弹
        bullets.push(new Bullet(
            player.x + player.width * 0.25,
            player.y + 5,
            bulletSpeed * 0.9,
            bulletColor,
            bulletType,
            -0.2
        ));
        bullets.push(new Bullet(
            player.x + player.width * 0.75,
            player.y + 5,
            bulletSpeed * 0.9,
            bulletColor,
            bulletType,
            0.2
        ));
    }
    
    if (bulletLevel >= 2) {
        // 更多斜向子弹
        bullets.push(new Bullet(
            player.x + player.width * 0.15,
            player.y + 7,
            bulletSpeed * 0.7,
            bulletColor,
            bulletType,
            -0.4
        ));
        bullets.push(new Bullet(
            player.x + player.width * 0.85,
            player.y + 7,
            bulletSpeed * 0.7,
            bulletColor,
            bulletType,
            0.4
        ));
        // 添加额外的中间角度子弹
        bullets.push(new Bullet(
            player.x + player.width * 0.35,
            player.y + 7,
            bulletSpeed * 0.85,
            bulletColor,
            bulletType,
            -0.1
        ));
        bullets.push(new Bullet(
            player.x + player.width * 0.65,
            player.y + 7,
            bulletSpeed * 0.85,
            bulletColor,
            bulletType,
            0.1
        ));
    }
    
    // 如果有快速射击，发射更强大的扇形弹幕
    if (hasRapidFire) {
        // 使用powerShot的配置颜色，如果没有配置则使用默认颜色
        const powerShotColor = '#00ff88'; // powerShot的默认颜色
        
        // 中间角度的强化子弹
        bullets.push(new Bullet(
            player.x + player.width / 2 - 5,
            player.y + 3,
            bulletSpeed * 0.95,
            powerShotColor,
            'powerShot',
            -0.15
        ));
        bullets.push(new Bullet(
            player.x + player.width / 2 + 5,
            player.y + 3,
            bulletSpeed * 0.95,
            powerShotColor,
            'powerShot',
            0.15
        ));
        
        // 外侧角度的强化子弹
        bullets.push(new Bullet(
            player.x + player.width / 4,
            player.y + 5,
            bulletSpeed * 0.9,
            powerShotColor,
            'powerShot',
            -0.3
        ));
        bullets.push(new Bullet(
            player.x + player.width * 3/4,
            player.y + 5,
            bulletSpeed * 0.9,
            powerShotColor,
            'powerShot',
            0.3
        ));
    }
}

// 玩家发射跟踪导弹
function shootTracking() {
    // 播放跟踪导弹专用音效
    audioManager.play('playerShootTracking');
    
    const bulletLevel = gameState.bulletLevel || 0;
    const playerCenterX = player.x + player.width / 2;
    const playerY = player.y;
    
    // 立即发射第一枚导弹
    bullets.push(new Bullet(
        playerCenterX,
        playerY,
        -12,
        '#ff4400',
        'tracking',
        0
    ));
    
    // 根据子弹等级延迟发射额外导弹，最多6枚
    if (bulletLevel >= 1) {
        // 2级：延迟发射第二枚导弹
        setTimeout(() => {
            bullets.push(new Bullet(
                playerCenterX - 15,
                playerY + 5,
                -12,
                '#ff4400',
                'tracking',
                -0.1
            ));
        }, 100); // 100ms延迟
        
        if (bulletLevel >= 1) {
            // 3级：延迟发射第三枚导弹
            setTimeout(() => {
                bullets.push(new Bullet(
                    playerCenterX + 15,
                    playerY + 5,
                    -12,
                    '#ff4400',
                    'tracking',
                    0.1
                ));
            }, 200); // 200ms延迟
        }
        
        if (bulletLevel >= 1) {
            // 4级：延迟发射第四枚导弹
            setTimeout(() => {
                bullets.push(new Bullet(
                    playerCenterX - 25,
                    playerY + 10,
                    -12,
                    '#ff4400',
                    'tracking',
                    -0.15
                ));
            }, 300); // 300ms延迟
        }
        
        if (bulletLevel >= 1) {
            // 5级：延迟发射第五枚导弹
            setTimeout(() => {
                bullets.push(new Bullet(
                    playerCenterX + 25,
                    playerY + 10,
                    -12,
                    '#ff4400',
                    'tracking',
                    0.15
                ));
            }, 400); // 400ms延迟
        }
        
        if (bulletLevel >= 1) {
            // 6级：延迟发射第六枚导弹
            setTimeout(() => {
                bullets.push(new Bullet(
                    playerCenterX,
                    playerY + 15,
                    -12,
                    '#ff4400',
                    'tracking',
                    0
                ));
            }, 500); // 500ms延迟
        }
    }
}

// 保护光圈类
class ProtectionRing {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10; // 初始半径
        this.maxRadius = 400; // 最大半径，能覆盖全屏幕
        this.expandSpeed = 8; // 扩散速度提升一倍
        this.damage = 50; // 攻击力，对Boss造成1/3伤害，对普通敌人仍然是秒杀
        this.active = true;
    }
    
    update() {
        if (!this.active) return;
        
        // 光圈扩散
        this.radius += this.expandSpeed;
        
        // 当光圈完全超出屏幕范围时消失
        const screenDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
        const maxDistanceFromCenter = Math.max(
            Math.sqrt(this.x * this.x + this.y * this.y),
            Math.sqrt((canvas.width - this.x) * (canvas.width - this.x) + this.y * this.y),
            Math.sqrt(this.x * this.x + (canvas.height - this.y) * (canvas.height - this.y)),
            Math.sqrt((canvas.width - this.x) * (canvas.width - this.x) + (canvas.height - this.y) * (canvas.height - this.y))
        );
        
        if (this.radius > maxDistanceFromCenter + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 绘制光圈
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius - 10, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        gradient.addColorStop(0.8, 'rgba(0, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.9)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内圈光效
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 检测与子弹的碰撞
    checkBulletCollision(bullet) {
        if (!this.active) return false;
        
        const dx = bullet.x + bullet.width/2 - this.x;
        const dy = bullet.y + bullet.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检测子弹是否在光圈范围内
        return distance <= this.radius && distance >= this.radius - 15;
    }
    
    // 检测与敌人的碰撞
    checkEnemyCollision(enemy) {
        if (!this.active) return false;
        
        const dx = enemy.x + enemy.width/2 - this.x;
        const dy = enemy.y + enemy.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 检测敌人是否在光圈范围内
        return distance <= this.radius && distance >= this.radius - 15;
    }
}

// 激活保护光圈
function activateProtectionRing() {
    // 检查是否有可用的保护光圈
    if (gameState.protectionShields <= 0) {
        return; // 没有可用的保护光圈
    }
    
    // 消耗一个保护光圈
    gameState.protectionShields--;
    
    // 创建保护光圈
    protectionRings.push(new ProtectionRing(
        player.x + player.width / 2,
        player.y + player.height / 2
    ));
    
    // 播放保护光圈音效
    audioManager.play('protectionRing');
}

// 生成敌机
function spawnEnemy() {
    const x = Math.random() * (canvas.width - 40);
    let type = 'normal';
    const rand = Math.random();
    
    // 根据关卡调整敌机类型概率
    const levelFactor = Math.min(gameState.level / 10, 1); // 关卡影响因子
    
    // 移除随机生成Boss的逻辑，Boss只能通过击杀20个敌机后强制生成
    if (rand < 0.15) {
        type = 'fast';
    } else if (rand < 0.25) {
        type = 'heavy';
    } else if (rand < 0.35 + levelFactor * 0.1) {
        type = 'armored'; // 装甲敌机，高关卡更常见
    } else if (rand < 0.45) {
        type = 'scout'; // 侦察机
    }
    
    enemies.push(new Enemy(x, -50, type, null));
}

// 生成道具
function spawnPowerUp(x, y) {
    if (Math.random() < 0.3) { // 30%概率掉落道具
        powerUps.push(new PowerUp(x, y, null, null));
    }
}

// 激活道具效果
function activatePowerUp(type) {
    switch(type) {
        case 'health':
            gameState.lives = Math.min(gameState.lives + 1, 5);
            break;
        case 'rapidFire':
        case 'shield':
            // 检查是否已经有相同类型的道具激活
            const existingPowerUp = gameState.activePowerUps.find(p => p.type === type);
            if (existingPowerUp) {
                // 如果已存在，重置计时器
                existingPowerUp.timer = 300;
            } else {
                // 如果不存在，添加新的道具效果
                gameState.activePowerUps.push({
                    type: type,
                    timer: 300 // 5秒效果
                });
            }
            break;
        case 'bulletUpgrade':
            // 子弹升级是永久性的，每次拾取增加一级
            gameState.bulletLevel = Math.min((gameState.bulletLevel || 0) + 1, 5);
            break;
    }
    updatePowerUpDisplay();
}

// 更新道具状态显示
function updatePowerUpDisplay() {
    let displayTexts = [];
    
    // 显示临时道具效果
    if (gameState.activePowerUps.length > 0) {
        gameState.activePowerUps.forEach(powerUp => {
            const timeLeft = Math.ceil(powerUp.timer / 60);
            let displayText = '';
            switch(powerUp.type) {
                case 'rapidFire': displayText = `快速射击: ${timeLeft}s`; break;
                case 'shield': displayText = `护盾: ${timeLeft}s`; break;
            }
            displayTexts.push(displayText);
        });
    }
    
    // 显示子弹升级等级和速度
    if (gameState.bulletLevel && gameState.bulletLevel > 0) {
        const bulletSpeed = 8 + (gameState.bulletLevel * 2);
        displayTexts.push(`子弹等级: ${gameState.bulletLevel} (速度: ${bulletSpeed})`);
    }
    
    powerUpStatusElement.textContent = displayTexts.join(' | ');
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 创建爆炸效果
function createExplosion(x, y, type = 'normal') {
    let particleCount = 15;
    let colors = ['#ff6600', '#ffaa00', '#ff0000'];
    let particleType = 'normal';
    
    switch(type) {
        case 'bullet':
            particleCount = 8;
            colors = ['#00ffff', '#ffffff', '#0088ff'];
            particleType = 'normal';
            break;
        case 'boss':
            // Boss蜘蛛女王 - 毒液和蛛网效果
            particleCount = 30;
            colors = ['#8b0000', '#ff0000', '#800080', '#000000'];
            particleType = 'honey'; // 使用蜂蜜效果模拟毒液
            break;
        case 'powerShot':
            particleCount = 12;
            colors = ['#ffff00', '#ffaa00', '#ffffff'];
            particleType = 'pollen';
            break;
        case 'armored':
            // 装甲甲虫 - 甲壳碎片
            particleCount = 20;
            colors = ['#654321', '#8b4513', '#a0522d'];
            particleType = 'normal';
            break;
        case 'scout':
            // 侦察蜻蜓 - 翅膀碎片
            particleCount = 18;
            colors = ['#00ced1', '#40e0d0', '#48d1cc'];
            particleType = 'petal'; // 使用花瓣效果模拟翅膀
            break;
        case 'fast':
            // 快速黄蜂 - 花粉爆炸
            particleCount = 16;
            colors = ['#ffd700', '#ffff00', '#ffa500'];
            particleType = 'pollen';
            break;
        case 'heavy':
            // 重型独角仙 - 土壤和甲壳
            particleCount = 22;
            colors = ['#8b4513', '#a0522d', '#d2691e'];
            particleType = 'normal';
            break;
        case 'normal':
            // 普通蚂蚁 - 花瓣飞散
            particleCount = 12;
            colors = ['#ff69b4', '#ff1493', '#ffc0cb'];
            particleType = 'petal';
            break;
        case 'tracking':
            // 跟踪导弹 - 火焰爆炸
            particleCount = 20;
            colors = ['#ff4400', '#ff6600', '#ffaa00', '#ff0000'];
            particleType = 'normal';
            break;
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], particleType));
    }
}

// 更新游戏逻辑
function update() {
    if (gameState.gameOver) return;

    // 处理无敌时间
    if (gameState.invulnerable && gameState.invulnerableTime > 0) {
        gameState.invulnerableTime--;
        if (gameState.invulnerableTime <= 0) {
            gameState.invulnerable = false;
        }
    }
    
    // 更新保护光圈CD
    if (gameState.protectionCooldown > 0) {
        gameState.protectionCooldown--;
    } else if (gameState.protectionShields < 3) {
        // CD结束，恢复一个保护光圈
        gameState.protectionShields++;
        gameState.protectionCooldown = gameState.protectionCooldownMax;
    }

    // 玩家移动
    if (gameState.keys['a'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (gameState.keys['d'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (gameState.keys['w'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (gameState.keys['s'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    
    // 处理射击
    shootTimer++;
    const currentShootInterval = getShootInterval();
    
    // 自动射击或手动射击
    if ((gameState.autoShoot || gameState.keys['j']) && shootTimer >= currentShootInterval) {
        shoot();
        shootTimer = 0;
    }
    
    // 自动发射跟踪导弹（当有敌机时）
    trackingMissileTimer++;
    if (trackingMissileTimer >= trackingMissileInterval && enemies.length > 0) {
        shootTracking();
        trackingMissileTimer = 0;
    }

    // 更新道具效果计时器
    const previousPowerUpCount = gameState.activePowerUps.length;
    gameState.activePowerUps = gameState.activePowerUps.filter(powerUp => {
        powerUp.timer--;
        return powerUp.timer > 0;
    });
    
    // 如果道具状态发生变化，更新显示
    if (gameState.activePowerUps.length !== previousPowerUpCount) {
        updatePowerUpDisplay();
    }

    // 更新子弹
    bullets = bullets.filter(bullet => {
        bullet.update();
        return bullet.y > -bullet.height;
    });

    enemyBullets = enemyBullets.filter(bullet => {
        bullet.update();
        return bullet.y < canvas.height;
    });

    // 更新敌机
    enemies = enemies.filter(enemy => {
        enemy.update();
        
        // 根据敌机行为状态决定移除条件
        // Boss永远不会被移除（除非被击败）
        if (enemy.type === 'boss') {
            return true; // Boss始终保留在游戏中
        }
        
        switch(enemy.behaviorState) {
            case 'retreating':
            case 'escaping':
                // 撤退和逃跑的敌机从屏幕顶部消失
                return enemy.y > -enemy.height;
            case 'passing':
                // 穿越型敌机从屏幕底部消失
                return enemy.y < canvas.height + 50;
            default:
                // 其他敌机正常从屏幕底部消失
                return enemy.y < canvas.height + 50;
        }
    });

    // 更新道具
    powerUps = powerUps.filter(powerUp => {
        powerUp.update();
        return !powerUp.shouldRemove();
    });

    // 更新粒子
    particles = particles.filter(particle => {
        particle.update();
        return particle.life > 0;
    });

    // 子弹与敌机碰撞
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                // 播放击中音效
                audioManager.play('hit');
                
                // 创建子弹击中效果
                let explosionType = 'bullet';
                if (bullet.type === 'powerShot') {
                    explosionType = 'powerShot';
                } else if (bullet.type === 'tracking') {
                    explosionType = 'tracking';
                }
                createExplosion(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, explosionType);
                
                bullets.splice(bulletIndex, 1);
                
                // 根据子弹类型设置伤害值
                const damage = bullet.type === 'tracking' ? 2 : 1;
                enemy.takeDamage(damage);
                
                if (enemy.health <= 0) {
                    // 播放爆炸音效
                    if (enemy.type === 'boss') {
                        audioManager.play('bossExplosion');
                    } else {
                        audioManager.play('explosion');
                    }
                    
                    // 根据敌机类型创建不同的爆炸效果
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type);
                    
                    // 计算得分
                    let points = 10;
                    switch(enemy.type) {
                        case 'boss': points = 100; break;
                        case 'heavy': points = 30; break;
                        case 'fast': points = 20; break;
                    }
                    gameState.score += points;
                    gameState.enemiesKilled++;
                    gameState.totalEnemiesKilled++;
                    
                    // 生成道具
                    spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    enemies.splice(enemyIndex, 1);
                    
                    // 检查Boss生成条件
                    if (gameState.totalEnemiesKilled % gameState.bossSpawnCount === 0) {
                        // 强制生成Boss
                        const bossX = Math.random() * (canvas.width - 80);
                        enemies.push(new Enemy(bossX, -60, 'boss', null));
                    }
                    
                    // 检查关卡进度
                    if (gameState.enemiesKilled >= gameState.enemiesPerLevel) {
                        gameState.level++;
                        gameState.enemiesKilled = 0;
                        gameState.enemiesPerLevel += 5;
                    }
                }
            }
        });
    });
    
    // 玩家与道具碰撞
    powerUps.forEach((powerUp, powerUpIndex) => {
        if (checkCollision(player, powerUp)) {
            // 播放道具收集音效
            audioManager.play('powerUp');
            
            activatePowerUp(powerUp.type);
            powerUps.splice(powerUpIndex, 1);
        }
    });

    // 玩家子弹与敌机子弹碰撞（特殊敌机子弹可被打掉）
    bullets.forEach((playerBullet, playerBulletIndex) => {
        enemyBullets.forEach((enemyBullet, enemyBulletIndex) => {
            if (checkCollision(playerBullet, enemyBullet)) {
                // 根据子弹形状判断是否可以被抵消
                // 椭圆形子弹可以被抵消，圆形子弹无法被抵消
                const isEllipticalBullet = (
                    enemyBullet.type === 'boss_poison' ||
                    enemyBullet.type === 'boss_pierce' ||
                    enemyBullet.type === 'boss' ||
                    enemyBullet.type === 'enemy' ||
                    enemyBullet.type === 'normal' ||
                    enemyBullet.type === 'fast' ||
                    enemyBullet.type === 'scout' ||
                    enemyBullet.type === 'piercing' ||
                    enemyBullet.type === 'venom' ||
                    enemyBullet.type === 'spiral'
                );
                const canBeDestroyed = isEllipticalBullet;
                
                if (canBeDestroyed) {
                    // 播放子弹碰撞音效
                    audioManager.play('hit');
                    
                    // 移除两颗子弹（不产生爆炸效果）
                    bullets.splice(playerBulletIndex, 1);
                    enemyBullets.splice(enemyBulletIndex, 1);
                    
                    // 给予少量得分奖励
                    gameState.score += 5;
                }
            }
        });
    });

    // 敌机子弹与玩家碰撞
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (checkCollision(bullet, player) && !gameState.invulnerable) {
            enemyBullets.splice(bulletIndex, 1);
            
            // 护盾效果
            const hasShield = gameState.activePowerUps.some(p => p.type === 'shield');
            if (hasShield) {
                // 护盾抵挡伤害
                createExplosion(bullet.x, bullet.y);
            } else {
                gameState.lives--;
                createExplosion(player.x + player.width / 2, player.y + player.height / 2);
                
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                    gameOverElement.style.display = 'block';
                    finalScoreElement.textContent = gameState.score;
                } else {
                    // 玩家重生效果
                    respawnPlayer();
                }
            }
        }
    });

    // 敌机与玩家碰撞
    enemies.forEach((enemy, enemyIndex) => {
        if (checkCollision(enemy, player) && !gameState.invulnerable) {
            enemies.splice(enemyIndex, 1);
            
            // 护盾效果
            const hasShield = gameState.activePowerUps.some(p => p.type === 'shield');
            if (hasShield) {
                // 护盾抵挡伤害
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            } else {
                gameState.lives--;
                createExplosion(player.x + player.width / 2, player.y + player.height / 2);
                
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                    gameOverElement.style.display = 'block';
                    finalScoreElement.textContent = gameState.score;
                } else {
                    // 玩家重生效果
                    respawnPlayer();
                }
            }
        }
    });

    // 随机生成敌机（根据关卡调整生成频率）- 减少一半
    const spawnRate = (0.015 + (gameState.level - 1) * 0.005) * 1;
    if (Math.random() < spawnRate) {
        spawnEnemy();
    }

    // 更新保护光圈
    protectionRings.forEach((ring, ringIndex) => {
        ring.update();
        
        // 检测保护光圈与敌机子弹的碰撞
        enemyBullets.forEach((bullet, bulletIndex) => {
            if (ring.checkBulletCollision(bullet)) {
                // 子弹被光圈消除（不产生爆炸效果）
                enemyBullets.splice(bulletIndex, 1);
                audioManager.play('hit');
            }
        });
        
        // 检测保护光圈与敌人的碰撞
        enemies.forEach((enemy, enemyIndex) => {
            if (ring.checkEnemyCollision(enemy)) {
                // 敌人受到光圈伤害
                enemy.takeDamage(ring.damage);
                
                if (enemy.health <= 0) {
                    // 播放爆炸音效
                    if (enemy.type === 'boss') {
                        audioManager.play('bossExplosion');
                    } else {
                        audioManager.play('explosion');
                    }
                    
                    // 创建爆炸效果
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type);
                    
                    // 计算得分
                    let points = 10;
                    switch(enemy.type) {
                        case 'boss': points = 100; break;
                        case 'heavy': points = 30; break;
                        case 'fast': points = 20; break;
                    }
                    gameState.score += points;
                    gameState.enemiesKilled++;
                    gameState.totalEnemiesKilled++;
                    
                    // 生成道具
                    spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    enemies.splice(enemyIndex, 1);
                    
                    // 检查Boss生成条件
                    if (gameState.totalEnemiesKilled % gameState.bossSpawnCount === 0) {
                        const bossX = Math.random() * (canvas.width - 80);
                        enemies.push(new Enemy(bossX, -60, 'boss', null));
                    }
                    
                    // 检查关卡进度
                    if (gameState.enemiesKilled >= gameState.enemiesPerLevel) {
                        gameState.level++;
                        gameState.enemiesKilled = 0;
                        gameState.enemiesPerLevel += 5;
                    }
                }
            }
        });
        
        // 移除失效的光圈
        if (!ring.active) {
            protectionRings.splice(ringIndex, 1);
        }
    });

    // 更新UI
    scoreElement.textContent = gameState.score;
    livesElement.textContent = gameState.lives;
    levelElement.textContent = gameState.level;
    enemiesLeftElement.textContent = gameState.enemiesPerLevel - gameState.enemiesKilled;
    bossCountdownElement.textContent = gameState.bossSpawnCount - (gameState.totalEnemiesKilled % gameState.bossSpawnCount);
    updatePowerUpDisplay();
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制星空背景
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
        const x = (i * 37) % canvas.width;
        const y = (i * 73 + Date.now() * 0.1) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
    }

    // 绘制玩家 - 蜜蜂
    ctx.save();
    
    // 无敌状态闪烁效果
    if (gameState.invulnerable) {
        const flashRate = Math.floor(Date.now() / 100) % 2; // 每100ms闪烁一次
        if (flashRate === 0) {
            ctx.globalAlpha = 0.5; // 半透明效果
        }
    }
    
    // 蜜蜂身体（腹部）- 黄黑条纹
    ctx.fillStyle = '#ffdd00';
    ctx.fillRect(player.x + 18, player.y + 8, 14, 20);
    
    // 黑色条纹
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 18, player.y + 10, 14, 2);
    ctx.fillRect(player.x + 18, player.y + 15, 14, 2);
    ctx.fillRect(player.x + 18, player.y + 20, 14, 2);
    ctx.fillRect(player.x + 18, player.y + 25, 14, 2);
    
    // 蜜蜂头部
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(player.x + 20, player.y, 10, 10);
    
    // 蜜蜂眼睛
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 22, player.y + 2, 2, 2);
    ctx.fillRect(player.x + 26, player.y + 2, 2, 2);
    
    // 触角
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 23, player.y - 2, 1, 3);
    ctx.fillRect(player.x + 26, player.y - 2, 1, 3);
    ctx.fillRect(player.x + 22, player.y - 3, 2, 1);
    ctx.fillRect(player.x + 26, player.y - 3, 2, 1);
    
    // 翅膀（透明效果）
    const wingFlap = Math.sin(Date.now() * 0.02) * 2; // 翅膀振动效果
    ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
    // 左翅膀
    ctx.fillRect(player.x + 8 + wingFlap, player.y + 5, 12, 18);
    ctx.fillRect(player.x + 5 + wingFlap, player.y + 8, 8, 12);
    // 右翅膀
    ctx.fillRect(player.x + 30 - wingFlap, player.y + 5, 12, 18);
    ctx.fillRect(player.x + 37 - wingFlap, player.y + 8, 8, 12);
    
    // 翅膀纹理
    ctx.fillStyle = 'rgba(150, 150, 200, 0.4)';
    ctx.fillRect(player.x + 10 + wingFlap, player.y + 7, 8, 1);
    ctx.fillRect(player.x + 10 + wingFlap, player.y + 12, 8, 1);
    ctx.fillRect(player.x + 10 + wingFlap, player.y + 17, 8, 1);
    ctx.fillRect(player.x + 32 - wingFlap, player.y + 7, 8, 1);
    ctx.fillRect(player.x + 32 - wingFlap, player.y + 12, 8, 1);
    ctx.fillRect(player.x + 32 - wingFlap, player.y + 17, 8, 1);
    
    // 蜜蜂腿
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 16, player.y + 12, 1, 4);
    ctx.fillRect(player.x + 33, player.y + 12, 1, 4);
    ctx.fillRect(player.x + 16, player.y + 18, 1, 4);
    ctx.fillRect(player.x + 33, player.y + 18, 1, 4);
    ctx.fillRect(player.x + 16, player.y + 24, 1, 4);
    ctx.fillRect(player.x + 33, player.y + 24, 1, 4);
    
    // 移动时的尾迹效果（花粉）
    if (gameState.keys['w'] || gameState.keys['s'] || gameState.keys['a'] || gameState.keys['d']) {
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetY = Math.random() * 8;
            ctx.fillRect(player.x + 23 + offsetX, player.y + 30 + offsetY, 2, 2);
        }
    }
    
    ctx.restore();
    
    // 绘制护盾效果
    const hasShield = gameState.activePowerUps.some(p => p.type === 'shield');
    if (hasShield) {
        ctx.save();
        ctx.strokeStyle = '#0080ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/2 + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // 绘制子弹
    bullets.forEach(bullet => bullet.draw());
    enemyBullets.forEach(bullet => bullet.draw());

    // 绘制敌机
    enemies.forEach(enemy => enemy.draw());
    
    // 绘制道具
    powerUps.forEach(powerUp => powerUp.draw());

    // 绘制粒子效果
    particles.forEach(particle => particle.draw());
    
    // 绘制保护光圈
    protectionRings.forEach(ring => ring.draw(ctx));
    
    // 绘制保护光圈UI
    ctx.save();
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px Arial';
    ctx.fillText('保护光圈: ', 10, canvas.height - 60);
    
    // 绘制保护光圈数量指示器
    for (let i = 0; i < 3; i++) {
        const x = 120 + i * 25;
        const y = canvas.height - 70;
        
        if (i < gameState.protectionShields) {
            // 可用的保护光圈
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // 冷却中的保护光圈
            ctx.strokeStyle = '#666666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.stroke();
            
            // 显示冷却进度
            if (gameState.protectionCooldown > 0) {
                const progress = 1 - (gameState.protectionCooldown / gameState.protectionCooldownMax);
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(x, y, 6, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress);
                ctx.lineTo(x, y);
                ctx.fill();
            }
        }
    }
    
    // 显示CD时间
    if (gameState.protectionCooldown > 0 && gameState.protectionShields < 3) {
        const cdSeconds = Math.ceil(gameState.protectionCooldown / 60);
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px Arial';
        ctx.fillText(`CD: ${cdSeconds}s`, 220, canvas.height - 60);
    }
    
    // 显示自动射击状态
    ctx.fillStyle = gameState.autoShoot ? '#00ff00' : '#ff6666';
    ctx.font = '16px Arial';
    ctx.fillText('自动射击: ', 10, canvas.height - 30);
    ctx.fillStyle = gameState.autoShoot ? '#00ff00' : '#ff6666';
    ctx.fillText(gameState.autoShoot ? '开启' : '关闭', 110, canvas.height - 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('(按J键切换)', 160, canvas.height - 30);
    
    ctx.restore();
}

// 玩家重生函数
function respawnPlayer() {
    // 重置子弹等级为1级
    gameState.bulletLevel = 1;
    
    // 玩家消失效果 - 设置为屏幕外
    player.y = canvas.height + 50;
    player.x = canvas.width / 2 - 25;
    
    // 创建重生粒子效果
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: player.x + player.width / 2,
            y: canvas.height - 20,
            vx: (Math.random() - 0.5) * 8,
            vy: Math.random() * -5 - 2,
            life: 60,
            maxLife: 60,
            color: '#00ff00',
            size: Math.random() * 4 + 2,
            draw() {
                ctx.save();
                ctx.globalAlpha = this.life / this.maxLife;
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
                ctx.restore();
            },
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life--;
                return this.life > 0;
            }
        });
    }
    
    // 设置重生动画
    let respawnTimer = 0;
    const respawnDuration = 60; // 1秒重生时间
    
    function respawnAnimation() {
        respawnTimer++;
        
        // 玩家从底部向上移动
        const progress = respawnTimer / respawnDuration;
        const targetY = canvas.height - 80;
        player.y = canvas.height + 50 - (canvas.height + 50 - targetY) * Math.min(progress, 1);
        
        // 重生完成
        if (respawnTimer >= respawnDuration) {
            player.y = targetY;
            // 给予短暂无敌时间
            gameState.invulnerable = true;
            gameState.invulnerableTime = 120; // 2秒无敌时间
            return;
        }
        
        requestAnimationFrame(respawnAnimation);
    }
    
    respawnAnimation();
}

// 重新开始游戏
function restartGame() {
    gameState.score = 0;
    gameState.lives = 3;
    gameState.gameOver = false;
    gameState.level = 1;
    gameState.enemiesKilled = 0;
    gameState.enemiesPerLevel = 10;
    gameState.activePowerUps = []; // 清空所有激活的道具
    gameState.totalEnemiesKilled = 0;
    gameState.bossSpawnCount = 20;
    gameState.invulnerable = false; // 重置无敌状态
    gameState.protectionShields = 3; // 重置保护光圈数量
    gameState.protectionCooldown = 0; // 重置保护光圈CD
    gameState.invulnerableTime = 0; // 重置无敌时间
    gameState.bulletLevel = 1; // 重置子弹等级为1级
    gameState.autoShoot = false; // 重置自动射击状态
    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    powerUps = [];
    protectionRings = []; // 清空保护光圈
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 80;
    gameOverElement.style.display = 'none';
    updatePowerUpDisplay();
}

// 游戏主循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 开始游戏
gameLoop();