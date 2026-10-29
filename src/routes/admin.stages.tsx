import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminStages from "@/pages/AdminStages";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/stages")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin", "manager"]}>
      <AdminStages />
    </RoleGuard>
  ),
});
