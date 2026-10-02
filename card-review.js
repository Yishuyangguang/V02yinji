/**
 * 恒久印记 - 卡片全景回顾浏览引擎
 * 文件名: card-review.js
 * 功能: 动态提取当前卡片所有步骤内容，剔除标题，配合时期专属主题色进行沉浸式全览渲染
 */

(function initCardReviewEngine() {
    console.log("🚀 成功加载印记全景回顾引擎 V1.0");

    // 1. 注入全景回顾界面的沉浸式 CSS 样式
    if (!document.getElementById('card-review-style')) {
        const style = document.createElement('style');
        style.id = 'card-review-style';
        style.innerHTML = `
            .review-fullscreen-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                z-index: 100000; display: none; flex-direction: column; justify-content: flex-start;
                overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth;
                padding: calc(env(safe-area-inset-top) + 6vh) 20px calc(env(safe-area-inset-bottom) + 6vh) 20px;
                opacity: 0; transition: opacity 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
            }

            .review-paper-card {
                width: 100%; max-width: 800px; margin: 0 auto;
                background: var(--theme-glass-bg);
                backdrop-filter: blur(35px) saturate(150%); -webkit-backdrop-filter: blur(35px) saturate(150%);
                border-radius: 32px; padding: 50px 45px;
                box-shadow: 0 30px 60px rgba(0,0,0,0.15), inset 0 2px 5px rgba(255,255,255,0.8);
                border: 1px solid var(--theme-glass-border);
                position: relative; transform: translateY(20px); transition: transform 0.5s ease;
            }
            .review-fullscreen-overlay.show .review-paper-card {
                transform: translateY(0);
            }

            .review-header-title {
                text-align: center; color: var(--theme-primary);
                font-size: 2rem; font-weight: bold; letter-spacing: 2px;
                margin-bottom: 40px; font-family: var(--font-title);
                border-bottom: 1px dashed var(--theme-primary); padding-bottom: 20px;
            }

            /* 绝对纯净的阅读排版区 */
            .review-reading-zone {
                font-size: 1.2rem; line-height: 2.2; color: var(--theme-text);
                text-align: justify; text-align-last: left; font-weight: 500;
                letter-spacing: 0.5px;
            }
            .review-reading-zone p { margin-bottom: 25px; }

            .review-close-container {
                width: 100%; max-width: 800px; margin: 40px auto 0 auto;
                display: flex; justify-content: center;
            }

            .btn-review-close {
                background: rgba(255,255,255,0.9); color: #1e293b;
                border: 1px solid #cbd5e1; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                padding: 18px 50px; border-radius: 50px; font-size: 1.15rem; font-weight: bold;
                letter-spacing: 2px; cursor: pointer; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .btn-review-close:active { transform: scale(0.96); background: #f1f5f9; }

            @media (max-width: 768px) {
                .review-fullscreen-overlay { padding: calc(env(safe-area-inset-top) + 20px) 15px calc(env(safe-area-inset-bottom) + 20px) 15px; }
                .review-paper-card { padding: 35px 25px; border-radius: 24px; }
                .review-header-title { font-size: 1.6rem; margin-bottom: 30px; }
                .review-reading-zone { font-size: 1.1rem; line-height: 2; }
                .btn-review-close { width: 100%; padding: 16px; font-size: 1.1rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // 2. 挂载全局方法
    window.openCardReview = function() {
        if (!state || !state.currentCard || !state.currentCard.steps) {
            return window.showGlobalToast ? window.showGlobalToast('暂无内容可供回顾', 'error') : alert('暂无内容');
        }

        let overlay = document.getElementById('card-review-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'card-review-overlay';
            overlay.className = 'review-fullscreen-overlay';
            document.body.appendChild(overlay);
        }

        // 🚀 核心：动态抽提当前时期的专属主题渐变色
        let bgGradient = '#f8f6f0';
        if (db && db.stages && db.stages[state.stage] && db.stages[state.stage].themeParams) {
            const t = db.stages[state.stage].themeParams;
            const p = state.isLightTheme ? t.light : t.dark;
            // 使用底层背景色配合主色的柔和渐变映射
            bgGradient = `linear-gradient(135deg, ${p.bg} 0%, rgba(0,0,0,0.05) 100%)`;
            if(!state.isLightTheme) {
                bgGradient = `linear-gradient(135deg, ${p.bg} 0%, rgba(255,255,255,0.05) 100%)`;
            }
        }
        overlay.style.background = bgGradient;

        // 🚀 核心：缝合所有内容，剔除标题 (排除空段落)
        const combinedText = state.currentCard.steps
            .map(step => (step.text || '').trim())
            .filter(text => text.length > 0)
            .join('<br><br><br>'); // 用三行回车拉开段落层级

        overlay.innerHTML = `
            <div class="review-paper-card">
                <div class="review-header-title">${state.currentCard.title}</div>
                <div class="review-reading-zone">${combinedText.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="review-close-container">
                <button class="btn-review-close" onclick="window.closeCardReview()">关闭回顾</button>
            </div>
        `;

        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('show');
            overlay.style.opacity = '1';
        }, 10);
    };

    window.closeCardReview = function() {
        const overlay = document.getElementById('card-review-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.classList.remove('show');
            setTimeout(() => overlay.style.display = 'none', 500);
        }
    };
})();
