import { createFileRoute } from "@tanstack/react-router";
import AdminJoin from "@/pages/AdminJoin";
import RoutePending from "@/components/RoutePending";

// Проверка приглашения — личный одноразовый токен из ссылки, страница рендерится в браузере
export const Route = createFileRoute("/admin/join")({
  ssr: false,
  pendingComponent: RoutePending,
  component: AdminJoin,
});