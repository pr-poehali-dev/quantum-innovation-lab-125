
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
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";
import { LeadModalProvider } from "./context/LeadModalContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LeadModalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/about" element={<AboutAdmin />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/rate" element={<AdminRate />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LeadModalProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;