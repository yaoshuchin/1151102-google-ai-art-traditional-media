// ==========================================================================
// 糖果敲磚大冒險 (Candy Breakout Game) - Canvas Interactive Engine
// Developed via Vibe Coding paradigm for Slide 33 Interactive Showcase
// ==========================================================================

class CandyBreakoutGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Logical resolution
        this.width = 680;
        this.height = 420;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Audio Context for sound synthesis
        this.audioCtx = null;

        // Game states
        this.isRunning = false;
        this.isGameOver = false;
        this.isWin = false;
        this.score = 0;
        this.lives = 3;
        this.particles = [];

        // Paddle
        this.paddleWidth = 110;
        this.paddleHeight = 16;
        this.paddleX = (this.width - this.paddleWidth) / 2;
        this.paddleSpeed = 8;
        this.rightPressed = false;
        this.leftPressed = false;

        // Ball
        this.ballRadius = 9;
        this.resetBall();

        // Bricks
        this.brickRowCount = 5;
        this.brickColumnCount = 8;
        this.brickWidth = 72;
        this.brickHeight = 22;
        this.brickPadding = 8;
        this.brickOffsetTop = 40;
        this.brickOffsetLeft = 24;

        this.candyColors = [
            '#f43f5e', // Strawberry Rose
            '#fb923c', // Sweet Orange
            '#facc15', // Lemon Yellow
            '#4ade80', // Mint Green
            '#a855f7'  // Grape Purple
        ];

        this.initBricks();
        this.bindEvents();
        this.renderInitialScreen();
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
    }

    playSound(freq, type = 'sine', duration = 0.1) {
        if (!this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            // Audio error ignore
        }
    }

    initBricks() {
        this.bricks = [];
        for (let c = 0; c < this.brickColumnCount; c++) {
            this.bricks[c] = [];
            for (let r = 0; r < this.brickRowCount; r++) {
                this.bricks[c][r] = {
                    x: 0,
                    y: 0,
                    status: 1,
                    color: this.candyColors[r % this.candyColors.length]
                };
            }
        }
    }

    resetBall() {
        this.ballX = this.width / 2;
        this.ballY = this.height - 45;
        this.ballDx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.ballDy = -4;
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowRight' || e.key === 'Right') this.rightPressed = true;
            if (e.code === 'ArrowLeft' || e.key === 'Left') this.leftPressed = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowRight' || e.key === 'Right') this.rightPressed = false;
            if (e.code === 'ArrowLeft' || e.key === 'Left') this.leftPressed = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const relativeX = (e.clientX - rect.left) * scaleX;
            if (relativeX > 0 && relativeX < this.width) {
                this.paddleX = Math.max(0, Math.min(this.width - this.paddleWidth, relativeX - this.paddleWidth / 2));
            }
        });

        const startBtn = document.getElementById('btnStartGame');
        const resetBtn = document.getElementById('btnResetGame');
        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    }

    start() {
        this.initAudio();
        if (this.isGameOver || this.isWin) {
            this.reset();
        }
        if (!this.isRunning) {
            this.isRunning = true;
            this.gameLoop();
        }
    }

    reset() {
        this.isRunning = false;
        this.isGameOver = false;
        this.isWin = false;
        this.score = 0;
        this.lives = 3;
        this.particles = [];
        this.paddleX = (this.width - this.paddleWidth) / 2;
        this.resetBall();
        this.initBricks();
        this.updateStatsDisplay();
        this.renderInitialScreen();
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: x,
                y: y,
                dx: (Math.random() - 0.5) * 6,
                dy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 3 + 2,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    updateStatsDisplay() {
        const scoreEl = document.getElementById('gameScore');
        const livesEl = document.getElementById('gameLives');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = '❤️'.repeat(this.lives);
    }

    gameLoop() {
        if (!this.isRunning) return;

        this.update();
        this.render();

        if (this.isRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        // Move paddle
        if (this.rightPressed && this.paddleX < this.width - this.paddleWidth) {
            this.paddleX += this.paddleSpeed;
        } else if (this.leftPressed && this.paddleX > 0) {
            this.paddleX -= this.paddleSpeed;
        }

        // Move ball
        this.ballX += this.ballDx;
        this.ballY += this.ballDy;

        // Wall collision (left & right)
        if (this.ballX + this.ballRadius > this.width || this.ballX - this.ballRadius < 0) {
            this.ballDx = -this.ballDx;
            this.playSound(400, 'sine', 0.05);
        }

        // Wall collision (top)
        if (this.ballY - this.ballRadius < 0) {
            this.ballDy = -this.ballDy;
            this.playSound(450, 'sine', 0.05);
        } else if (this.ballY + this.ballRadius > this.height - 25) {
            // Paddle collision
            if (this.ballX > this.paddleX && this.ballX < this.paddleX + this.paddleWidth) {
                // Bounce with angle based on where hit on paddle
                const hitOffset = (this.ballX - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                this.ballDx = hitOffset * 5.5;
                this.ballDy = -Math.abs(this.ballDy);
                this.playSound(550, 'triangle', 0.08);
            } else if (this.ballY + this.ballRadius > this.height) {
                // Ball lost
                this.lives--;
                this.playSound(180, 'sawtooth', 0.25);
                this.updateStatsDisplay();
                if (this.lives <= 0) {
                    this.isGameOver = true;
                    this.isRunning = false;
                } else {
                    this.resetBall();
                }
            }
        }

        // Brick collision
        let remainingBricks = 0;
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                const b = this.bricks[c][r];
                if (b.status === 1) {
                    remainingBricks++;
                    if (
                        this.ballX > b.x &&
                        this.ballX < b.x + this.brickWidth &&
                        this.ballY > b.y &&
                        this.ballY < b.y + this.brickHeight
                    ) {
                        this.ballDy = -this.ballDy;
                        b.status = 0;
                        this.score += 20;
                        this.createExplosion(b.x + this.brickWidth / 2, b.y + this.brickHeight / 2, b.color);
                        this.playSound(600 + r * 60, 'sine', 0.08);
                        this.updateStatsDisplay();
                    }
                }
            }
        }

        if (remainingBricks === 0) {
            this.isWin = true;
            this.isRunning = false;
            this.playSound(880, 'triangle', 0.4);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Bricks
        for (let c = 0; c < this.brickColumnCount; c++) {
            for (let r = 0; r < this.brickRowCount; r++) {
                if (this.bricks[c][r].status === 1) {
                    const brickX = c * (this.brickWidth + this.brickPadding) + this.brickOffsetLeft;
                    const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;
                    this.bricks[c][r].x = brickX;
                    this.bricks[c][r].y = brickY;

                    this.drawCandyBrick(brickX, brickY, this.brickWidth, this.brickHeight, this.bricks[c][r].color);
                }
            }
        }

        // Draw Paddle (Jelly bar)
        this.drawJellyPaddle(this.paddleX, this.height - 24, this.paddleWidth, this.paddleHeight);

        // Draw Ball (Candy sphere)
        this.drawCandyBall(this.ballX, this.ballY, this.ballRadius);

        // Draw Particles
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Game Over or Win Overlays
        if (this.isGameOver) {
            this.drawOverlayText("挑戰結束！", "按下方按鈕重新展開大冒險", "#ef4444");
        } else if (this.isWin) {
            this.drawOverlayText("恭喜通關！🎉", "太厲害了！你已擊破所有糖果磚塊！", "#10b981");
        }
    }

    drawCandyBrick(x, y, w, h, color) {
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.roundRect(this.ctx, x, y, w, h, 6);
        this.ctx.fill();

        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        this.roundRect(this.ctx, x + 3, y + 2, w - 6, h / 2.6, 3);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawJellyPaddle(x, y, w, h) {
        this.ctx.save();
        const grad = this.ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#ec4899');
        grad.addColorStop(1, '#be185d');
        this.ctx.fillStyle = grad;
        this.roundRect(this.ctx, x, y, w, h, 8);
        this.ctx.fill();

        // Paddle glossy shine
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.roundRect(this.ctx, x + 4, y + 2, w - 8, 4, 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawCandyBall(x, y, radius) {
        this.ctx.save();
        const grad = this.ctx.createRadialGradient(x - radius / 3, y - radius / 3, 1, x, y, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#38bdf8');
        grad.addColorStop(1, '#0284c7');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawOverlayText(title, subtitle, color) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, this.width / 2, this.height / 2 - 10);

        this.ctx.font = '16px sans-serif';
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillText(subtitle, this.width / 2, this.height / 2 + 30);
        this.ctx.restore();
    }

    renderInitialScreen() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawOverlayText("🍬 糖果敲磚大冒險", "點擊下方「開始遊戲」或移動滑鼠/左右方向鍵", "#f43f5e");
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

window.CandyBreakoutGame = CandyBreakoutGame;
