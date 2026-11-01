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
//   /v/:token/...         a vendor's page for one event (magic link, no account)
//   /print/...            printable pages without the app frame (run of show)
//   /outbox               demo: every email/text/push the app sent
//   /help                 the How-To guide (same words as documentation/HOW_TO.md)
//
// =====================================================================
import { Navigate, Route, Routes } from 'react-router-dom'

import RootLayout from './layouts/RootLayout'
import RequireRole from './layouts/RequireRole'
import CrownedLayout from './layouts/CrownedLayout'
import PlannerLayout from './layouts/PlannerLayout'
import EventHubLayout, { GuestSubTabs, LogisticsSubTabs } from './layouts/EventHubLayout'
import PortalLayout from './layouts/PortalLayout'
import PublicLayout from './layouts/PublicLayout'
import GuestLayout from './layouts/GuestLayout'
import StaffLayout from './layouts/StaffLayout'
import VendorLayout from './layouts/VendorLayout'

import Landing from './pages/shared/Landing'
import NotFound from './pages/shared/NotFound'
import { lazyPage } from './lib/lazyPage'
// Pages load on first visit (code splitting); see lib/lazyPage.js
const SignIn = lazyPage(() => import('./pages/shared/SignIn'))
const Help = lazyPage(() => import('./pages/shared/Help'))
const Outbox = lazyPage(() => import('./pages/shared/Outbox'))
const SignUp = lazyPage(() => import('./pages/planner/SignUp'))
const Onboarding = lazyPage(() => import('./pages/planner/Onboarding'))
const Dashboard = lazyPage(() => import('./pages/planner/Dashboard'))
const Leads = lazyPage(() => import('./pages/planner/leads/Leads'))
const LeadDetail = lazyPage(() => import('./pages/planner/leads/LeadDetail'))
const ProposalBuilder = lazyPage(() => import('./pages/planner/leads/ProposalBuilder'))
const Calendar = lazyPage(() => import('./pages/planner/Calendar'))
const Overview = lazyPage(() => import('./pages/planner/hub/Overview'))
const Tasks = lazyPage(() => import('./pages/planner/hub/Tasks'))
const Guests = lazyPage(() => import('./pages/planner/hub/Guests'))
const Website = lazyPage(() => import('./pages/planner/hub/Website'))
const Invitations = lazyPage(() => import('./pages/planner/hub/Invitations'))
const RunOfShow = lazyPage(() => import('./pages/planner/hub/RunOfShow'))
const RunOfShowPrint = lazyPage(() => import('./pages/planner/hub/RunOfShow'), 'RunOfShowPrint')
const Vendors = lazyPage(() => import('./pages/planner/hub/Vendors'))
const Gear = lazyPage(() => import('./pages/planner/hub/Gear'))
const Money = lazyPage(() => import('./pages/planner/hub/Money'))
const Files = lazyPage(() => import('./pages/planner/hub/Files'))
const Messages = lazyPage(() => import('./pages/planner/hub/Messages'))
const Reschedule = lazyPage(() => import('./pages/planner/hub/ChangeEvent'), 'Reschedule')
const CancelEvent = lazyPage(() => import('./pages/planner/hub/ChangeEvent'), 'CancelEvent')
const Contract = lazyPage(() => import('./pages/planner/booking/Contract'))
const Invoice = lazyPage(() => import('./pages/planner/booking/Invoice'))
const Events = lazyPage(() => import('./pages/planner/booking/Events'))
const PortalProposal = lazyPage(() => import('./pages/client/portal/PortalProposal'))
const PortalContract = lazyPage(() => import('./pages/client/portal/PortalContract'))
const PortalPay = lazyPage(() => import('./pages/client/portal/PortalPay'))
const PortalHome = lazyPage(() => import('./pages/client/portal/PortalHome'))
const PortalQuestionnaire = lazyPage(() => import('./pages/client/portal/PortalPlanning'), 'PortalQuestionnaire')
const PortalMoodBoard = lazyPage(() => import('./pages/client/portal/PortalPlanning'), 'PortalMoodBoard')
const PortalApprovals = lazyPage(() => import('./pages/client/portal/PortalPlanning'), 'PortalApprovals')
const PortalMessages = lazyPage(() => import('./pages/client/portal/PortalPlanning'), 'PortalMessages')
const PortalPayments = lazyPage(() => import('./pages/client/portal/PortalMoney'), 'PortalPayments')
const PortalChange = lazyPage(() => import('./pages/client/portal/PortalMoney'), 'PortalChange')
const PortalGuests = lazyPage(() => import('./pages/client/portal/PortalMoney'), 'PortalGuests')
const Invitation = lazyPage(() => import('./pages/guest/GuestPages'), 'Invitation')
const EventWebsite = lazyPage(() => import('./pages/guest/GuestPages'), 'EventWebsite')
const Rsvp = lazyPage(() => import('./pages/guest/GuestPages'), 'Rsvp')
const RsvpDone = lazyPage(() => import('./pages/guest/GuestPages'), 'RsvpDone')
const StaffJoin = lazyPage(() => import('./pages/staff/StaffPages'), 'StaffJoin')
const StaffProfile = lazyPage(() => import('./pages/staff/StaffPages'), 'StaffProfile')
const InquiryForm = lazyPage(() => import('./pages/client/InquiryForm'))
const BookingPage = lazyPage(() => import('./pages/client/BookingPage'))
const SettingsLayout = lazyPage(() => import('./pages/planner/settings/SettingsLayout'))
const Appearance = lazyPage(() => import('./pages/planner/settings/Appearance'))
const BusinessSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'BusinessSettings')
const BrandingSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'BrandingSettings')
const PackagesSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'PackagesSettings')
const PaymentsSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'PaymentsSettings')
const CalendarSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'CalendarSettings')
const TeamSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'TeamSettings')
const TemplatesSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'TemplatesSettings')
const ExportSettings = lazyPage(() => import('./pages/planner/settings/sections'), 'ExportSettings')
const VendorSettings = lazyPage(() => import('./pages/planner/settings/LogisticsSettings'), 'VendorSettings')
const EquipmentSettings = lazyPage(() => import('./pages/planner/settings/LogisticsSettings'), 'EquipmentSettings')
const VendorEvent = lazyPage(() => import('./pages/vendor/VendorPages'), 'VendorEvent')
const VendorPaperwork = lazyPage(() => import('./pages/vendor/VendorPages'), 'VendorPaperwork')
const VendorMessages = lazyPage(() => import('./pages/vendor/VendorPages'), 'VendorMessages')

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Landing />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="outbox" element={<Outbox />} />

        {/* ---------- Planner: getting started ---------- */}
        <Route element={<CrownedLayout />}>
          <Route path="help" element={<Help />} />
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
            <Route path="logistics" element={<LogisticsSubTabs />}>
              <Route index element={<RunOfShow />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="gear" element={<Gear />} />
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
            <Route path="vendors" element={<VendorSettings />} />
            <Route path="equipment" element={<EquipmentSettings />} />
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

        {/* ---------- Vendors (magic link, no account) ---------- */}
        <Route path="v/:token" element={<VendorLayout />}>
          <Route index element={<VendorEvent />} />
          <Route path="paperwork" element={<VendorPaperwork />} />
          <Route path="messages" element={<VendorMessages />} />
        </Route>

        {/* ---------- Printable pages (planner, no app frame) ---------- */}
        <Route path="print/events/:eventId/run-of-show" element={<RequireRole role="planner"><RunOfShowPrint /></RequireRole>} />

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
