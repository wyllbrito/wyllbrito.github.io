// Aplica os textos gerais do site (apresentação, sobre mim, contato) a partir de textos.json.
// Os textos escritos no index.html continuam como reserva caso este arquivo não carregue.
(function () {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const comDestaque = (ini, dest, fim) =>
    esc(ini) + ' <span class="text-accent">' + esc(dest) + '</span>' + (fim ? ' ' + esc(fim) : '');

  function aplicar(d) {
    ['pt', 'en'].forEach(l => {
      const T = translations[l];
      // Texto no idioma; se faltar a tradução, usa o português.
      const g = c => (c && (c[l] || c.pt)) || '';
      // Só substitui se houver texto; "html" indica que o valor já foi montado com segurança.
      const por = (chave, valor, html) => { if (valor) T[chave] = html ? valor : esc(valor); };

      const h = d.hero || {}, s = d.sobre || {}, f = d.ficha || {}, ct = d.contato || {};
      const fo = f.formacao || {};

      por('hero-tag', g(h.tag));
      por('hero-desc', g(h.descricao));
      por('hero-status-desc', g(h.atualmente));
      por('hero-base-desc', g(h.base));
      por('hero-avail-desc', g(h.disponibilidade));

      if (g(s.titulo_inicio) || g(s.titulo_destaque)) {
        por('about-title', comDestaque(g(s.titulo_inicio), g(s.titulo_destaque)), true);
      }
      for (let i = 1; i <= 5; i++) por('about-p' + i, g(s['paragrafo' + i]));

      por('info-name-val', g(f.nome));
      por('info-age-val', g(f.idade));
      por('info-base-val', g(f.local));
      por('info-lang-val', g(f.idiomas));
      por('info-nat-val', g(f.nacionalidade));
      if (g(fo.curso)) {
        por('info-edu-val',
          esc(g(fo.curso)) +
          '<br><span class="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal block">' +
          esc(g(fo.detalhe)) + '</span>' + esc(g(fo.certificado)), true);
      }

      if (g(ct.titulo_inicio) || g(ct.titulo_destaque)) {
        por('contact-title', comDestaque(g(ct.titulo_inicio), g(ct.titulo_destaque), g(ct.titulo_fim)), true);
      }
      por('contact-desc', g(ct.descricao));
    });
  }

  async function carregar() {
    try {
      const resp = await fetch('textos.json', { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      aplicar(await resp.json());
      changeLang(currentLang); // redesenha os textos já com os valores novos
    } catch (erro) {
      console.error('Não foi possível ler textos.json. Os textos fixos do HTML continuam na tela.', erro);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }
})();
