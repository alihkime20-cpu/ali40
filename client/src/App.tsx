import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tools from "./pages/Tools";
import ToolPage from "./pages/ToolPage";
import Knowledge from "./pages/Knowledge";
import LegalPage from "./pages/LegalPages";
import CookieConsent from "./components/CookieConsent";
import ConsentAwareAnalytics from "./components/ConsentAwareAnalytics";

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/tools" component={Tools} /><Route path="/tool/:slug" component={ToolPage} /><Route path="/knowledge/:slug" component={Knowledge} /><Route path="/knowledge" component={Knowledge} /><Route path="/about">{() => <LegalPage page="about" />}</Route><Route path="/privacy">{() => <LegalPage page="privacy" />}</Route><Route path="/terms">{() => <LegalPage page="terms" />}</Route><Route path="/cookies">{() => <LegalPage page="cookies" />}</Route><Route path="/content-policy">{() => <LegalPage page="content" />}</Route><Route path="/contact">{() => <LegalPage page="contact" />}</Route><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /><CookieConsent /><ConsentAwareAnalytics /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
