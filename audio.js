// 音效系统
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicVolume = 0.6;
        this.sfxVolume = 0.5;
        this.enabled = true;
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    createSounds() {
        // 创建各种音效
        this.sounds.playerShoot = this.createTone(600, 0.08, 'triangle', null, 0.2); // 更低音调，更短持续时间，更小音量
        this.sounds.playerShootUpgraded = this.createTone(650, 0.09, 'triangle', [650, 750], 0.25);
        this.sounds.playerShootPower = this.createTone(700, 0.1, 'triangle', [700, 800, 900], 0.3);
        this.sounds.playerShootTracking = this.createTone(550, 0.12, 'sine', [550, 650, 750, 600], 0.25);
        this.sounds.protectionRing = this.createTone(1000, 0.3, 'sine', [1000, 1400, 1800, 1200]);
        this.sounds.enemyShoot = this.createTone(400, 0.15, 'sawtooth');
        this.sounds.explosion = this.createNoise(0.3);
        this.sounds.powerUp = this.createTone(1200, 0.2, 'sine', [1200, 1600, 2000]);
        this.sounds.hit = this.createTone(600, 0.1, 'triangle');
        this.sounds.bossExplosion = this.createNoise(0.5, true);
        
        // 创建背景音乐
        this.createBackgroundMusic();
    }
    
    createBackgroundMusic() {
        this.backgroundMusic = {
            isPlaying: false,
            oscillators: [],
            gainNode: null
        };
        
        this.startBackgroundMusic();
    }
    
    startBackgroundMusic() {
        if (!this.enabled || !this.audioContext || this.backgroundMusic.isPlaying) return;
        
        this.backgroundMusic.gainNode = this.audioContext.createGain();
        this.backgroundMusic.gainNode.connect(this.audioContext.destination);
        this.backgroundMusic.gainNode.gain.setValueAtTime(this.musicVolume * 0.3, this.audioContext.currentTime);
        
        // 创建简单的背景音乐旋律
        const melody = [440, 523, 659, 523, 440, 392, 440, 523]; // A, C, E, C, A, G, A, C
        const rhythm = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        
        let currentTime = this.audioContext.currentTime;
        
        const playMelody = () => {
            if (!this.enabled || !this.backgroundMusic.isPlaying) return;
            
            melody.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const noteGain = this.audioContext.createGain();
                
                oscillator.connect(noteGain);
                noteGain.connect(this.backgroundMusic.gainNode);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, currentTime);
                
                noteGain.gain.setValueAtTime(0, currentTime);
                noteGain.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
                noteGain.gain.exponentialRampToValueAtTime(0.01, currentTime + rhythm[index]);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + rhythm[index]);
                
                currentTime += rhythm[index];
            });
            
            // 循环播放
            setTimeout(playMelody, melody.length * 500);
        };
        
        this.backgroundMusic.isPlaying = true;
        playMelody();
    }
    
    stopBackgroundMusic() {
        this.backgroundMusic.isPlaying = false;
        if (this.backgroundMusic.gainNode) {
            this.backgroundMusic.gainNode.disconnect();
        }
    }
    
    createTone(frequency, duration, waveType = 'sine', frequencies = null, volumeMultiplier = 1) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = waveType;
            
            if (frequencies) {
                // 创建音调变化效果
                oscillator.frequency.setValueAtTime(frequencies[0], this.audioContext.currentTime);
                frequencies.forEach((freq, index) => {
                    oscillator.frequency.linearRampToValueAtTime(
                        freq, 
                        this.audioContext.currentTime + (duration / frequencies.length) * (index + 1)
                    );
                });
            } else {
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            }
            
            gainNode.gain.setValueAtTime(this.sfxVolume * volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    createNoise(duration, complex = false) {
        return () => {
            if (!this.enabled || !this.audioContext) return;
            
            const bufferSize = this.audioContext.sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                if (complex) {
                    // 复杂爆炸音效
                    output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
                } else {
                    // 简单爆炸音效
                    output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
                }
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
            
            source.start(this.audioContext.currentTime);
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        
        if (this.enabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        
        return this.enabled;
    }
}

// 初始化音效管理器
const audioManager = new AudioManager();