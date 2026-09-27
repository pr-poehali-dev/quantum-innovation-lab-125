import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";
import StaffGuard from "@/components/StaffGuard";

type Role = "owner" | "manager" | "support";

const DeniedScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-6">
    <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
      <Icon name="Lock" size={22} className="text-destructive" />
    </div>
    <h1 className="font-serif text-xl font-bold mb-1">Доступ ограничен</h1>
    <p className="text-sm text-muted-foreground max-w-xs mb-6">
      Этот раздел недоступен для вашей роли. Обратитесь к владельцу аккаунта.
    </p>
    <Navigate to="/admin" replace />
  </div>
);

/** Пропускает внутрь только сотрудников с одной из allowedRoles ролей (после проверки авторизации StaffGuard) */
const RoleGuard = ({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) => {
  const { staff } = useStaffAuth();
  const role: Role = staff?.role || (staff?.is_owner ? "owner" : "manager");

  if (!allowedRoles.includes(role)) {
    return (
      <StaffGuard>
        <DeniedScreen />
      </StaffGuard>
    );
  }

  return <StaffGuard>{children}</StaffGuard>;
};

export default RoleGuard;
