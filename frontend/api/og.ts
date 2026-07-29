export const config = { runtime: 'edge' };

// PartnR is a SPA: crawlers fetching /events/:id only ever see an empty
// index.html, so shared links render bare. vercel.json routes known
// link-preview bots here instead, and this function returns a minimal
// HTML document carrying the event's Open Graph / Twitter tags.

const API_BASE = 'https://partnr-p3rv.onrender.com';

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  city: string;
  location: string | null;
  date: string;
  photoUrl: string | null;
  activityName: string;
  activityIcon: string;
  participantCount: number;
  maxParticipants: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(opts: { title: string; description: string; image: string; url: string }): Response {
  const { title, description, image, url } = opts;
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PartnR">
<meta property="og:locale" content="fr_FR">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<link rel="canonical" href="${escapeHtml(url)}">
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${escapeHtml(url)}">Voir l'événement sur PartnR</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Previews are cached by the platforms anyway; keep it short so an
      // edited event refreshes reasonably fast.
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  // Derive the public origin from the request so previews and custom
  // domains produce correct absolute URLs.
  const site = `${url.protocol}//${request.headers.get('x-forwarded-host') ?? url.host}`;
  const fallbackImage = `${site}/og-default.png`;
  const eventUrl = id ? `${site}/events/${id}` : site;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return page({
      title: 'PartnR — Trouvez votre partenaire d’activité',
      description:
        'Course à pied, resto, concert, expo… PartnR vous connecte avec des gens près de chez vous qui partagent vos envies.',
      image: fallbackImage,
      url: site,
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/events/${id}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);

    const ev = (await response.json()) as EventDetail;

    const when = new Date(ev.date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });
    const where = ev.location ? `${ev.city} — ${ev.location}` : ev.city;
    const spots = Math.max(0, ev.maxParticipants - ev.participantCount);
    const seats = spots > 0 ? `${spots} place${spots > 1 ? 's' : ''} restante${spots > 1 ? 's' : ''}` : 'Complet';

    return page({
      title: `${ev.activityIcon} ${ev.title} — PartnR`,
      description: `${when} · ${where} · ${seats}${ev.description ? ` — ${ev.description}` : ''}`,
      image: ev.photoUrl || fallbackImage,
      url: eventUrl,
    });
  } catch {
    // Backend asleep (Render free tier) or event gone: still return a
    // branded preview rather than a bare link.
    return page({
      title: 'Un événement vous attend sur PartnR',
      description:
        'Rejoignez une activité près de chez vous : course à pied, resto, concert, expo…',
      image: fallbackImage,
      url: eventUrl,
    });
  }
}
