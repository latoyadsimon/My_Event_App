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
import SignUp from './pages/planner/SignUp'
import Onboarding from './pages/planner/Onboarding'
import Dashboard from './pages/planner/Dashboard'
import Leads from './pages/planner/leads/Leads'
import LeadDetail from './pages/planner/leads/LeadDetail'
import ProposalBuilder from './pages/planner/leads/ProposalBuilder'
import Calendar from './pages/planner/Calendar'
import Overview from './pages/planner/hub/Overview'
import Tasks from './pages/planner/hub/Tasks'
import Guests from './pages/planner/hub/Guests'
import Website from './pages/planner/hub/Website'
import Invitations from './pages/planner/hub/Invitations'
import Money from './pages/planner/hub/Money'
import Files from './pages/planner/hub/Files'
import Messages from './pages/planner/hub/Messages'
import { Reschedule, CancelEvent } from './pages/planner/hub/ChangeEvent'
import Contract from './pages/planner/booking/Contract'
import Invoice from './pages/planner/booking/Invoice'
import Events from './pages/planner/booking/Events'
import PortalProposal from './pages/client/portal/PortalProposal'
import PortalContract from './pages/client/portal/PortalContract'
import PortalPay from './pages/client/portal/PortalPay'
import PortalHome from './pages/client/portal/PortalHome'
import { PortalQuestionnaire, PortalMoodBoard, PortalApprovals, PortalMessages } from './pages/client/portal/PortalPlanning'
import { PortalPayments, PortalChange, PortalGuests } from './pages/client/portal/PortalMoney'
import { Invitation, EventWebsite, Rsvp, RsvpDone } from './pages/guest/GuestPages'
import { StaffJoin, StaffProfile } from './pages/staff/StaffPages'
import InquiryForm from './pages/client/InquiryForm'
import BookingPage from './pages/client/BookingPage'
import SettingsLayout from './pages/planner/settings/SettingsLayout'
import Appearance from './pages/planner/settings/Appearance'
import {
  BusinessSettings, BrandingSettings, PackagesSettings, PaymentsSettings, CalendarSettings,
  TeamSettings, TemplatesSettings, ExportSettings,
} from './pages/planner/settings/sections'

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Landing />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="outbox" element={<Outbox />} />

        {/* ---------- Planner: getting started ---------- */}
        <Route element={<CrownedLayout />}>
          <Route path="app/signup" element={<SignUp />} />
          <Route path="app/onboarding" element={<Navigate to="business" replace />} />
          <Route path="app/onboarding/:step" element={<Onboarding />} />
        </Route>

        {/* ---------- Planner workspace ---------- */}
        <Route path="app" element={<RequireRole role="planner"><PlannerLayout /></RequireRole>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:leadId" element={<LeadDetail />} />
          <Route path="proposals/:leadId" element={<ProposalBuilder />} />
          <Route path="contracts/:contractId" element={<Contract />} />
          <Route path="invoices/:invoiceId" element={<Invoice />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<EventHubLayout />}>
            <Route index element={<Overview />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="guests" element={<GuestSubTabs />}>
              <Route index element={<Guests />} />
              <Route path="invitations" element={<Invitations />} />
              <Route path="website" element={<Website />} />
            </Route>
            <Route path="money" element={<Money />} />
            <Route path="files" element={<Files />} />
            <Route path="messages" element={<Messages />} />
            <Route path="reschedule" element={<Reschedule />} />
            <Route path="cancel" element={<CancelEvent />} />
          </Route>
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="business" replace />} />
            <Route path="business" element={<BusinessSettings />} />
            <Route path="branding" element={<BrandingSettings />} />
            <Route path="packages" element={<PackagesSettings />} />
            <Route path="payments" element={<PaymentsSettings />} />
            <Route path="calendar" element={<CalendarSettings />} />
            <Route path="team" element={<TeamSettings />} />
            <Route path="templates" element={<TemplatesSettings />} />
            <Route path="export" element={<ExportSettings />} />
            <Route path="appearance" element={<Appearance />} />
          </Route>
        </Route>

        {/* ---------- Staff ---------- */}
        <Route path="app/staff" element={<RequireRole role="staff"><StaffLayout /></RequireRole>}>
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<StaffProfile />} />
        </Route>

        {/* ---------- The planner's public pages (no account) ---------- */}
        <Route element={<PublicLayout />}>
          <Route path="b/:biz/inquire" element={<InquiryForm />} />
          <Route path="b/:biz/book" element={<BookingPage />} />
          <Route path="join/:token" element={<StaffJoin />} />
        </Route>

        {/* ---------- Client portal ---------- */}
        <Route path="portal" element={<RequireRole role="client"><PortalLayout /></RequireRole>}>
          <Route index element={<PortalHome />} />
          <Route path="proposal" element={<PortalProposal />} />
          <Route path="contract" element={<PortalContract />} />
          <Route path="pay" element={<PortalPay />} />
          <Route path="questionnaire/:questionnaireId" element={<PortalQuestionnaire />} />
          <Route path="mood-board" element={<PortalMoodBoard />} />
          <Route path="approvals" element={<PortalApprovals />} />
          <Route path="payments" element={<PortalPayments />} />
          <Route path="change-request" element={<PortalChange />} />
          <Route path="guests" element={<PortalGuests />} />
          <Route path="messages" element={<PortalMessages />} />
        </Route>

        {/* ---------- Guests (no account) ---------- */}
        <Route path="e/:slug" element={<GuestLayout />}>
          <Route index element={<EventWebsite />} />
          <Route path="rsvp" element={<Rsvp />} />
          <Route path="rsvp/done" element={<RsvpDone />} />
        </Route>
        <Route path="i/:token" element={<GuestLayout />}>
          <Route index element={<Invitation />} />
        </Route>

        <Route path="*" element={<NotFound standalone />} />
      </Route>
    </Routes>
  )
}
