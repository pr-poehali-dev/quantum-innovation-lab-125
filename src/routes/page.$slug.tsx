import { createFileRoute, notFound } from "@tanstack/react-router";
import SitePage, { fetchSitePage } from "@/pages/SitePage";

export const Route = createFileRoute("/page/$slug")({
  loader: async ({ params }) => {
    const res = await fetchSitePage(params.slug);
    if (res.status === "missing") throw notFound();
    return { page: res.status === "ok" ? res.page : null };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.page ? `${loaderData.page.title} — КонтрактКофе` : "КонтрактКофе";
    return { meta: [{ title }, { property: "og:title", content: title }] };
  },
  component: SitePageRoute,
});

function SitePageRoute() {
  const { page } = Route.useLoaderData();
  return <SitePage page={page} />;
}