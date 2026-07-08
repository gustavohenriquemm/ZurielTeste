import { getEventsForDate, getMonthDays, toDateKey, formatDate, watchCalendarEvents } from '../services/calendarService.js';

export function renderCalendar(root) {
  const today = new Date();
  let current = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = new Date(today);
  let remoteEvents = [];

  root.innerHTML = `
    <section class="panel calendar-panel">
      <div class="section-header">
        <div>
          <h1>Calendario</h1>
          <p>Eventos da Mocidade Zuriel.</p>
        </div>
      </div>
      <div data-calendar></div>
    </section>
  `;

  const calendar = root.querySelector('[data-calendar]');
  const stop = watchCalendarEvents((events) => {
    remoteEvents = events;
    draw();
  });
  root.dataset.cleanup = stop ? 'watching' : '';

  function draw() {
    const days = getMonthDays(current.getFullYear(), current.getMonth());
    const selectedEvents = getEventsForDate(selected, remoteEvents);
    calendar.innerHTML = `
      <div class="calendar-toolbar">
        <button class="plain-button" data-prev>Anterior</button>
        <h2>${current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <button class="plain-button" data-next>Proximo</button>
      </div>
      <div class="calendar-weekdays">
        ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => `<span>${day}</span>`).join('')}
      </div>
      <div class="calendar-grid">
        ${days.map((day) => {
          const events = getEventsForDate(day, remoteEvents);
          const inMonth = day.getMonth() === current.getMonth();
          const active = toDateKey(day) === toDateKey(selected);
          return `
            <button class="calendar-day ${inMonth ? '' : 'muted'} ${active ? 'active' : ''}" data-date="${toDateKey(day)}">
              <strong>${day.getDate()}</strong>
              ${events.length ? `<span>${events.length}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
      <div class="day-events">
        <h3>${formatDate(selected)}</h3>
        ${selectedEvents.length
          ? selectedEvents.map((event) => `
            <article class="calendar-event" style="--event-color:${event.color || '#FFC107'}">
              <time>${event.time || '--:--'}</time>
              <div>
                <strong>${escapeHtml(event.icon || '')} ${escapeHtml(event.title || event.description || 'Evento')}</strong>
                <span>${escapeHtml(event.location || 'Local nao informado')}</span>
                ${event.notes ? `<small>${escapeHtml(event.notes)}</small>` : ''}
              </div>
            </article>
          `).join('')
          : '<p class="empty">Nenhum evento para este dia.</p>'}
      </div>
    `;

    calendar.querySelector('[data-prev]').addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      draw();
    });
    calendar.querySelector('[data-next]').addEventListener('click', () => {
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      draw();
    });
    calendar.querySelectorAll('[data-date]').forEach((button) => {
      button.addEventListener('click', () => {
        selected = parseDateKey(button.dataset.date);
        current = new Date(selected.getFullYear(), selected.getMonth(), 1);
        draw();
      });
    });
  }

  draw();
}

function parseDateKey(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}
