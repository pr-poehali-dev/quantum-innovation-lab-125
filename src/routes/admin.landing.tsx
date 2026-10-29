import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminLanding from "@/pages/AdminLanding";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/landing")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin"]}>
      <AdminLanding />
    </RoleGuard>
  ),
});
