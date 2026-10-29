import { createContext, useContext, type ReactNode } from "react";
const ABOUT_URL = "https://functions.poehali.dev/6745925c-6a25-46f5-aaa1-d8cd4e266142";

// Публичные данные главной страницы: загружаются в loader маршрута "/",
// чтобы блоки рендерились на сервере уже с контентом из админки.
export interface HomeData {
  sections: Record<string, unknown>;
  content: { content?: { title?: string; subtitle?: string; bottom_text?: string; logo_url?: string }; photos?: unknown[] } | null;
  rate: { rate?: number; updated_at?: string } | null;
  pages: { pages?: { slug: string; title: string; show_in_footer: boolean }[] } | null;
  team: { members?: unknown[] } | null;
  calc: Record<string, unknown> | null;
}

const SECTION_KEYS = ["hero", "workflow", "features", "cta", "footer", "contacts", "team", "about_stats", "consent"];

const getJson = (headers: Record<string, string>): Promise<unknown> =>
  fetch(ABOUT_URL, { headers })
    .then(r => r.json())
    .catch(() => null);

export async function loadHomeData(): Promise<HomeData> {
  const [sectionList, content, rate, pages, team, calc] = await Promise.all([
    Promise.all(
      SECTION_KEYS.map(key =>
        getJson({ "X-Action": "get-sections", "X-Section-Key": key }).then(d => [key, (d as { data?: unknown } | null)?.data ?? null] as const),
      ),
    ),
    getJson({ "X-Action": "get-content" }),
    getJson({ "X-Action": "get-rate" }),
    getJson({ "X-Action": "get-site-pages" }),
    getJson({ "X-Action": "get-team" }),
    getJson({ "X-Action": "get-calc" }),
  ]);
  const sections: Record<string, unknown> = {};
  for (const [key, value] of sectionList) sections[key] = value;
  return {
    sections,
    content: content as HomeData["content"],
    rate: rate as HomeData["rate"],
    pages: pages as HomeData["pages"],
    team: team as HomeData["team"],
    calc: calc as HomeData["calc"],
  };
}

const HomeDataContext = createContext<HomeData | null>(null);

export const HomeDataProvider = ({ data, children }: { data: HomeData; children: ReactNode }) => (
  <HomeDataContext.Provider value={data}>{children}</HomeDataContext.Provider>
);

export const useHomeData = () => useContext(HomeDataContext);
