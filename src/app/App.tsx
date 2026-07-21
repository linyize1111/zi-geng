import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@/features/settings/ThemeProvider";
import { AppRouter } from "@/routes/AppRouter";
import { assertMockPolicy } from "@/lib/env";

assertMockPolicy();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HashRouter>
          <AppRouter />
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
