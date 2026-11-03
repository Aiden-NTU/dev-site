import type { Env } from "../env";

export type HitInput = {
  path: string;
  title?: string;
  projectId?: string | null;
  country?: string | null;
};

export async function recordHit(env: Env, hit: HitInput) {
  const id = crypto.randomUUID();
  const now = Date.now();
  const path = hit.path.slice(0, 500);
  const title = (hit.title ?? "").slice(0, 200);
  const projectId = hit.projectId || null;
  const country = (hit.country || "XX").slice(0, 8);

  await env.DB.prepare(
    `INSERT INTO page_hits (id, path, title, project_id, country, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, path, title, projectId, country, now)
    .run();

  if (projectId) {
    await env.DB.prepare(
      `INSERT INTO project_views (project_id, views, updated_at)
       VALUES (?, 1, ?)
       ON CONFLICT(project_id) DO UPDATE SET
         views = views + 1,
         updated_at = excluded.updated_at`,
    )
      .bind(projectId, now)
      .run();
  }
}

export async function analyticsSummary(env: Env) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const [today, countries, recent, topProjects] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as c FROM page_hits WHERE created_at >= ?`).bind(dayAgo).first<{ c: number }>(),
    env.DB.prepare(
      `SELECT country, COUNT(*) as c FROM page_hits
       WHERE created_at >= ? AND country IS NOT NULL AND country != ''
       GROUP BY country ORDER BY c DESC LIMIT 12`,
    )
      .bind(dayAgo)
      .all<{ country: string; c: number }>(),
    env.DB.prepare(
      `SELECT path, title, country, created_at FROM page_hits
       ORDER BY created_at DESC LIMIT 12`,
    ).all<{ path: string; title: string | null; country: string | null; created_at: number }>(),
    env.DB.prepare(
      `SELECT project_id, views FROM project_views ORDER BY views DESC LIMIT 8`,
    ).all<{ project_id: string; views: number }>(),
  ]);

  return {
    hits24h: today?.c ?? 0,
    countries: countries.results ?? [],
    recent: recent.results ?? [],
    topProjects: topProjects.results ?? [],
  };
}

/** Rough lat/lon centroids for map dots (ISO country → [lon, lat]). */
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [-98, 39],
  GB: [-2, 54],
  IE: [-8, 53],
  DE: [10, 51],
  FR: [2, 46],
  NL: [5, 52],
  BE: [4.5, 50.5],
  ES: [-3, 40],
  IT: [12, 42],
  PT: [-8, 39.5],
  SE: [15, 62],
  NO: [9, 61],
  DK: [10, 56],
  FI: [26, 64],
  PL: [19, 52],
  CZ: [15, 50],
  AT: [14, 47.5],
  CH: [8, 47],
  CA: [-100, 56],
  MX: [-102, 23],
  BR: [-52, -14],
  AR: [-64, -34],
  AU: [134, -25],
  NZ: [174, -41],
  JP: [138, 36],
  KR: [128, 36],
  CN: [104, 35],
  IN: [78, 22],
  SG: [104, 1.3],
  HK: [114, 22],
  TW: [121, 24],
  AE: [54, 24],
  SA: [45, 24],
  ZA: [25, -29],
  NG: [8, 10],
  EG: [30, 27],
  TR: [35, 39],
  RU: [100, 60],
  UA: [32, 49],
  IL: [35, 31],
};
