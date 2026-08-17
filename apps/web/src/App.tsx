import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Button, Callout } from './components/ui';
import { PublicLayout } from './components/PublicLayout';
import { LandingPage } from './pages/public/LandingPage';
import { PublicProfilePage } from './pages/public/PublicProfilePage';
import { ScenariosPage } from './pages/public/ScenariosPage';
import { DemoModePage } from './pages/public/DemoModePage';
import { StoryModePage } from './pages/public/StoryModePage';
import { ArchitecturePage } from './pages/public/ArchitecturePage';
import { AdminConsole } from './pages/admin/AdminConsole';
import { DashboardPage } from './pages/app/DashboardPage';
import { OrganizationPage } from './pages/app/OrganizationPage';
import { NetworkPage } from './pages/app/NetworkPage';
import { RelationshipsPage } from './pages/app/RelationshipsPage';
import { RequestsReceivedPage, RequestsSentPage } from './pages/app/RequestsPages';
import { VerificationsPage } from './pages/app/VerificationsPage';
import { VerificationDetailPage } from './pages/app/VerificationDetailPage';
import { NewVerificationPage } from './pages/app/NewVerificationPage';
import { CampaignDetailPage, CampaignsPage } from './pages/app/CampaignsPage';
import { PoliciesPage, PolicyDetailPage } from './pages/app/PoliciesPage';
import { CredentialsPage } from './pages/app/CredentialsPage';
import { MonitoringPage } from './pages/app/MonitoringPage';
import { PeoplePage } from './pages/app/PeoplePage';
import { BillingPage } from './pages/app/BillingPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { AuditPage } from './pages/app/AuditPage';
import { JourneyPage } from './pages/app/JourneyPage';
import { BecomeRequesterPage } from './pages/app/BecomeRequesterPage';
import { ProfileRedirect } from './pages/app/ProfileRedirect';

export function App() {
  return (
    <Routes>
      {/* Public surface */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<LandingPage />} />
      <Route path="/profile/:bidId" element={<PublicProfilePage />} />
      <Route path="/scenarios" element={<ScenariosPage />} />
      <Route path="/demo" element={<DemoModePage />} />
      <Route path="/story" element={<StoryModePage />} />
      <Route path="/architecture" element={<ArchitecturePage />} />

      {/* BID internal console */}
      <Route path="/admin" element={<AdminConsole />} />

      {/* Product */}
      <Route
        path="/app/*"
        element={
          <AppShell>
            <Routes>
              <Route index element={<DashboardPage />} />
              <Route path="organization" element={<OrganizationPage />} />
              <Route path="network" element={<NetworkPage />} />
              <Route path="relationships" element={<RelationshipsPage />} />
              <Route path="requests-received" element={<RequestsReceivedPage />} />
              <Route path="requests-sent" element={<RequestsSentPage />} />
              <Route path="verifications" element={<VerificationsPage />} />
              <Route path="verifications/new" element={<NewVerificationPage />} />
              <Route path="verifications/:id" element={<VerificationDetailPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:id" element={<CampaignDetailPage />} />
              <Route path="policies" element={<PoliciesPage />} />
              <Route path="policies/:id" element={<PolicyDetailPage />} />
              <Route path="credentials" element={<CredentialsPage />} />
              <Route path="monitoring" element={<MonitoringPage />} />
              <Route path="people" element={<PeoplePage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="journey" element={<JourneyPage />} />
              <Route path="become-requester" element={<BecomeRequesterPage />} />
              <Route path="profile" element={<ProfileRedirect />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </AppShell>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <Callout tone="attention" title="Page not found">
          That route does not exist in this build.
        </Callout>
        <div className="mt-4 flex gap-2">
          <Link to="/">
            <Button variant="primary">Back to the landing page</Button>
          </Link>
          <Link to="/app">
            <Button>Open the product</Button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
