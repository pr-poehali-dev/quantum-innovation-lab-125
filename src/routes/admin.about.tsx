import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AboutAdmin from "@/pages/AboutAdmin";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/about")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin"]}>
      <AboutAdmin />
    </RoleGuard>
  ),
});
