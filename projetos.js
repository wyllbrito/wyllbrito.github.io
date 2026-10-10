// Pages CMS: reads { projetos: [...] } from projetos.json.
// Keep before textos.js and paginas.js, without async or type="module".
(() => {
    'use strict';

    const messages = {
        pt: {
            loading: 'Carregando projetos…',
            empty: 'Nenhum projeto cadastrado.',
            error: 'Não foi possível carregar os projetos.',
            retry: 'Tentar novamente',
            open: 'Ver projeto completo'
        },
        en: {
            loading: 'Loading projects…',
            empty: 'No projects added yet.',
            error: 'Could not load projects.',
            retry: 'Try again',
            open: 'View full project'
        }
    };

    const t = value =>
        typeof value === 'string'
            ? value
            : (value?.[currentLang] || value?.pt || '');

    const el = (tag, classes, text) => {
        const node = document.createElement(tag);
        if (classes) node.className = classes;
        if (text != null) node.textContent = text;
        return node;
    };

    let refs = [];
    let state = 'loading';
    let pending = false;

    const list = document.getElementById('project-list');
    const status = document.getElementById('project-status');
    const retry = document.getElementById('project-retry');
    const feedback = document.getElementById('project-feedback');

    if (!list) return;

    function applyLanguage() {
        const T = messages[currentLang] || messages.pt;

        if (status) status.textContent = T[state] || '';

        if (retry) {
            retry.textContent = T.retry;
            retry.hidden = state !== 'error';
        }

        if (feedback) feedback.hidden = state === 'ready';

        refs.forEach(({
            p,
            image,
            title,
            description,
            tags,
            label,
            link
        }) => {
            image.alt = t(p.titulo);
            title.textContent = t(p.titulo);
            description.textContent = t(p.descricao);

            tags.replaceChildren();

            const values = Array.isArray(p.tag) ? p.tag : [p.tag];

            values.forEach(value => {
                const text = t(value);

                if (text) {
                    tags.append(el(
                        'span',
                        'px-3 py-1 rounded-full border border-accent/30 text-accent text-xs font-semibold',
                        text
                    ));
                }
            });

            label.textContent =
                t(p.botao) ||
                translations[currentLang]?.['proj-btn-view'] ||
                T.open;

            link.setAttribute(
                'aria-label',
                label.textContent + ' — ' + t(p.titulo)
            );
        });
    }

    function setState(next) {
        state = next;
        list.setAttribute('aria-busy', String(next === 'loading'));
        applyLanguage();
    }

    function destination(p) {
        if (p.tipo === 'pagina') {
            if (
                typeof p.slug !== 'string' ||
                (
                    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) ||
                    [
                        'portfolio',
                        'elaine',
                        'solace',
                        'avanca',
                        'dinamica'
                    ].includes(p.slug)
                )
            ) {
                throw new Error('Invalid project slug');
            }

            return '#/' + p.slug;
        }

        if (p.tipo === 'interno') {
            if (!['elaine', 'solace', 'avanca'].includes(p.pagina)) {
                throw new Error('Invalid internal page');
            }

            return '#/' + p.pagina;
        }

        const url = new URL(p.link, document.baseURI);

        if (!p.link || !['http:', 'https:'].includes(url.protocol)) {
            throw new Error('Invalid project link');
        }

        return url.href;
    }

    function createCard(p) {
        if (!p || typeof p !== 'object' || !t(p.titulo)) {
            throw new Error('Invalid project');
        }

        const href = destination(p);

        const article = el(
            'article',
            'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center reveal'
        );

        const frame = el(
            'div',
            'overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/30 shadow-xl'
        );

        const image = el(
            'img',
            'w-full aspect-[4/3] object-cover'
        );

        if (p.capa) image.src = p.capa;

        image.loading = 'lazy';
        image.decoding = 'async';
        frame.append(image);

        const content = el('div', 'space-y-6');
        const tags = el('div', 'flex flex-wrap gap-2');

        const title = el(
            'h3',
            'text-3xl md:text-5xl font-display font-bold text-balance'
        );

        const description = el(
            'p',
            'text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed'
        );

        const link = el(
            'a',
            'inline-flex min-h-[44px] items-center gap-3 py-2 text-accent font-semibold border-b border-accent/40 hover:border-accent'
        );

        link.href = href;

        if (p.tipo === 'interno') {
            link.addEventListener('click', event => {
                if (
                    event.button ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                ) {
                    return;
                }

                event.preventDefault();
                switchView(p.pagina);
            });
        }

        if (p.tipo !== 'pagina' && p.tipo !== 'interno') {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        const label = el('span');
        const arrow = el('span', '', '↗');
        arrow.setAttribute('aria-hidden', 'true');

        link.append(label, arrow);
        content.append(tags, title, description, link);
        article.append(frame, content);

        refs.push({
            p,
            image,
            title,
            description,
            tags,
            label,
            link
        });

        return article;
    }

    function reveal(cards) {
        if (
            !('IntersectionObserver' in window) ||
            matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            cards.forEach(card => card.classList.add('active'));
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        cards.forEach(card => observer.observe(card));
    }

    async function load() {
        if (pending) return;

        pending = true;
        setState('loading');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch('projetos.json', {
                cache: 'no-cache',
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }

            const data = await response.json();

            if (!data || !Array.isArray(data.projetos)) {
                throw new Error('Expected projetos array');
            }

            refs = [];

            const slugs = new Set();

            data.projetos.forEach(p => {
                if (p?.tipo === 'pagina') {
                    if (slugs.has(p.slug)) {
                        throw new Error('Duplicate project slug');
                    }

                    slugs.add(p.slug);
                }
            });

            const cards = data.projetos.map(createCard);

            window.PROJETOS = data.projetos;
            list.replaceChildren(...cards);

            setState(cards.length ? 'ready' : 'empty');
            reveal(cards);

            document.dispatchEvent(new Event('projetos:prontos'));
        } catch (error) {
            refs = [];
            window.PROJETOS = [];

            list.replaceChildren();
            setState('error');

            console.error(
                'Não foi possível carregar projetos.json:',
                error
            );
        } finally {
            clearTimeout(timeout);
            pending = false;
        }
    }

    const previousChangeLang = changeLang;

    changeLang = function(lang) {
        previousChangeLang(lang);
        applyLanguage();
    };

    retry?.addEventListener('click', () => {
        // Keep keyboard focus stable while the retry button becomes hidden.
        if (status) {
            status.tabIndex = -1;
            status.focus({ preventScroll: true });
        }

        load();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load, {
            once: true
        });
    } else {
        load();
    }
})();
