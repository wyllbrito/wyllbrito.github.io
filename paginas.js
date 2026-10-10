// Every project page uses only the current data and blocks from projetos.json.
// No fixed pages, media lists, descriptions or project-specific defaults.
(function () {
  let projetos = [];
  let atual = null;
  let carregado = false;
  let falhou = false;
  const estado = {}; // guarda qual imagem de cada galeria está aberta

  const H2 = 'text-3xl md:text-4xl font-bold font-display text-balance';
  const MOLDURA = 'overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/30 shadow-xl';
  const BTN = 'px-6 py-3 border border-neutral-300 dark:border-neutral-800 rounded-xl hover:border-accent hover:text-accent text-xs font-bold tracking-widest transition-all bg-white/50 dark:bg-neutral-900/50 shadow-sm';

  const t = c => typeof c === 'string' ? c : (c ? (c[currentLang] || c.pt || '') : '');
  const mensagens = {
    pt: { ausente: 'Projeto não encontrado.', erro: 'Não foi possível carregar este projeto.', repetir: 'Tentar novamente', bloco: 'Não foi possível exibir este bloco.' },
    en: { ausente: 'Project not found.', erro: 'This project could not be loaded.', repetir: 'Try again', bloco: 'This block could not be displayed.' }
  };
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  const view = el('div', 'hidden min-h-screen py-24 px-6 md:px-12 max-w-5xl mx-auto');
  view.id = 'view-dinamica';
  document.querySelector('main').appendChild(view);

  function secao(b) {
    const s = el('section', 'mb-20 space-y-6');
    if (t(b.titulo)) s.appendChild(el('h2', H2, t(b.titulo)));
    return s;
  }

  function blocoImagem(b) {
    if (typeof b.imagem !== 'string' || !b.imagem) return null;
    const s = secao(b);
    const m = el('div', MOLDURA);
    const img = el('img', 'w-full h-auto object-cover');
    img.src = b.imagem || '';
    img.alt = t(b.alt) || t(b.titulo);
    img.loading = 'lazy';
    m.appendChild(img);
    s.appendChild(m);
    return s;
  }

  function blocoVideo(b) {
    const txt = String(b.youtube || '');
    const achado = txt.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/) || txt.match(/^([\w-]{11})$/);
    if (!achado) return null;
    const s = secao(b);
    const cx = el('div', 'overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900 aspect-video border border-neutral-200/80 dark:border-neutral-800/80 shadow-lg relative');
    const f = el('iframe', 'w-full h-full absolute inset-0 border-0');
    f.src = 'https://www.youtube-nocookie.com/embed/' + achado[1];
    f.title = t(b.titulo) || t(atual.titulo);
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin';
    f.allowFullscreen = true;
    f.loading = 'lazy';
    cx.appendChild(f);
    s.appendChild(cx);
    return s;
  }

  function blocoTexto(b) {
    const s = secao(b);
    t(b.texto).split(/\n\s*\n/).filter(Boolean).forEach(par => {
      s.appendChild(el('p', 'text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal max-w-3xl', par));
    });
    return s;
  }

  function blocoGaleria(b, i) {
    const fotos = Array.isArray(b.imagens) ? b.imagens.filter(url => typeof url === 'string' && url) : [];
    if (!fotos.length) return null;
    const T = translations[currentLang];
    const chave = (atual.slug || atual.pagina) + ':' + i;
    let n = Math.min(estado[chave] || 0, fotos.length - 1);

    const s = el('section', 'mb-20 space-y-8');
    const topo = el('div', 'flex flex-col md:flex-row md:items-center justify-between gap-4');
    if (t(b.titulo)) topo.appendChild(el('h2', H2, t(b.titulo)));
    const dir = el('div', 'flex items-center gap-4');
    const contador = el('span', 'font-sans text-sm font-semibold text-neutral-700 dark:text-neutral-300');
    contador.setAttribute('aria-live', 'polite');
    const tela = el('button', 'w-12 h-12 flex items-center justify-center rounded-xl hover:text-accent transition-all bg-transparent nav-glow');
    tela.type = 'button';
    tela.setAttribute('aria-label', T['fullscreen-label']);
    tela.innerHTML = '<svg aria-hidden="true" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4m-4 0l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>';
    dir.append(contador, tela);
    topo.appendChild(dir);

    const moldura = el('div', 'relative rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-transparent');
    moldura.id = 'gal' + i + '-fullscreen-wrapper'; // o CSS do site usa este final de nome na tela cheia
    const area = el('div', 'aspect-[4/3] md:aspect-[16/10] w-full flex items-center justify-center overflow-hidden relative');
    const principal = el('img', 'w-full h-full object-contain transition-all duration-500');
    area.appendChild(principal);
    moldura.appendChild(area);
    tela.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await moldura.requestFullscreen();
      } catch (e) { alert(T['fullscreen-error']); }
    });

    const nav = el('div', 'flex items-center justify-between pt-2');
    const ant = el('button', BTN, T['slide-prev']);
    const prox = el('button', BTN, T['slide-next']);
    ant.type = prox.type = 'button';
    nav.append(ant, prox);

    const previa = el('div', 'space-y-3 pt-6');
    previa.appendChild(el('div', 'font-sans text-xs tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold', T['preview-pages']));
    const faixa = el('div', 'flex gap-3 overflow-x-auto pb-4 pt-1');
    const miniaturas = fotos.map((url, k) => {
      const bt = el('button');
      bt.type = 'button';
      bt.onclick = () => ir(k);
      const im = el('img', 'w-full h-full object-cover');
      im.src = url;
      im.alt = '';
      im.loading = 'lazy';
      bt.appendChild(im);
      faixa.appendChild(bt);
      return bt;
    });
    previa.appendChild(faixa);

    function atualizar(rolar) {
      estado[chave] = n;
      principal.src = fotos[n];
      principal.alt = T['slide-label'] + ' ' + (n + 1) + ' — ' + t(b.titulo);
      contador.textContent = (n + 1) + ' / ' + fotos.length;
      miniaturas.forEach((bt, k) => {
        const ativo = k === n;
        bt.className = 'shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ' +
          (ativo ? 'border-accent scale-105 shadow-md shadow-accent/20' : 'border-neutral-300 dark:border-neutral-800 opacity-60 hover:opacity-100');
        bt.setAttribute('aria-label', T['thumbnail-label'] + ' ' + (k + 1));
        bt.setAttribute('aria-pressed', String(ativo));
        if (ativo && rolar) bt.scrollIntoView({ behavior: motionBehavior(), inline: 'nearest', block: 'nearest' });
      });
    }
    const ir = k => { n = (k + fotos.length) % fotos.length; atualizar(true); };
    ant.onclick = () => ir(n - 1);
    prox.onclick = () => ir(n + 1);
    atualizar(false);

    s.append(topo, moldura, nav, previa);
    return s;
  }

  function desenhar() {
    const p = atual;
    const T = translations[currentLang];
    view.replaceChildren();

    const cab = el('header', 'mb-16 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-12');
    cab.appendChild(el('h1', 'text-5xl md:text-7xl font-bold font-display mt-8 mb-6 text-balance', t(p.titulo)));
    if (t(p.descricao)) cab.appendChild(el('p', 'text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed font-normal', t(p.descricao)));
    view.appendChild(cab);

    const infos = [['label-role', p.info?.papel], ['label-year', p.info?.ano], ['label-scope', p.info?.escopo]].filter(([, value]) => t(value));
    if (infos.length) {
      const caixa = el('section', 'mb-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 p-8 rounded-2xl');
      infos.forEach(([k, v]) => {
        const d = el('div');
        d.append(
          el('h3', 'font-sans text-xs tracking-widest font-bold text-accent mb-2', T[k]),
          el('p', 'text-sm md:text-base font-semibold', t(v))
        );
        caixa.appendChild(d);
      });
      view.appendChild(caixa);
    }

    (Array.isArray(p.blocos) ? p.blocos : []).forEach((b, i) => {
      if (!b || typeof b !== 'object') return;
      const fabrica = { imagem: blocoImagem, galeria: blocoGaleria, video: blocoVideo, texto: blocoTexto }[b.bloco];
      try {
        const secaoPronta = fabrica && fabrica(b, i);
        if (secaoPronta) view.appendChild(secaoPronta);
      } catch (error) {
        const feedback = el('p', 'project-status', mensagens[currentLang].bloco);
        feedback.setAttribute('role', 'alert');
        view.appendChild(feedback);
        console.warn('Bloco do CMS não pôde ser exibido:', error);
      }
    });
  }

  function mostrarVista() {
    document.querySelectorAll('main > [id^="view-"]').forEach(n => n.classList.add('hidden'));
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('project-header').classList.remove('hidden');
    view.classList.remove('hidden');
  }

  function mostrar(p) {
    atual = p;
    mostrarVista();
    desenhar();
    window.scrollTo(0, 0);
  }

  function resolver() {
    const m = location.hash.match(/^#\/(.+)$/);
    let slug = '';
    try { slug = m ? decodeURIComponent(m[1]) : ''; } catch { slug = '\uFFFD'; }
    if (!slug || slug === 'portfolio') return;
    const p = projetos.find(x => (x.tipo === 'pagina' || x.tipo === 'interno') && (x.slug === slug || x.pagina === slug));
    if (p) mostrar(p);
    else {
      atual = null;
      mostrarVista();
      view.replaceChildren();
      // Loading stays silent; never display content from a fixed project page.
      if (!carregado && !falhou) return;
      const message = el('p', 'project-status', mensagens[currentLang][falhou ? 'erro' : 'ausente']);
      message.setAttribute('role', 'alert');
      view.appendChild(message);
      if (falhou) {
        const retry = el('button', 'project-retry', mensagens[currentLang].repetir);
        retry.type = 'button';
        retry.onclick = () => {
          falhou = false;
          resolver();
          document.getElementById('project-retry')?.click();
        };
        view.appendChild(retry);
      }
    }
  }

  // Home and legacy URLs share one router; all project content still comes from CMS.
  const trocarVista = switchView;
  switchView = function (vista) {
    if (vista !== 'portfolio') {
      const route = '#/' + encodeURIComponent(vista);
      if (location.hash === route) resolver();
      else location.hash = route;
      return;
    }
    view.classList.add('hidden');
    atual = null;
    trocarVista(vista);
    if (vista === 'portfolio' && location.hash.indexOf('#/') === 0) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  };

  const trocarIdioma = changeLang;
  changeLang = function (lang) {
    trocarIdioma(lang);
    if (atual) desenhar();
    else resolver();
  };

  document.addEventListener('projetos:prontos', () => {
    projetos = window.PROJETOS || [];
    carregado = true;
    falhou = false;
    resolver();
  });
  document.addEventListener('projetos:erro', () => {
    projetos = [];
    carregado = false;
    falhou = true;
    resolver();
  });
  window.addEventListener('hashchange', resolver);
  resolver();
})();
