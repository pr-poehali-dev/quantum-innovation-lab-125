import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import AdminContacts from "@/pages/AdminContacts";
import RoleGuard from "@/components/RoleGuard";

export const Route = createFileRoute("/admin/contacts")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <RoleGuard allowedRoles={["owner", "super_admin", "manager", "support"]}>
      <AdminContacts />
    </RoleGuard>
  ),
});
