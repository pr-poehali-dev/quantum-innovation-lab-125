
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Cabinet from "./pages/Cabinet";
import AboutAdmin from "./pages/AboutAdmin";
import Admin from "./pages/Admin";
import AdminDocuments from "./pages/AdminDocuments";
import AdminRate from "./pages/AdminRate";
import AdminCalc from "./pages/AdminCalc";
import AdminLogin from "./pages/AdminLogin";
import AdminJoin from "./pages/AdminJoin";
import AdminCRM from "./pages/AdminCRM";
import AdminStages from "./pages/AdminStages";
import AdminStaff from "./pages/AdminStaff";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import { LeadModalProvider } from "./context/LeadModalContext";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import StaffGuard from "./components/StaffGuard";
import RoleGuard from "./components/RoleGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LeadModalProvider>
        <ClientAuthProvider>
        <StaffAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/cabinet" element={<Cabinet />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/join" element={<AdminJoin />} />
              <Route path="/admin" element={<StaffGuard><Admin /></StaffGuard>} />
              <Route path="/admin/about" element={<RoleGuard allowedRoles={["owner"]}><AboutAdmin /></RoleGuard>} />
              <Route path="/admin/documents" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminDocuments /></RoleGuard>} />
              <Route path="/admin/rate" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminRate /></RoleGuard>} />
              <Route path="/admin/calc" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminCalc /></RoleGuard>} />
              <Route path="/admin/crm" element={<RoleGuard allowedRoles={["owner", "manager", "support"]}><AdminCRM /></RoleGuard>} />
              <Route path="/admin/stages" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminStages /></RoleGuard>} />
              <Route path="/admin/staff" element={<RoleGuard allowedRoles={["owner"]}><AdminStaff /></RoleGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StaffAuthProvider>
        </ClientAuthProvider>
      </LeadModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;