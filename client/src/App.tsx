import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import NewsDetail from "./pages/NewsDetail";
import LegalPage from "./pages/LegalPages";
import CookieConsent from "./components/CookieConsent";
import ConsentAwareAnalytics from "./components/ConsentAwareAnalytics";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/news/:slug"} component={NewsDetail} />
      <Route path={"/about"}>{() => <LegalPage page="about" />}</Route>
      <Route path={"/privacy"}>{() => <LegalPage page="privacy" />}</Route>
      <Route path={"/terms"}>{() => <LegalPage page="terms" />}</Route>
      <Route path={"/content-policy"}>{() => <LegalPage page="content" />}</Route>
      <Route path={"/contact"}>{() => <LegalPage page="contact" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
          <ConsentAwareAnalytics />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
