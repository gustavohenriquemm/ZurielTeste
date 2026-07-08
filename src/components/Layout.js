import { icon } from './icons.js?v=20260708-5';
import { listenNotices } from '../../database/firestore.js?v=20260708-26';

let noticesUnsubscribe;
let activeNotices = [];

export function renderLayout(root, activeRoute, navigate) {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <button class="icon-button top-icon" data-menu-toggle title="Menu" aria-label="Menu">
          ${icon('menu')}
        </button>
        <button class="brand-title" data-route="home" title="Inicio">MOCIDADE ZURIEL</button>
        <nav class="top-actions" aria-label="Navegacao principal">
          <button class="icon-button top-icon notice-button" data-notices title="Avisos">${icon('bell')}<span class="notice-badge hidden" data-notice-badge>0</span></button>
          <button class="icon-button admin-shortcut" data-route="admin" title="Painel administrativo">${icon('user')}</button>
        </nav>
      </header>
      <div class="drawer-overlay hidden" data-drawer-overlay></div>
      <aside class="side-drawer" data-side-drawer>
        <strong>Mocidade Zuriel</strong>
        <button data-route="home">${icon('home')} Inicio</button>
        <button data-route="mocidade">${icon('music')} Hinos da Mocidade</button>
        <button data-route="harpa">${icon('harp')} Hinos da Harpa</button>
        <button data-route="bible">${icon('book')} Biblia</button>
        <button data-route="calendar">${icon('calendar')} Calendario</button>
        <button data-route="admin">${icon('user')} Perfil/Admin</button>
      </aside>
      <main class="main" data-main data-active-route="${activeRoute}"></main>
      <nav class="bottom-nav" aria-label="Navegacao inferior">
        <button class="${activeRoute === 'home' ? 'active' : ''}" data-route="home">${icon('home')}<span>Inicio</span></button>
        <button class="${activeRoute === 'calendar' ? 'active' : ''}" data-route="calendar">${icon('calendar')}<span>Agenda</span></button>
        <button class="${activeRoute === 'bible' ? 'active' : ''}" data-route="bible">${icon('book')}<span>Biblia</span></button>
        <button class="${activeRoute === 'admin' ? 'active' : ''}" data-route="admin">${icon('user')}<span>Perfil</span></button>
      </nav>
      <div class="modal-screen hidden" data-public-modal-screen>
        <section class="app-modal notice-modal" data-public-notice-modal></section>
      </div>
    </div>
  `;

  root.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });
  bindMenu(root);
  bindNotices(root);
}

function bindMenu(root) {
  const drawer = root.querySelector('[data-side-drawer]');
  const overlay = root.querySelector('[data-drawer-overlay]');
  const setOpen = (open) => {
    drawer.classList.toggle('open', open);
    overlay.classList.toggle('hidden', !open);
  };
  root.querySelector('[data-menu-toggle]').addEventListener('click', () => setOpen(!drawer.classList.contains('open')));
  overlay.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => setOpen(false)));
}

function bindNotices(root) {
  const badge = root.querySelector('[data-notice-badge]');
  const button = root.querySelector('[data-notices]');
  const screen = root.querySelector('[data-public-modal-screen]');
  const modal = root.querySelector('[data-public-notice-modal]');

  const renderBadge = () => {
    badge.textContent = String(activeNotices.length);
    badge.classList.toggle('hidden', activeNotices.length === 0);
    button.classList.toggle('has-notices', activeNotices.length > 0);
    button.setAttribute('aria-label', activeNotices.length ? `${activeNotices.length} aviso(s)` : 'Avisos');
  };
  const closeNotices = () => {
    screen.classList.add('hidden');
    document.body.classList.remove('modal-open');
  };
  const openNotices = (markAsSeen = false) => {
    modal.innerHTML = `
      <header>
        <h2>Aviso</h2>
      </header>
      <div class="notice-list">
        ${activeNotices.length ? activeNotices.map((notice) => `
          <article>
            <strong>${escapeHtml(notice.title || 'Aviso Importante')}</strong>
            <p>${escapeHtml(notice.message || '')}</p>
          </article>
        `).join('') : '<article><strong>Nenhum aviso ativo</strong><p>Quando houver um aviso da igreja, ele aparecera aqui.</p></article>'}
      </div>
      <div class="form-actions">
        <button class="plain-button" data-close-notice>Fechar</button>
        <button class="primary-button" data-close-notice>Entendi</button>
      </div>
    `;
    screen.classList.remove('hidden');
    document.body.classList.add('modal-open');
    modal.querySelectorAll('[data-close-notice]').forEach((item) => item.addEventListener('click', () => {
      if (markAsSeen) sessionStorage.setItem(getNoticeSeenKey(activeNotices), 'true');
      closeNotices();
    }));
  };

  screen.addEventListener('click', (event) => {
    if (event.target === screen) closeNotices();
  });
  button.addEventListener('click', () => openNotices(true));
  renderBadge();
  if (shouldAutoOpenNotices(activeNotices)) openNotices(true);
  noticesUnsubscribe?.();
  noticesUnsubscribe = listenNotices((notices) => {
    activeNotices = notices.filter(isNoticeActive);
    renderBadge();
    if (shouldAutoOpenNotices(activeNotices)) openNotices(true);
  });
}

function isNoticeActive(notice) {
  if (notice.active === false || notice.active === 'false') return false;
  const today = getLocalDateKey();
  const expiresAt = normalizeDateKey(notice.expiresAt);
  if (expiresAt && expiresAt < today) return false;
  return true;
}

function shouldAutoOpenNotices(notices) {
  return notices.length > 0 && sessionStorage.getItem(getNoticeSeenKey(notices)) !== 'true';
}

function getNoticeSeenKey(notices) {
  const signature = notices
    .map((notice) => `${notice.id || 'notice'}-${notice.updatedAt || ''}`)
    .sort()
    .join('|');
  return `zuriel:notices-seen:${signature}`;
}

function getLocalDateKey() {
  const now = new Date();
  return toDateKey(now);
}

function normalizeDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (typeof value?.toDate === 'function') return toDateKey(value.toDate());
  if (value instanceof Date) return toDateKey(value);
  return '';
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
