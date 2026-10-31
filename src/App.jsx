// =====================================================================
// Every route in the app (React Router, declarative mode).
// Layout routes (no path, or a path with children) draw the frame and
// render the child page in their <Outlet />.
//
//   /                     landing + demo role picker
//   /app/...              planner workspace   (role: planner)
//   /app/staff/...        staff app           (role: staff)
//   /portal/...           client portal       (role: client, Ana)
//   /b/:biz/...           the planner's public inquiry + booking pages
//   /e/:slug/...  /i/:t   guest pages (no account)
//   /join/:token          staff invite
//   /outbox               demo: every email/text/push the app sent
//
// <Planned id="…"> marks a screen a later phase builds (see routes/screens.js).
// =====================================================================
import { Navigate, Route, Routes } from 'react-router-dom'

import RootLayout from './layouts/RootLayout'
import RequireRole from './layouts/RequireRole'
import CrownedLayout from './layouts/CrownedLayout'
import PlannerLayout from './layouts/PlannerLayout'
import EventHubLayout, { GuestSubTabs } from './layouts/EventHubLayout'
import PortalLayout from './layouts/PortalLayout'
import PublicLayout from './layouts/PublicLayout'
import GuestLayout from './layouts/GuestLayout'
import StaffLayout from './layouts/StaffLayout'

import Landing from './pages/shared/Landing'
import SignIn from './pages/shared/SignIn'
import Outbox from './pages/shared/Outbox'
import NotFound from './pages/shared/NotFound'
import Planned from './pages/shared/Planned'
import SettingsLayout from './pages/planner/settings/SettingsLayout'
import Appearance from './pages/planner/settings/Appearance'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Landing />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="outbox" element={<Outbox />} />

        {/* ---------- Planner: getting started ---------- */}
        <Route element={<CrownedLayout />}>
          <Route path="app/signup" element={<Planned id="signup" />} />
          <Route path="app/onboarding/:step" element={<Planned id="onboarding" />} />
        </Route>

        {/* ---------- Planner workspace ---------- */}
        <Route path="app" element={<RequireRole role="planner"><PlannerLayout /></RequireRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Planned id="dashboard" />} />
          <Route path="calendar" element={<Planned id="calendar" />} />
          <Route path="leads" element={<Planned id="leads" />} />
          <Route path="leads/:leadId" element={<Planned id="leadDetail" />} />
          <Route path="proposals/:leadId" element={<Planned id="proposalBuilder" />} />
          <Route path="contracts/:contractId" element={<Planned id="contract" />} />
          <Route path="invoices/:invoiceId" element={<Planned id="invoice" />} />
          <Route path="events" element={<Planned id="events" />} />
          <Route path="events/:eventId" element={<EventHubLayout />}>
            <Route index element={<Planned id="hubOverview" nested />} />
            <Route path="tasks" element={<Planned id="hubTasks" nested />} />
            <Route path="guests" element={<GuestSubTabs />}>
              <Route index element={<Planned id="hubGuests" nested />} />
              <Route path="invitations" element={<Planned id="hubInvitations" nested />} />
              <Route path="website" element={<Planned id="hubWebsite" nested />} />
            </Route>
            <Route path="money" element={<Planned id="hubMoney" nested />} />
            <Route path="files" element={<Planned id="hubFiles" nested />} />
            <Route path="messages" element={<Planned id="hubMessages" nested />} />
            <Route path="reschedule" element={<Planned id="reschedule" nested />} />
            <Route path="cancel" element={<Planned id="cancelEvent" nested />} />
          </Route>
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="business" replace />} />
            <Route path="appearance" element={<Appearance />} />
            <Route path=":section" element={<Planned id="settings" nested />} />
          </Route>
        </Route>

        {/* ---------- Staff ---------- */}
        <Route path="app/staff" element={<RequireRole role="staff"><StaffLayout /></RequireRole>}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<Planned id="staffProfile" />} />
        </Route>

        {/* ---------- The planner's public pages (no account) ---------- */}
        <Route element={<PublicLayout />}>
          <Route path="b/:biz/inquire" element={<Planned id="inquiry" />} />
          <Route path="b/:biz/book" element={<Planned id="booking" />} />
          <Route path="join/:token" element={<Planned id="staffJoin" />} />
        </Route>

        {/* ---------- Client portal ---------- */}
        <Route path="portal" element={<RequireRole role="client"><PortalLayout /></RequireRole>}>
          <Route index element={<Planned id="portalHome" />} />
          <Route path="proposal" element={<Planned id="portalProposal" />} />
          <Route path="contract" element={<Planned id="portalContract" />} />
          <Route path="pay" element={<Planned id="portalPay" />} />
          <Route path="questionnaire/:questionnaireId" element={<Planned id="portalQuestionnaire" />} />
          <Route path="mood-board" element={<Planned id="portalMoodBoard" />} />
          <Route path="approvals" element={<Planned id="portalApprovals" />} />
          <Route path="payments" element={<Planned id="portalPayments" />} />
          <Route path="change-request" element={<Planned id="portalChange" />} />
          <Route path="guests" element={<Planned id="portalGuests" />} />
          <Route path="messages" element={<Planned id="portalMessages" />} />
        </Route>

        {/* ---------- Guests (no account) ---------- */}
        <Route path="e/:slug" element={<GuestLayout />}>
          <Route index element={<Planned id="eventWebsite" />} />
          <Route path="rsvp" element={<Planned id="rsvp" />} />
          <Route path="rsvp/done" element={<Planned id="rsvpDone" />} />
        </Route>
        <Route path="i/:token" element={<GuestLayout />}>
          <Route index element={<Planned id="invitation" />} />
        </Route>

        <Route path="*" element={<NotFound standalone />} />
      </Route>
    </Routes>
  )
}
