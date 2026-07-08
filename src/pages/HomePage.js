import { icon } from '../components/icons.js?v=20260708-5';

export function renderHome(root, navigate) {
  const cards = [
    { route: 'mocidade', image: '/img/mocidade.jpg?v=3', icon: icon('music'), titleTop: 'Hinos da', titleMain: 'MOCIDADE' },
    { route: 'harpa', image: '/img/harpa.jpg?v=3', icon: icon('harp'), titleTop: 'Hinos da', titleMain: 'HARPA' },
    { route: 'bible', image: '/img/biblia.jpg?v=3', icon: icon('book'), titleTop: 'Biblia', titleMain: 'SAGRADA' },
    { route: 'calendar', image: '/img/calendario.jpg?v=3', icon: icon('calendar'), titleTop: 'Calendario', titleMain: 'ZURIEL' },
  ];

  root.innerHTML = `
    <section class="home-premium fade-in">
      <div class="banner-card">
        <img src="img/bannerzuriel.png" alt="Banner Mocidade Zuriel">
      </div>

      <div class="quick-title">
        <span></span>
        <h1>Acessos rapidos</h1>
      </div>

      <section class="quick-grid" aria-label="Acessos rapidos">
        ${cards.map((card) => `
          <button class="quick-card" data-route="${card.route}" style="--card-image: url('${card.image}')">
            <span class="quick-overlay"></span>
            <span class="quick-icon">${card.icon}</span>
            <span class="quick-copy">
              <strong><span>${card.titleTop}</span><b>${card.titleMain}</b></strong>
              <small>Clique para acessar <span class="inline-arrow">${icon('arrow')}</span></small>
            </span>
          </button>
        `).join('')}
      </section>

      <section class="events-section">
        <div class="events-heading">
          <h2>Proximos Eventos</h2>
          <button type="button">Ver todos</button>
        </div>
        <article class="event-card">
          <div class="event-date">
            <strong>18</strong>
            <span>MAI</span>
          </div>
          <div class="event-info">
            <h3>Ensaio Geral</h3>
            <p>19:00</p>
            <small>Sede da Igreja</small>
          </div>
        </article>
      </section>
    </section>
  `;

  root.querySelectorAll('[data-route]').forEach((button) => {
    button.addEventListener('click', () => navigate(button.dataset.route));
  });
}
