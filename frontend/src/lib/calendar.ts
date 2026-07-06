import type { EventDetail } from '../types';

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function downloadIcs(event: EventDetail) {
  const start = new Date(event.date);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const location = [event.location, event.city].filter(Boolean).join(', ');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PartnR//FR',
    'BEGIN:VEVENT',
    `UID:${event.id}@partnr`,
    `DTSTAMP:${icsDate(new Date(event.createdAt))}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(event.title)}`,
    location ? `LOCATION:${icsEscape(location)}` : '',
    event.description ? `DESCRIPTION:${icsEscape(event.description)}` : '',
    event.latitude != null && event.longitude != null ? `GEO:${event.latitude};${event.longitude}` : '',
    `URL:${window.location.origin}/events/${event.id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'evenement'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareEvent(event: EventDetail): Promise<'shared' | 'copied'> {
  const url = `${window.location.origin}/events/${event.id}`;
  const data = { title: `${event.title} — PartnR`, text: `Rejoins-moi sur PartnR : ${event.title}`, url };
  if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    await navigator.share(data);
    return 'shared';
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
