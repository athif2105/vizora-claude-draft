import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ExtensionBridge from "./components/ExtensionBridge";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import FunnelVisualizationPage from "./pages/FunnelVisualizationPage";
import VisualizationPage from "./pages/VisualizationPage";
import DataAnalysisPage from "./pages/DataAnalysisPage";
import SharedFunnelPage from "./pages/SharedFunnelPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <ExtensionBridge />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/funnel"
                  element={
                    <ProtectedRoute>
                      <FunnelVisualizationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/visualization"
                  element={
                    <ProtectedRoute>
                      <VisualizationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analysis"
                  element={
                    <ProtectedRoute>
                      <DataAnalysisPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/shared/:shareId" element={<SharedFunnelPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;