// 粒子类
class Particle {
    constructor(x, y, color, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = 30;
        this.maxLife = 30;
        this.size = Math.random() * 3 + 2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.3;
        this.type = type; // 'normal', 'petal', 'pollen', 'honey'
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.rotation += this.rotationSpeed;
        this.size *= 0.98;
        
        // 花瓣类型的粒子有飘落效果
        if (this.type === 'petal') {
            this.vy += 0.1; // 重力效果
            this.vx += Math.sin(this.life * 0.1) * 0.1; // 飘摆效果
        }
    }

    draw() {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        switch(this.type) {
            case 'petal':
                // 花瓣形状
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 2, this.size, 0, 0, Math.PI * 2);
                ctx.fill();
                // 花瓣纹理
                ctx.strokeStyle = '#ff1493';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(0, this.size);
                ctx.stroke();
                break;
                
            case 'pollen':
                // 花粉颗粒
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size, this.size, 0, 0, Math.PI * 2);
                ctx.fill();
                // 花粉光晕
                ctx.fillStyle = '#ffff80';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 0.5, this.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'honey':
                // 蜂蜜液滴
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(0, -this.size * 0.3, this.size * 0.8, this.size * 1.2, 0, 0, Math.PI * 2);
                ctx.fill();
                // 高光
                ctx.fillStyle = '#ffff80';
                ctx.beginPath();
                ctx.ellipse(-this.size * 0.3, -this.size * 0.6, this.size * 0.3, this.size * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            default:
                // 默认星形粒子
                ctx.fillStyle = this.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5;
                    const x = Math.cos(angle) * this.size;
                    const y = Math.sin(angle) * this.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}