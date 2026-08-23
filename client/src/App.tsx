import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LegalPage from "./pages/LegalPages";
import CookieConsent from "./components/CookieConsent";
import ConsentAwareAnalytics from "./components/ConsentAwareAnalytics";
import { BloodPage, CampaignDetailsPage, CommunityLayout, CreateCampaignPage, HomePage, ProfilePage, VolunteerPage } from "./pages/CommunityPages";

function Router() {
  return <Switch>
    <Route path="/" component={HomePage} />
    <Route path="/blood" component={BloodPage} />
    <Route path="/volunteer" component={VolunteerPage} />
    <Route path="/publish/:section" component={CreateCampaignPage} />
    <Route path="/create" component={CreateCampaignPage} />
    <Route path="/campaign/:id" component={CampaignDetailsPage} />
    <Route path="/profile" component={ProfilePage} />
    <Route path="/about">{() => <LegalPage page="about" />}</Route>
    <Route path="/privacy">{() => <LegalPage page="privacy" />}</Route>
    <Route path="/terms">{() => <LegalPage page="terms" />}</Route>
    <Route path="/cookies">{() => <LegalPage page="cookies" />}</Route>
    <Route path="/content-policy">{() => <LegalPage page="content" />}</Route>
    <Route path="/contact">{() => <LegalPage page="contact" />}</Route>
    <Route path="/404" component={NotFound} />
    <Route>{() => <CommunityLayout><NotFound /></CommunityLayout>}</Route>
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /><CookieConsent /><ConsentAwareAnalytics /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
