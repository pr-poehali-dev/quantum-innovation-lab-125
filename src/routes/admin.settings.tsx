import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminSettings from "@/pages/AdminSettings";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin"]}>
      <AdminSettings />
    </RoleGuard>
  ),
});
