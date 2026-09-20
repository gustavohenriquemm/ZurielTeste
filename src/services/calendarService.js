import { listenCalendarEvents } from '../../database/firestore.js?v=20260720-1';

const SUNDAY_EVENTS = [
  {
    id: 'recurring-sunday-school',
    title: 'Escolinha Dominical',
    time: '08:30',
    location: 'Sede da Igreja',
    color: '#FFC107',
    recurrence: 'sundays',
    icon: '📖',
  },
  {
    id: 'recurring-youth-rehearsal',
    title: 'Ensaio da Mocidade',
    time: '11:00',
    location: 'Sede da Igreja',
    color: '#FFC107',
    recurrence: 'sundays',
    icon: '🎶',
  },
];

const SUNDAY_SCHOOL_LESSONS = {
  '2026-07-26': {
    lessonNumber: 4,
    lessonTitle: 'As acusações dos amigos de Jó',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/07/escola-dominical-betel-conectar-licao-4.html?m=1',
  },
  '2026-08-02': {
    lessonNumber: 5,
    lessonTitle: 'Da tempestade à calmaria',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/07/escola-dominical-betel-conectar-jovens.html?m=1',
  },
  '2026-08-09': {
    lessonNumber: 6,
    lessonTitle: 'O livro de Salmos',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/08/escola-dominical-betel-conectar-jovens.html?m=1',
  },
  '2026-08-16': {
    lessonNumber: 7,
    lessonTitle: 'A pedagogia dos Salmos',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/08/escola-dominical-betel-conectar-jovens_0729497652.html?m=1',
  },
  '2026-08-23': {
    lessonNumber: 8,
    lessonTitle: 'Bom é louvar ao Senhor',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/08/escola-dominical-betel-conectar-jovens_0803230196.html?m=1',
  },
  '2026-08-30': {
    lessonNumber: 9,
    lessonTitle: 'A sabedoria de Provérbios',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/08/escola-dominical-betel-conectar-jovens_01582279350.html?m=1',
  },
  '2026-09-06': {
    lessonNumber: 10,
    lessonTitle: 'O chamado à prudência',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/08/escola-dominical-betel-conectar-jovens_0822733483.html?m=1',
  },
  '2026-09-13': {
    lessonNumber: 11,
    lessonTitle: 'Princípios éticos em Provérbios',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/09/escola-dominical-betel-conectar-jovens.html?m=1',
  },
  '2026-09-20': {
    lessonNumber: 12,
    lessonTitle: 'O livro de Eclesiastes',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/09/escola-dominical-betel-conectar-jovens_0625854845.html?m=1',
  },
  '2026-09-27': {
    lessonNumber: 13,
    lessonTitle: 'Cantares de Salomão',
    lessonUrl: 'https://marcosandreclubdateologia.blogspot.com/2026/09/escola-dominical-betel-conectar-jovens_01440264963.html?m=1',
  },
};

export function watchCalendarEvents(callback) {
  return listenCalendarEvents(callback);
}

export function getEventsForDate(date, remoteEvents = []) {
  const dateKey = toDateKey(date);
  const events = [];
  if (date.getDay() === 0) {
    const suppressedRecurringIds = new Set(
      remoteEvents
        .filter((event) => event.eventType === 'youthRehearsalOverride' && event.originalDate === dateKey)
        .map((event) => event.replacesRecurringId || 'recurring-youth-rehearsal')
    );
    events.push(...SUNDAY_EVENTS
      .filter((event) => !suppressedRecurringIds.has(event.id))
      .map((event) => ({
        ...event,
        ...(event.id === 'recurring-sunday-school' ? SUNDAY_SCHOOL_LESSONS[dateKey] : {}),
        date: dateKey,
        recurring: true,
      })));
  }
  remoteEvents.forEach((event) => {
    if (event.recurrence === 'sundays' && date.getDay() === 0) events.push(event);
    else if (event.date === dateKey) events.push(event);
  });
  return events.sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')));
}

export function getUpcomingEvents(remoteEvents = [], limit = 3, fromDate = new Date()) {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const nowKey = toDateKey(fromDate);
  const nowTime = `${String(fromDate.getHours()).padStart(2, '0')}:${String(fromDate.getMinutes()).padStart(2, '0')}`;
  const upcoming = [];

  for (let index = 0; index < 180 && upcoming.length < limit; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const dayKey = toDateKey(day);
    const events = getEventsForDate(day, remoteEvents)
      .filter((event) => dayKey > nowKey || String(event.time || '23:59') >= nowTime)
      .map((event) => ({ ...event, date: dayKey, dateObject: new Date(day) }));
    upcoming.push(...events);
    upcoming.sort(compareEvents);
    if (upcoming.length > limit) upcoming.length = limit;
  }

  return upcoming.slice(0, limit);
}

export function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function compareEvents(a, b) {
  return `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`);
}
