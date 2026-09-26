import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStaffAuth } from "@/context/StaffAuthContext";

const StaffGuard = ({ children }: { children: ReactNode }) => {
  const { staff, loading } = useStaffAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!staff) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
};

export default StaffGuard;
