// Monta os cartões de projeto da página inicial a partir de projetos.json.
// Para editar os projetos, use o painel (Pages CMS) ou edite projetos.json.
(function () {
  let refs = [];

  const C = {
    artigo: 'border-b border-neutral-200/80 dark:border-neutral-800/80 pb-20 last:border-b-0 last:pb-0 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center group reveal',
    capa: 'block w-full overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-900 aspect-video border border-neutral-200/80 dark:border-neutral-800/80 shadow-md hover-float relative focus:ring-2 focus:ring-accent',
    img: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-700',
    texto: 'flex flex-col justify-center min-w-0',
    // Transformamos a tag em um flex container para agrupar as bolhas
    tagContainer: 'flex flex-wrap gap-2 mb-5',
    // Estilo individual de cada bolha (etiqueta)
    tagPill: 'font-sans text-[10px] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-3.5 py-1.5 rounded-full inline-block tracking-wider font-semibold bg-neutral-100/60 dark:bg-neutral-900/60',
    link: 'text-left w-full',
    h3: 'text-4xl md:text-5xl font-bold font-display mb-6 text-balance hover:text-accent transition-colors w-full',
    desc: 'text-neutral-600 dark:text-neutral-400 text-base leading-relaxed mb-8 font-normal',
    botao: 'inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-hover transition-colors duration-200 p-1'
  };

  // Texto no idioma atual; se faltar a tradução, usa o português.
  function t(campo) {
    return campo ? (campo[currentLang] || campo.pt || '') : '';
  }

  function el(tag, classes) {
    const e = document.createElement(tag);
    if (classes) e.className = classes;
    return e;
  }

  // Projeto "interno" abre uma página do próprio site; "externo" abre um link.
  function criarLink(p, classes) {
    let e;
    if (p.tipo === 'pagina' && p.slug) {
      e = el('button', classes);
      e.type = 'button';
      e.addEventListener('click', () => { location.hash = '#/' + p.slug; });
    } else if (p.tipo === 'interno' && p.pagina) {
      e = el('button', classes);
      e.type = 'button';
      e.addEventListener('click', () => switchView(p.pagina));
    } else {
      e = el('a', classes);
      e.href = /^https?:\/\//.test(p.link || '') ? p.link : '#';
      e.target = '_blank';
      e.rel = 'noopener noreferrer';
    }
    return e;
  }

  function criarCartao(p) {
    const artigo = el('article', C.artigo);

    const capa = criarLink(p, C.capa);
    const img = el('img', C.img);
    img.loading = 'lazy';
    img.src = p.capa || '';
    capa.appendChild(img);

    const texto = el('div', C.texto);
    const tagContainer = el('div', C.tagContainer); // Nosso novo contêiner para múltiplas etiquetas
    const link = criarLink(p, C.link);
    const h3 = el('h3', C.h3);
    link.appendChild(h3);
    const desc = el('p', C.desc);
    const botao = criarLink(p, C.botao);
    const span = el('span');
    botao.appendChild(span);

    texto.append(tagContainer, link, desc, botao);
    artigo.append(capa, texto);
    
    // Agora passamos o tagContainer para atualizar depois, em vez de uma única tag
    refs.push({ p, img, tagContainer, h3, desc, span });
    return artigo;
  }

  function aplicarIdioma() {
    const padrao = translations[currentLang]['proj-btn-view'];
    refs.forEach(r => {
      r.img.alt = t(r.p.titulo);
      
      // Limpa as tags antigas
      r.tagContainer.innerHTML = '';
      
      // Pega o campo tag. Como agora é list: true, pode ser um Array de objetos ou não.
      // Se for vazio ou indefinido, criamos um array vazio.
      let etiquetasBrutas = r.p.tag || [];
      // Garante que é sempre um Array
      if (!Array.isArray(etiquetasBrutas)) etiquetasBrutas = [etiquetasBrutas];
      
      // Para cada item, traduz e cria uma bolinha
      etiquetasBrutas.forEach(etiqueta => {
         const textoEtiqueta = t(etiqueta);
         if(textoEtiqueta) {
             const span = el('span', C.tagPill);
             span.textContent = textoEtiqueta;
             r.tagContainer.appendChild(span);
         }
      });

      r.h3.textContent = t(r.p.titulo);
      r.desc.textContent = t(r.p.descricao);
      r.span.textContent = t(r.p.botao) || padrao;
    });
  }

  // Mantém a animação de entrada ao rolar a página.
  function revelarAoRolar(itens) {
    if (!('IntersectionObserver' in window)) {
      itens.forEach(i => i.classList.add('active'));
      return;
    }
    const obs = new IntersectionObserver(entradas => {
      entradas.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('active');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    itens.forEach(i => obs.observe(i));
  }

  async function carregar() {
    const lista = document.getElementById('project-list');
    if (!lista) return;
    let projetos;
    try {
      const resp = await fetch('projetos.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      projetos = (await resp.json()).projetos;
    } catch (erro) {
      console.error('Não foi possível ler projetos.json. Os cartões fixos do HTML continuam na tela.', erro);
      return;
    }
    if (!Array.isArray(projetos) || !projetos.length) return;
    window.PROJETOS = projetos;
    refs = [];
    const cartoes = projetos.map(criarCartao);
    lista.replaceChildren(...cartoes);
    aplicarIdioma();
    revelarAoRolar(cartoes);
    document.dispatchEvent(new Event('projetos:prontos'));
  }

  // Faz a troca de idioma do site também atualizar os cartões.
  const trocarIdioma = changeLang;
  changeLang = function (lang) {
    trocarIdioma(lang);
    aplicarIdioma();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }
})();
