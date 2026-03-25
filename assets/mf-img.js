/**
 * @description MFImg 组件
 * @author luochongfei
 * @使用
 * <mf-img>
 *   <source src="https://example.com/image.jpg" />
 *   <source src="https://example.com/image.jpg" media="(min-width: 768px)" />
 * </mf-img>
 * 
 * @支持的属性
 * <mf-img lazy>
 *   <source src="https://example.com/image.jpg" />
 *   <source src="https://example.com/image.jpg" media="(min-width: 768px)" />
 * </mf-img>
 * 
 * @支持定制样式
 * <mf-img style="--mf-img-bg: #e5e7eb; --mf-img-object-fit: contain; --mf-img-loading-circle-width: 40px; --mf-img-loading-line-width: 4px; --mf-img-loading-color: #f00;">
 *   <source src="https://example.com/image.jpg" />
 *   <source src="https://example.com/image.jpg" media="(min-width: 768px)" />
 * </mf-img>
 */
class MFImg extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isLoaded = false;
        this.sources = [];
        this.hasSrc = false;
    }

    connectedCallback() {
        this.parseSources();
        this.render();
        this.setup();
        
        // 监听 source 标签的 src 属性变化（用于懒加载库动态设置 src）
        this.setupSourceObserver();
    }

    parseSources() {
        this.sources = [];
        const sources = this.querySelectorAll('source');
        
        sources.forEach(s => {
            const src = s.getAttribute('src') || s.getAttribute('srcset');
            if (src) {
                this.sources.push({
                    media: s.getAttribute('media'),
                    src: s.getAttribute('src'),
                    srcset: s.getAttribute('srcset'),
                    ratio: s.getAttribute('aspect-ratio')
                });
            }
        });

        // 回退到属性方式
        if (this.sources.length === 0) {
            const pcSrc = this.getAttribute('pc-src');
            const mSrc = this.getAttribute('m-src');
            
            if (pcSrc) this.sources.push({ media: '(min-width: 768px)', src: pcSrc, ratio: this.getAttribute('pc-ratio') });
            if (mSrc) this.sources.push({ media: '(max-width: 767px)', src: mSrc, ratio: this.getAttribute('m-ratio') });
        }

        // 检查是否有有效的 src
        this.hasSrc = this.sources.length > 0;

        // 排序：min-width 优先
        this.sources.sort((a, b) => {
            if (!a.media) return 1;
            if (!b.media) return -1;
            const aMin = a.media.includes('min-width');
            const bMin = b.media.includes('min-width');
            if (aMin && !bMin) return -1;
            if (!aMin && bMin) return 1;
            if (aMin && bMin) {
                return parseInt(b.media.match(/\d+/)[0]) - parseInt(a.media.match(/\d+/)[0]);
            }
            return parseInt(a.media.match(/\d+/)?.[0] || 0) - parseInt(b.media.match(/\d+/)?.[0] || 0);
        });
    }

    setupSourceObserver() {
        // 使用 MutationObserver 监听 source 标签的 src 属性变化
        this.observer = new MutationObserver(() => {
            const hadSrc = this.hasSrc;
            this.parseSources();
            
            // 从无 src 到有 src，触发懒加载
            if (!hadSrc && this.hasSrc && !this.isLoaded) {
                if (this.loadFunction) {
                    this.loadFunction();
                    this.isLoaded = true;
                }
            }
        });

        this.observer.observe(this, {
            attributes: true,
            attributeFilter: ['src', 'srcset'],
            subtree: true,
            childList: true
        });
    }

    getActiveSource() {
        const w = window.innerWidth;
        for (const s of this.sources) {
            if (!s.media) return s;
            const min = s.media.match(/min-width:\s*(\d+)/);
            const max = s.media.match(/max-width:\s*(\d+)/);
            if (min && w >= parseInt(min[1])) return s;
            if (max && w <= parseInt(max[1])) return s;
        }
        return this.sources[0];
    }

    calcRatio(ratio) {
        if (!ratio) return '';
        if (ratio.includes('%')) return ratio;
        if (ratio.includes(':')) {
            const [w, h] = ratio.split(':').map(Number);
            return (h / w * 100) + '%';
        }
        return (1 / parseFloat(ratio) * 100) + '%';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; width: 100%; position: relative; }
                .c { position: relative; width: 100%; height: var(--mf-img-height, auto); background: var(--mf-img-bg, #e5e7eb); overflow: hidden; z-index: var(--mf-img-z-index, 1); }
                .c.r { height: 0; }
                img { display: block; width: 100%; height: 100%; object-fit: var(--mf-img-object-fit, cover); object-position: var(--mf-img-object-position, center); }
                .c.r img { position: absolute; top: 0; left: 0; z-index: 11; }
                .l { position: absolute; inset: 0; z-index: 10; background: var(--mf-img-loading-bg, rgba(0,0,0,.08)); display: flex; align-items: center; justify-content: center; }
                .l::after { content: ""; width: var(--mf-img-loading-circle-width, 40px); height: var(--mf-img-loading-circle-width, 40px); border: var(--mf-img-loading-line-width, 4px) solid #eee; border-top-color: var(--mf-img-loading-color, #859077); border-radius: 50%; animation: s .5s linear infinite; }
                @keyframes s { to { transform: rotate(360deg); } }
                .l.h { display: none; }
            </style>
            <div class="c"><div class="l h"></div><img alt="${this.getAttribute('alt') || ''}" /></div>
        `;
    }

    setup() {
        const img = this.shadowRoot.querySelector('img');
        const container = this.shadowRoot.querySelector('.c');
        const loading = this.shadowRoot.querySelector('.l');

        const load = () => {
            const src = this.getActiveSource();
            if (!src?.src && !src?.srcset) {
                console.warn('MFImg: No valid source');
                return;
            }

            const ratio = this.calcRatio(src.ratio);
            container.classList.toggle('r', !!ratio);
            if (ratio) container.style.paddingTop = ratio;
            else container.style.paddingTop = '';

            const newSrc = src.srcset || src.src;
            if (img.src?.split('/').pop() === newSrc?.split('/').pop()) return;

            loading.classList.remove('h');
            if (src.srcset) {
                img.srcset = src.srcset;
                if (src.src) img.src = src.src;
            } else {
                img.src = src.src;
            }
        };

        // 保存 load 函数供 MutationObserver 使用
        this.loadFunction = load;

        img.onload = () => loading.classList.add('h');
        img.onerror = () => loading.classList.add('h');

        // 懒加载逻辑
        if (this.hasAttribute('lazy')) {
            // 如果初始有 src，使用 IntersectionObserver
            if (this.hasSrc) {
                new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting && !this.isLoaded) {
                        load();
                        this.isLoaded = true;
                    }
                }, { threshold: 0.01, rootMargin: '50px' }).observe(this);
            }
            // 如果初始无 src，等待 MutationObserver 检测到 src 变化
            else {
                console.log('MFImg: Waiting for lazy load library to set src');
            }
        } else {
            // 非懒加载模式，立即加载
            if (this.hasSrc) {
                load();
                this.isLoaded = true;
            } else {
                console.warn('MFImg: No source provided');
            }
        }

        // 响应式
        let timer;
        window.addEventListener('resize', () => {
            clearTimeout(timer);
            timer = setTimeout(() => this.isLoaded && load(), 100);
        });
    }

    disconnectedCallback() {
        // 清理 MutationObserver
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

customElements.define('mf-img', MFImg);
