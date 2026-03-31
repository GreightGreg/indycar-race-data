const TAB_SLUG_MAP: Record<string, string> = {
  'Race Results': 'race-results',
  'Session Results': 'session-results',
  'Position Chart': 'position-chart',
  'Laps Led': 'laps-led',
  'Head to Head': 'head-to-head',
  'Pit Strategy': 'pit-strategy',
  'Track Dominance': 'track-dominance',
  'Season Stats': 'season-stats',
  'Championship': 'championship',
};

const SLUG_TAB_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUG_MAP).map(([k, v]) => [v, k])
);

export function tabToSlug(tabName: string): string {
  return TAB_SLUG_MAP[tabName] || tabName.toLowerCase().replace(/\s+/g, '-');
}

export function slugToTab(slug: string): string {
  return SLUG_TAB_MAP[slug] || slug;
}

export function parseDeepLink(): { year?: number; round?: number; tab?: string; section?: string } {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return {};

  const parts = hash.split('/');
  const result: { year?: number; round?: number; tab?: string; section?: string } = {};

  for (let i = 0; i < parts.length - 1; i += 2) {
    const key = parts[i];
    const val = parts[i + 1];
    if (key === 'year') result.year = parseInt(val);
    else if (key === 'round') result.round = parseInt(val);
    else if (key === 'tab') result.tab = val;
    else if (key === 'section') result.section = val;
  }

  return result;
}

export function buildDeepLink(year: number, round: number, tab: string, section?: string): string {
  const slug = TAB_SLUG_MAP[tab] || tab;
  let path = `#/year/${year}/round/${round}/tab/${slug}`;
  if (section) path += `/section/${section}`;
  return `${window.location.origin}${window.location.pathname}${path}`;
}

export async function copyDeepLink(url: string): Promise<void> {
  await navigator.clipboard.writeText(url);
}
