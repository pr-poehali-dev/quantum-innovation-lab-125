import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminCalc from "@/pages/AdminCalc";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/calc")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin", "manager"]}>
      <AdminCalc />
    </RoleGuard>
  ),
});
