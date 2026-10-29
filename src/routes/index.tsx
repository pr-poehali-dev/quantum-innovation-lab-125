import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import { HomeDataProvider, loadHomeData } from "@/lib/homeData";

export const Route = createFileRoute("/")({
  loader: () => loadHomeData(),
  component: IndexRoute,
});

function IndexRoute() {
  const data = Route.useLoaderData();
  return (
    <HomeDataProvider data={data}>
      <Index />
    </HomeDataProvider>
  );
}
