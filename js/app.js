// ==========================================================================
// Google AI 輔助藝術創作與銜接傳統媒材 · 旗艦研習教學網頁
// Core Application Logic: Password Protection, Rendering, Search, Copy
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const APP_PASS = 'nato';
    let currentTab = 'all';
    let currentModule = 'all';
    let searchQuery = '';
    let breakoutGameInstance = null;

    // Elements
    const gateOverlay = document.getElementById('passwordGate');
    const gateInput = document.getElementById('gateInput');
    const gateForm = document.getElementById('gateForm');
    const gateError = document.getElementById('gateError');
    const btnTogglePw = document.getElementById('togglePw');
    const btnLock = document.getElementById('btnLock');
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const searchInput = document.getElementById('searchInput');
    const moduleSelect = document.getElementById('moduleSelect');
    const jumpSlideSelect = document.getElementById('jumpSlideSelect');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const slidesContainer = document.getElementById('slidesContainer');
    const resultCountEl = document.getElementById('resultCount');
    const toastEl = document.getElementById('toast');
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');

    // ----------------------------------------------------------------------
    // 1. PASSWORD GATE LOGIC
    // ----------------------------------------------------------------------
    const checkAuth = () => {
        const isAuth = localStorage.getItem('google_ai_workshop_auth');
        if (isAuth === 'true') {
            gateOverlay.classList.add('hidden');
        } else {
            gateOverlay.classList.remove('hidden');
            setTimeout(() => gateInput.focus(), 200);
        }
    };

    const unlock = () => {
        const entered = (gateInput.value || '').trim();
        if (entered.toLowerCase() === APP_PASS) {
            localStorage.setItem('google_ai_workshop_auth', 'true');
            gateError.textContent = '';
            gateOverlay.classList.add('hidden');
            showToast('通行碼驗證成功！歡迎進入研習手冊');
        } else {
            gateError.textContent = '通行碼錯誤，請確認後重新輸入';
            const card = document.querySelector('.gate-card');
            if (card) {
                card.classList.remove('gate-shake');
                void card.offsetWidth; // trigger reflow
                card.classList.add('gate-shake');
            }
            gateInput.select();
        }
    };

    if (gateForm) {
        gateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            unlock();
        });
    }

    if (btnTogglePw) {
        btnTogglePw.addEventListener('click', () => {
            if (gateInput.type === 'password') {
                gateInput.type = 'text';
                btnTogglePw.textContent = '🙈';
            } else {
                gateInput.type = 'password';
                btnTogglePw.textContent = '👁️';
            }
        });
    }

    if (btnLock) {
        btnLock.addEventListener('click', () => {
            localStorage.removeItem('google_ai_workshop_auth');
            gateInput.value = '';
            gateError.textContent = '';
            gateOverlay.classList.remove('hidden');
            gateInput.focus();
            showToast('已鎖定系統');
        });
    }

    checkAuth();

    // ----------------------------------------------------------------------
    // 2. THEME TOGGLE (Dark / Light)
    // ----------------------------------------------------------------------
    const initTheme = () => {
        const saved = localStorage.getItem('site_theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            btnThemeToggle.textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            btnThemeToggle.textContent = '🌙';
        }
    };

    btnThemeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('site_theme', 'light');
            btnThemeToggle.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('site_theme', 'dark');
            btnThemeToggle.textContent = '☀️';
        }
    });

    initTheme();

    // ----------------------------------------------------------------------
    // 3. TOAST NOTIFICATION HELPER
    // ----------------------------------------------------------------------
    let toastTimeout;
    const showToast = (message, icon = '✅') => {
        clearTimeout(toastTimeout);
        toastEl.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        toastEl.classList.add('show');
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2800);
    };

    // ----------------------------------------------------------------------
    // 4. POPULATE DROPDOWNS
    // ----------------------------------------------------------------------
    const populateDropdowns = () => {
        // Jump slide dropdown
        slidesData.forEach(slide => {
            const opt = document.createElement('option');
            opt.value = slide.slideNum;
            opt.textContent = `Slide ${slide.slideNum}：${slide.title.substring(0, 24)}...`;
            jumpSlideSelect.appendChild(opt);
        });

        // Jump event
        jumpSlideSelect.addEventListener('change', () => {
            const targetNum = jumpSlideSelect.value;
            if (targetNum) {
                const targetCard = document.getElementById(`slide-card-${targetNum}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    targetCard.style.outline = '3px solid var(--primary)';
                    setTimeout(() => targetCard.style.outline = 'none', 1800);
                }
            }
        });
    };

    populateDropdowns();

    // ----------------------------------------------------------------------
    // 5. COPY TO CLIPBOARD
    // ----------------------------------------------------------------------
    window.copyText = (text, typeLabel = '內容') => {
        navigator.clipboard.writeText(text).then(() => {
            showToast(`已成功複製${typeLabel}至剪貼簿！`, '📋');
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast(`已成功複製${typeLabel}至剪貼簿！`, '📋');
        });
    };

    // ----------------------------------------------------------------------
    // 6. LIGHTBOX MODAL
    // ----------------------------------------------------------------------
    window.openLightbox = (src) => {
        lightboxImg.src = src;
        lightboxModal.classList.add('active');
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightboxModal.classList.remove('active');
        });
    }

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
            lightboxModal.classList.remove('active');
        }
    });

    // ----------------------------------------------------------------------
    // 7. RENDER SLIDES FUNCTION
    // ----------------------------------------------------------------------
    const renderSlides = () => {
        slidesContainer.innerHTML = '';

        // Filter data
        const filtered = slidesData.filter(slide => {
            // Module filter
            if (currentModule !== 'all' && slide.module !== currentModule) {
                return false;
            }

            // Tab filter
            if (currentTab === 'handbook' && (!slide.handbook || Object.keys(slide.handbook).length === 0)) {
                return false;
            }
            if (currentTab === 'prompts' && (!slide.prompts || slide.prompts.length === 0)) {
                return false;
            }
            if (currentTab === 'links' && (!slide.links || slide.links.length === 0)) {
                return false;
            }
            if (currentTab === 'game' && slide.slideNum !== 33) {
                return false;
            }

            // Search query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const numMatch = slide.slideNum.toString().includes(q);
                const titleMatch = (slide.title || '').toLowerCase().includes(q);
                const subMatch = (slide.subtitle || '').toLowerCase().includes(q);
                const contentMatch = (slide.originalContent || []).join(' ').toLowerCase().includes(q);
                const linksMatch = (slide.links || []).some(l => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q));
                const promptMatch = (slide.prompts || []).some(p => p.title.toLowerCase().includes(q) || p.promptText.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)));
                const hbMatch = slide.handbook && (
                    (slide.handbook.purpose || '').toLowerCase().includes(q) ||
                    (slide.handbook.traditionalMediaNotes || '').toLowerCase().includes(q) ||
                    (slide.handbook.steps || []).join(' ').toLowerCase().includes(q)
                );
                return numMatch || titleMatch || subMatch || contentMatch || linksMatch || promptMatch || hbMatch;
            }

            return true;
        });

        // Update count
        if (resultCountEl) {
            resultCountEl.textContent = `${filtered.length} 個單元主題`;
        }

        if (filtered.length === 0) {
            slidesContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-color);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
                    <h3 style="font-size: 20px; margin-bottom: 8px;">未找到符合條件的內容</h3>
                    <p style="color: var(--text-muted); font-size: 14px;">請嘗試更換搜尋關鍵字或切換導覽標籤</p>
                </div>
            `;
            return;
        }

        // Render each card
        filtered.forEach(slide => {
            const card = document.createElement('article');
            card.className = 'slide-card';
            card.id = `slide-card-${slide.slideNum}`;

            // 1. Header
            let headerHTML = `
                <div class="card-header">
                    <div class="card-header-left">
                        <div class="slide-badge-row">
                            <span class="badge-slide-num">Slide ${slide.slideNum}</span>
                            <span class="badge-module">${slide.module}</span>
                        </div>
                        <h3 class="slide-title">${slide.title}</h3>
                        ${slide.subtitle ? `<p class="slide-subtitle">${slide.subtitle}</p>` : ''}
                    </div>
                    <div class="card-quick-actions">
                        <button class="btn-pill" onclick="copyText(window.location.origin + window.location.pathname + '#slide-card-${slide.slideNum}', '本單元錨點連結')">
                            🔗 複製單元錨點
                        </button>
                    </div>
                </div>
            `;

            // 2. Body elements
            let bodyHTML = `<div class="card-body">`;

            // Images Section
            if (slide.images && slide.images.length > 0) {
                bodyHTML += `
                    <div class="slide-media-section">
                        <div class="media-section-title">
                            🖼️ 簡報原版投影片縮圖 (${slide.images.length} 張 · 點擊可放大檢視)
                        </div>
                        <div class="media-thumbnails-grid">
                            ${slide.images.map(imgSrc => `
                                <div class="thumbnail-box" onclick="openLightbox('${imgSrc}')">
                                    <img src="${imgSrc}" alt="Slide ${slide.slideNum} visual" loading="lazy">
                                    <span class="thumb-zoom-icon">🔍 點擊放大</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // MANDATORY PROMINENT: Links Section
            if (slide.links && slide.links.length > 0) {
                bodyHTML += `
                    <div class="slide-links-section">
                        <div class="links-header">
                            <span>🔗</span>
                            <span>本頁核心外部連結與資源指引 (${slide.links.length} 個端點)</span>
                        </div>
                        <div class="links-grid">
                            ${slide.links.map(l => `
                                <div class="link-card-item">
                                    <div class="link-icon-box">🌐</div>
                                    <div class="link-info">
                                        <div class="link-title-row">
                                            <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="link-main-title">
                                                ${l.title} ↗
                                            </a>
                                            ${l.badge ? `<span class="link-tag">${l.badge}</span>` : ''}
                                        </div>
                                        <p class="link-desc">${l.description || '點擊即可在新分頁開啟'}</p>
                                        <div class="link-url-display">
                                            <span>${l.url}</span>
                                            <button class="btn-copy-url" onclick="copyText('${l.url}', '外部網址')" title="複製網址">📋</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Student Handbook Section
            if (slide.handbook && Object.keys(slide.handbook).length > 0) {
                bodyHTML += `
                    <div class="slide-handbook-section">
                        <h4 class="handbook-title">
                            <span>📖</span>
                            <span>學員實作手冊 · 深度步驟指引與理論銜接</span>
                        </h4>
                        <div class="handbook-grid">
                            <div class="handbook-block">
                                <span class="handbook-block-label">🎯 學習與實作目標</span>
                                <p class="handbook-block-content">${slide.handbook.purpose}</p>

                                ${slide.handbook.traditionalMediaNotes ? `
                                    <div class="traditional-media-highlight" style="margin-top: 12px;">
                                        <strong>🎨 傳統媒材銜接與藝術理論重點：</strong><br>
                                        ${slide.handbook.traditionalMediaNotes}
                                    </div>
                                ` : ''}
                            </div>

                            <div class="handbook-block">
                                <span class="handbook-block-label">📝 逐步操作流程指引</span>
                                <ul class="handbook-steps-list">
                                    ${slide.handbook.steps.map(step => `<li>${step}</li>`).join('')}
                                </ul>

                                ${slide.handbook.tips ? `
                                    <div class="tips-box" style="margin-top: 12px;">
                                        <strong>💡 實作技巧與避坑要點：</strong><br>
                                        ${slide.handbook.tips}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Prompt Guide Section
            if (slide.prompts && slide.prompts.length > 0) {
                bodyHTML += `
                    <div class="slide-prompts-section">
                        <div class="prompts-section-title">
                            <span>🪄</span>
                            <span>詠唱指南 · 結構拆解與可執行 Prompt (${slide.prompts.length} 組)</span>
                        </div>
                        ${slide.prompts.map((p, pIdx) => `
                            <div class="prompt-card">
                                <div class="prompt-card-header">
                                    <div class="prompt-header-title">
                                        <span>💎</span>
                                        <span>${p.title}</span>
                                    </div>
                                    <div class="prompt-tags-row">
                                        ${(p.tags || []).map(t => `<span class="prompt-tag">#${t}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="prompt-card-body">
                                    ${p.formulaBreakdown ? `
                                        <div class="formula-breakdown-box">
                                            <strong>公式拆解：</strong> ${p.formulaBreakdown}
                                        </div>
                                    ` : ''}

                                    <div class="prompt-text-container">
                                        <button class="btn-copy-prompt" onclick="copyText(\`${p.promptText.replace(/`/g, '\\`')}\`, 'Prompt 提示詞')">
                                            📋 一鍵複製 Prompt
                                        </button>
                                        <code>${p.promptText}</code>
                                    </div>

                                    ${p.customTips ? `
                                        <div class="prompt-custom-tips">
                                            <span>💡</span>
                                            <span><strong>調校建議：</strong>${p.customTips}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Special Interactive Feature for Slide 33: Candy Breakout
            if (slide.slideNum === 33) {
                bodyHTML += `
                    <div class="game-feature-wrapper">
                        <div class="game-header-bar">
                            <div class="game-title-group">
                                <h3>🍬 Vibe Coding 實作成果體驗 · 糖果敲磚大冒險</h3>
                            </div>
                            <div class="game-stats-row">
                                <span class="game-stat-pill">分數：<span id="gameScore" style="color: #ec4899;">0</span></span>
                                <span class="game-stat-pill">生命：<span id="gameLives">❤️❤️❤️</span></span>
                            </div>
                        </div>
                        <div class="canvas-container">
                            <canvas id="breakoutCanvas" width="680" height="420"></canvas>
                        </div>
                        <div class="game-controls-bar">
                            <button id="btnStartGame" class="btn-game start">🎮 開始遊戲 / 繼續</button>
                            <button id="btnResetGame" class="btn-game reset">🔄 重新開始</button>
                            <span style="font-size: 13px; color: var(--text-muted); margin-left: 8px;">
                                操作方式：移動滑鼠 或 按鍵盤 ← → 方向鍵
                            </span>
                        </div>
                    </div>
                `;
            }

            bodyHTML += `</div>`; // Close card-body
            card.innerHTML = headerHTML + bodyHTML;
            slidesContainer.appendChild(card);
        });

        // Initialize game if slide 33 is present in DOM
        if (document.getElementById('breakoutCanvas')) {
            breakoutGameInstance = new CandyBreakoutGame('breakoutCanvas');
        }
    };

    // ----------------------------------------------------------------------
    // 8. EVENT LISTENERS FOR CONTROLS
    // ----------------------------------------------------------------------
    // Tab switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            renderSlides();
        });
    });

    // Module dropdown filter
    if (moduleSelect) {
        moduleSelect.addEventListener('change', () => {
            currentModule = moduleSelect.value;
            renderSlides();
        });
    }

    // Search input with debounce
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = (searchInput.value || '').trim();
                renderSlides();
            }, 250);
        });
    }

    // Initial render
    renderSlides();
});
