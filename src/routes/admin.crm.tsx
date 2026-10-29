import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminCRM from "@/pages/AdminCRM";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/crm")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin", "manager", "support"]}>
      <AdminCRM />
    </RoleGuard>
  ),
});
