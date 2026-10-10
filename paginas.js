// Monta páginas de projeto a partir dos blocos definidos em projetos.json (tipo "pagina").
// Cada projeto ganha um endereço próprio: seusite/#/slug
(function () {
  let projetos = [];
  let atual = null;
  const estado = {}; // guarda qual imagem de cada galeria está aberta
  const vistasAntigas = ['portfolio', 'elaine', 'solace', 'avanca'];

  const H2 = 'text-3xl md:text-4xl font-bold font-display text-balance';
  const MOLDURA = 'overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/30 shadow-xl';
  const BTN = 'px-6 py-3 border border-neutral-300 dark:border-neutral-800 rounded-xl hover:border-accent hover:text-accent text-xs font-bold tracking-widest transition-all bg-white/50 dark:bg-neutral-900/50 shadow-sm';

  const t = c => (c ? (c[currentLang] || c.pt || '') : '');
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
    const fotos = (b.imagens || []).filter(Boolean);
    if (!fotos.length) return null;
    const T = translations[currentLang];
    const chave = atual.slug + ':' + i;
    let n = Math.min(estado[chave] || 0, fotos.length - 1);

    const s = el('section', 'mb-20 space-y-8');
    const topo = el('div', 'flex flex-col md:flex-row md:items-center justify-between gap-4');
    topo.appendChild(el('h2', H2, t(b.titulo)));
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
    cab.append(
      el('h1', 'text-5xl md:text-7xl font-bold font-display mt-8 mb-6 text-balance', t(p.titulo)),
      el('p', 'text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed font-normal', t(p.descricao))
    );
    view.appendChild(cab);

    if (p.info) {
      const caixa = el('section', 'mb-16 grid grid-cols-1 md:grid-cols-3 gap-8 bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 p-8 rounded-2xl');
      [['label-role', p.info.papel], ['label-year', p.info.ano], ['label-scope', p.info.escopo]].forEach(([k, v]) => {
        const d = el('div');
        d.append(
          el('h3', 'font-sans text-xs tracking-widest font-bold text-accent mb-2', T[k]),
          el('p', 'text-sm md:text-base font-semibold', t(v))
        );
        caixa.appendChild(d);
      });
      view.appendChild(caixa);
    }

    (p.blocos || []).forEach((b, i) => {
      const fabrica = { imagem: blocoImagem, galeria: blocoGaleria, video: blocoVideo, texto: blocoTexto }[b.bloco];
      const secaoPronta = fabrica && fabrica(b, i);
      if (secaoPronta) view.appendChild(secaoPronta);
    });
  }

  function mostrar(p) {
    atual = p;
    vistasAntigas.forEach(n => document.getElementById('view-' + n).classList.add('hidden'));
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('project-header').classList.remove('hidden');
    view.classList.remove('hidden');
    desenhar();
    window.scrollTo(0, 0);
  }

  function resolver() {
    const m = location.hash.match(/^#\/(.+)$/);
    const slug = m ? decodeURIComponent(m[1]) : '';
    const p = projetos.find(x => x.tipo === 'pagina' && x.slug === slug);
    if (p) mostrar(p);
    else if (atual) switchView('portfolio');
  }

  // "Voltar" e os cartões antigos continuam funcionando; só escondemos a página montada por blocos.
  const trocarVista = switchView;
  switchView = function (vista) {
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
  };

  document.addEventListener('projetos:prontos', () => {
    projetos = window.PROJETOS || [];
    resolver();
  });
  window.addEventListener('hashchange', resolver);
})();
