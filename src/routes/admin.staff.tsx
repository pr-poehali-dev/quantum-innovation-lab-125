import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminStaff from "@/pages/AdminStaff";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/staff")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner"]}>
      <AdminStaff />
    </RoleGuard>
  ),
});
