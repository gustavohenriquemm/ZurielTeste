import { icon } from '../components/icons.js?v=20260708-5';
import { getHymns, watchHymns } from '../services/hymnService.js';

export async function renderHymnal(root, collection, navigate, route = collection) {
  const title = collection === 'harpa' ? 'Hinos da Harpa' : 'Hinos da Mocidade';
  const baseHymns = await getHymns(collection);
  let remoteHymns = [];
  let hymns = mergeHymns(baseHymns, remoteHymns);
  const selectedId = route.includes(':') ? decodeURIComponent(route.split(':').slice(1).join(':')) : '';

  root.innerHTML = `
    <section class="panel hymnal-panel">
      <div class="section-header">
        <div>
          <h1>${title}</h1>
          <p>${selectedId ? 'Letra completa do hino selecionado.' : 'Lista de titulos. Escolha um hino para abrir a letra.'}</p>
        </div>
        ${selectedId ? `<button class="plain-button" data-back-list>Voltar</button>` : ''}
      </div>
      <div data-hymnal-body><p class="empty">Carregando...</p></div>
    </section>
  `;

  const body = root.querySelector('[data-hymnal-body]');

  function renderCurrent() {
    hymns = mergeHymns(baseHymns, remoteHymns);
    const id = location.hash.replace('#', '').split(':').slice(1).join(':') || selectedId;
    id ? renderDetail(id) : renderList();
  }

  const stopWatch = watchHymns(collection, (items) => {
    remoteHymns = items;
    renderCurrent();
  });
  root.dataset.cleanup = stopWatch ? 'watching' : '';

  function renderList() {
    body.innerHTML = `
      <div class="toolbar compact">
        <div class="field">
          <label for="search">Pesquisar</label>
          <input id="search" placeholder="Digite numero ou titulo">
        </div>
      </div>
      <div class="hymn-title-list" data-list></div>
    `;
    const input = body.querySelector('#search');
    const list = body.querySelector('[data-list]');
    const draw = () => {
      const query = normalize(input.value);
      const items = hymns.filter((hymn) => !query || String(hymn.number).includes(query) || normalize(hymn.title).includes(query));
      list.innerHTML = items.length
        ? items.map((hymn) => `
          <button class="hymn-row" data-id="${escapeAttr(hymn.id)}">
            <span><b>${String(hymn.number).padStart(3, '0')}</b> - ${escapeHtml(hymn.title)}</span>
            ${icon('arrow')}
          </button>
        `).join('')
        : '<p class="empty">Nenhum hino encontrado.</p>';
      list.querySelectorAll('[data-id]').forEach((button) => {
        button.addEventListener('click', () => navigate(`${collection}:${button.dataset.id}`));
      });
    };
    input.addEventListener('input', draw);
    draw();
  }

  function renderDetail(id) {
    const selected = hymns.find((hymn) => hymn.id === id) || hymns.find((hymn) => String(hymn.number) === String(id));
    if (!selected) {
      body.innerHTML = '<p class="empty">Hino nao encontrado.</p>';
      return;
    }
    const index = hymns.findIndex((hymn) => hymn.id === selected.id);
    const prev = hymns[index - 1];
    const next = hymns[index + 1];
    body.innerHTML = `
      <article class="hymn-detail">
        <button class="plain-button" data-back-list>Voltar</button>
        <header>
          <span>Hino ${String(selected.number).padStart(3, '0')}</span>
          <h2>${escapeHtml(selected.title)}</h2>
        </header>
        <div class="lyrics">${escapeHtml(selected.lyrics)}</div>
        <nav class="detail-nav">
          <button class="plain-button" ${prev ? `data-go="${escapeAttr(prev.id)}"` : 'disabled'}>Anterior</button>
          <button class="primary-button" ${next ? `data-go="${escapeAttr(next.id)}"` : 'disabled'}>Proximo</button>
        </nav>
      </article>
    `;
    body.querySelectorAll('[data-back-list]').forEach((button) => button.addEventListener('click', () => navigate(collection)));
    body.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(`${collection}:${button.dataset.go}`)));
  }

  root.querySelectorAll('[data-back-list]').forEach((button) => button.addEventListener('click', () => navigate(collection)));
  renderCurrent();
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mergeHymns(baseHymns, remoteHymns) {
  const byKey = new Map();
  baseHymns.forEach((hymn) => byKey.set(hymn.id || String(hymn.number), hymn));
  remoteHymns.filter(isValidRemoteHymn).forEach((hymn) => {
    const key = hymn.id || `${hymn.category || 'hymn'}-${hymn.number}`;
    const sameNumber = [...byKey.entries()].find(([, item]) => Number(item.number) === Number(hymn.number));
    if (sameNumber) byKey.delete(sameNumber[0]);
    byKey.set(key, hymn);
  });
  return [...byKey.values()].sort((a, b) => Number(a.number) - Number(b.number));
}

function isValidRemoteHymn(hymn) {
  const suffix = String(hymn.id || '').match(/-(\d+)$/)?.[1];
  return !suffix || Number(suffix) === Number(hymn.number);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
