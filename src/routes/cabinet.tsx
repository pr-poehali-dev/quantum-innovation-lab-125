import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import Cabinet from "@/pages/Cabinet";

export const Route = createFileRoute("/cabinet")({
  ssr: false,
  pendingComponent: RoutePending,
  component: Cabinet,
});
