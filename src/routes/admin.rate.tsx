import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminRate from "@/pages/AdminRate";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/rate")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin", "manager"]}>
      <AdminRate />
    </RoleGuard>
  ),
});
