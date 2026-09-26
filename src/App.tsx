
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
              <Route path="/admin/about" element={<StaffGuard><AboutAdmin /></StaffGuard>} />
              <Route path="/admin/documents" element={<StaffGuard><AdminDocuments /></StaffGuard>} />
              <Route path="/admin/rate" element={<StaffGuard><AdminRate /></StaffGuard>} />
              <Route path="/admin/calc" element={<StaffGuard><AdminCalc /></StaffGuard>} />
              <Route path="/admin/crm" element={<StaffGuard><AdminCRM /></StaffGuard>} />
              <Route path="/admin/stages" element={<StaffGuard><AdminStages /></StaffGuard>} />
              <Route path="/admin/staff" element={<StaffGuard><AdminStaff /></StaffGuard>} />
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