
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Cabinet from "./pages/Cabinet";
import AboutAdmin from "./pages/AboutAdmin";
import AdminLanding from "./pages/AdminLanding";
import Admin from "./pages/Admin";
import AdminPages from "./pages/AdminPages";
import AdminRate from "./pages/AdminRate";
import AdminCalc from "./pages/AdminCalc";
import AdminLogin from "./pages/AdminLogin";
import AdminJoin from "./pages/AdminJoin";
import AdminCRM from "./pages/AdminCRM";
import AdminStages from "./pages/AdminStages";
import AdminStaff from "./pages/AdminStaff";
import AdminSettings from "./pages/AdminSettings";
import SitePage from "./pages/SitePage";
import NotFound from "./pages/NotFound";
import { LeadModalProvider } from "./context/LeadModalContext";
import { StaffAuthProvider } from "./context/StaffAuthContext";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import StaffGuard from "./components/StaffGuard";
import RoleGuard from "./components/RoleGuard";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
              <Route path="/page/:slug" element={<SitePage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/join" element={<AdminJoin />} />
              <Route path="/admin" element={<StaffGuard><Admin /></StaffGuard>} />
              <Route path="/admin/about" element={<RoleGuard allowedRoles={["owner"]}><AboutAdmin /></RoleGuard>} />
              <Route path="/admin/landing" element={<RoleGuard allowedRoles={["owner"]}><AdminLanding /></RoleGuard>} />
              <Route path="/admin/pages" element={<RoleGuard allowedRoles={["owner"]}><AdminPages /></RoleGuard>} />
              <Route path="/admin/rate" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminRate /></RoleGuard>} />
              <Route path="/admin/calc" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminCalc /></RoleGuard>} />
              <Route path="/admin/crm" element={<RoleGuard allowedRoles={["owner", "manager", "support"]}><AdminCRM /></RoleGuard>} />
              <Route path="/admin/stages" element={<RoleGuard allowedRoles={["owner", "manager"]}><AdminStages /></RoleGuard>} />
              <Route path="/admin/staff" element={<RoleGuard allowedRoles={["owner"]}><AdminStaff /></RoleGuard>} />
              <Route path="/admin/settings" element={<RoleGuard allowedRoles={["owner"]}><AdminSettings /></RoleGuard>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </StaffAuthProvider>
        </ClientAuthProvider>
      </LeadModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;