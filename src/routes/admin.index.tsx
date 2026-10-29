import { createFileRoute } from "@tanstack/react-router";
import RoutePending from "@/components/RoutePending";
import Admin from "@/pages/Admin";
import StaffGuard from "@/components/StaffGuard";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  pendingComponent: RoutePending,
  component: () => (
    <StaffGuard>
      <Admin />
    </StaffGuard>
  ),
});
