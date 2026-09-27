import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import Login from './pages/Login';
import EmployeeIndex from './pages/HR/Employee/index';
import OrganizationIndex from './pages/HR/Organization/index';
import IncomingLetterIndex from './pages/HR/IncomingLetter/index';
import IncomingLetterCreate from './pages/HR/IncomingLetter/create';
import IncomingLetterShow from './pages/HR/IncomingLetter/show';
import IncomingLetterEdit from './pages/HR/IncomingLetter/edit';
import DispositionIndex from './pages/HR/Disposition/index';
import OutgoingLetterIndex from './pages/HR/OutgoingLetter';
import OutgoingLetterCreate from './pages/HR/OutgoingLetter/create';
import OutgoingLetterEdit from './pages/HR/OutgoingLetter/edit';
import OutgoingLetterShow from './pages/HR/OutgoingLetter/show';
import OutgoingLetterPrint from './pages/HR/OutgoingLetter/print';
import Verify from './pages/Verify';

import DocumentTemplatesIndex from './pages/Arsip/DocumentTemplates/index';
import DocumentTemplatesCreate from './pages/Arsip/DocumentTemplates/create';
import DocumentTemplatesEdit from './pages/Arsip/DocumentTemplates/edit';
import DocumentTemplatesShow from './pages/Arsip/DocumentTemplates/show';
import EmployeeCreate from './pages/HR/Employee/create';
import EmployeeEdit from './pages/HR/Employee/edit';
import EmployeeShow from './pages/HR/Employee/show';
import WorkScheduleIndex from './pages/HR/WorkSchedule/index';
import WorkScheduleCreate from './pages/HR/WorkSchedule/create';
import WorkScheduleEdit from './pages/HR/WorkSchedule/edit';
import WorkScheduleShow from './pages/HR/WorkSchedule/show';
import EmployeeScheduleIndex from './pages/HR/EmployeeSchedule/index';
import EmployeeScheduleCreate from './pages/HR/EmployeeSchedule/create';
import RosterScheduleCreate from './pages/HR/RosterSchedule/create';
import RosterPlanner from './pages/HR/RosterSchedule/planner';
import ShiftExchangeIndex from './pages/HR/ShiftExchange/index';
import ShiftExchangeCreate from './pages/HR/ShiftExchange/create';
import OrganizationCreate from './pages/HR/Organization/create';
import OrganizationEdit from './pages/HR/Organization/edit';
import OrganizationShow from './pages/HR/Organization/show';
import OrganizationChart from './pages/HR/Organization/chart';
import HrLayout from './layouts/hr-layout';
import AdminLayout from './layouts/admin-layout';
import MeetingCheckin from './pages/MeetingCheckin/index';
import AttendanceIndex from './pages/HR/Attendance/index';
import LeaveMonitoring from './pages/HR/Leave/index';

import RoomIndex from './pages/Admin/Room/index';
import RoomCreate from './pages/Admin/Room/create';
import RoomEdit from './pages/Admin/Room/edit';
import MeetingIndex from './pages/Admin/Meeting/index';
import MeetingCreate from './pages/Admin/Meeting/create';
import MeetingShow from './pages/Admin/Meeting/show';
import MeetingEdit from './pages/Admin/Meeting/edit';
import MeetingAttendance from './pages/Admin/Meeting/attendance';
import MeetingMemo from './pages/Admin/Meeting/memo';
import SettingsPage from './pages/Admin/Settings/index';
import CheckinPage from './pages/Checkin/index';

import JobCategoryIndex from './pages/HR/MasterData/JobCategory/index';
import JobCategoryCreate from './pages/HR/MasterData/JobCategory/create';
import JobCategoryEdit from './pages/HR/MasterData/JobCategory/edit';
import JobCategoryShow from './pages/HR/MasterData/JobCategory/show';
import EmploymentStatusIndex from './pages/HR/MasterData/EmploymentStatus/index';
import EmploymentStatusCreate from './pages/HR/MasterData/EmploymentStatus/create';
import EmploymentStatusEdit from './pages/HR/MasterData/EmploymentStatus/edit';
import EmploymentStatusShow from './pages/HR/MasterData/EmploymentStatus/show';
import EducationLevelIndex from './pages/HR/MasterData/EducationLevel/index';
import EducationLevelCreate from './pages/HR/MasterData/EducationLevel/create';
import EducationLevelEdit from './pages/HR/MasterData/EducationLevel/edit';
import EducationLevelShow from './pages/HR/MasterData/EducationLevel/show';
import LeaveTypeIndex from './pages/HR/MasterData/LeaveType/index';
import UserIndex from './pages/HR/Access/User/index';
import UserCreate from './pages/HR/Access/User/create';
import UserEdit from './pages/HR/Access/User/edit';
import RoleIndex from './pages/HR/Access/Role/index';
import RoleCreate from './pages/HR/Access/Role/create';
import RoleEdit from './pages/HR/Access/Role/edit';
import RolePermissions from './pages/HR/Access/Role/permissions';
import PermissionIndex from './pages/HR/Access/Permission/index';
import PermissionCreate from './pages/HR/Access/Permission/create';
import PermissionEdit from './pages/HR/Access/Permission/edit';
import LeaveTypeCreate from './pages/HR/MasterData/LeaveType/create';
import LeaveTypeEdit from './pages/HR/MasterData/LeaveType/edit';
import LeaveTypeShow from './pages/HR/MasterData/LeaveType/show';
import WorkLocationIndex from './pages/HR/MasterData/WorkLocation/index';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

import AdminDashboard from './pages/Dashboard/AdminDashboard';
import HrDashboard from './pages/Dashboard/HrDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify/:id" element={<Verify />} />

          <Route path="/meetings/checkin/:token" element={<MeetingCheckin />} />
          <Route path="/checkin" element={<CheckinPage />} />

          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/hr/dashboard" element={<ProtectedRoute><HrDashboard /></ProtectedRoute>} />

          {/* Admin/Settings */}
          <Route path="/admin/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/rooms" element={<ProtectedRoute><RoomIndex /></ProtectedRoute>} />
          <Route path="/admin/rooms/create" element={<ProtectedRoute><RoomCreate /></ProtectedRoute>} />
          <Route path="/admin/rooms/:id/edit" element={<ProtectedRoute><RoomEdit /></ProtectedRoute>} />

          <Route path="/admin/meetings" element={<ProtectedRoute><MeetingIndex /></ProtectedRoute>} />
          <Route path="/admin/meetings/create" element={<ProtectedRoute><MeetingCreate /></ProtectedRoute>} />
          <Route path="/admin/meetings/:id" element={<ProtectedRoute><MeetingShow /></ProtectedRoute>} />
          <Route path="/admin/meetings/:id/edit" element={<ProtectedRoute><MeetingEdit /></ProtectedRoute>} />
          <Route path="/admin/meetings/:id/attendance" element={<ProtectedRoute><MeetingAttendance /></ProtectedRoute>} />
          <Route path="/admin/meetings/:id/memo" element={<ProtectedRoute><MeetingMemo /></ProtectedRoute>} />

          {/* Access Management */}
          <Route path="/hr/access/users" element={<UserIndex />} />
          <Route path="/hr/access/users/create" element={<UserCreate />} />
          <Route path="/hr/access/users/:id/edit" element={<UserEdit />} />
          <Route path="/hr/access/roles" element={<RoleIndex />} />
          <Route path="/hr/access/roles/create" element={<RoleCreate />} />
          <Route path="/hr/access/roles/:id/edit" element={<RoleEdit />} />
          <Route path="/hr/access/roles/:id/permissions" element={<RolePermissions />} />
          <Route path="/hr/access/permissions" element={<PermissionIndex />} />
          <Route path="/hr/access/permissions/create" element={<PermissionCreate />} />
          <Route path="/hr/access/permissions/:id/edit" element={<PermissionEdit />} />

          {/* HR Routes */}
          <Route path="/hr/employees" element={<ProtectedRoute><EmployeeIndex /></ProtectedRoute>} />
          <Route path="/hr/employees/create" element={<ProtectedRoute><EmployeeCreate /></ProtectedRoute>} />
          <Route path="/hr/employees/:id" element={<ProtectedRoute><EmployeeShow /></ProtectedRoute>} />
          <Route path="/hr/employees/:id/edit" element={<ProtectedRoute><EmployeeEdit /></ProtectedRoute>} />
          <Route path="/hr/organizations" element={<ProtectedRoute><OrganizationIndex /></ProtectedRoute>} />
          <Route path="/hr/organizations/chart" element={<ProtectedRoute><OrganizationChart /></ProtectedRoute>} />
          <Route path="/hr/organizations/create" element={<ProtectedRoute><OrganizationCreate /></ProtectedRoute>} />
          <Route path="/hr/organizations/:id" element={<ProtectedRoute><OrganizationShow /></ProtectedRoute>} />
          <Route path="/hr/organizations/:id/edit" element={<ProtectedRoute><OrganizationEdit /></ProtectedRoute>} />
          <Route path="/hr/work-schedules" element={<ProtectedRoute><WorkScheduleIndex /></ProtectedRoute>} />
          <Route path="/hr/work-schedules/create" element={<ProtectedRoute><WorkScheduleCreate /></ProtectedRoute>} />
          <Route path="/hr/work-schedules/:id" element={<ProtectedRoute><WorkScheduleShow /></ProtectedRoute>} />
          <Route path="/hr/work-schedules/:id/edit" element={<ProtectedRoute><WorkScheduleEdit /></ProtectedRoute>} />
          <Route path="/hr/employee-schedules" element={<ProtectedRoute><EmployeeScheduleIndex /></ProtectedRoute>} />
          <Route path="/hr/employee-schedules/create" element={<ProtectedRoute><EmployeeScheduleCreate /></ProtectedRoute>} />
          <Route path="/hr/rosters" element={<Navigate to="/hr/rosters/planner" replace />} />
          <Route path="/hr/rosters/create" element={<ProtectedRoute><RosterScheduleCreate /></ProtectedRoute>} />
          <Route path="/hr/rosters/planner" element={<ProtectedRoute><RosterPlanner /></ProtectedRoute>} />
          <Route path="/hr/shift-exchanges" element={<ProtectedRoute><ShiftExchangeIndex /></ProtectedRoute>} />
          <Route path="/hr/shift-exchanges/create" element={<ProtectedRoute><ShiftExchangeCreate /></ProtectedRoute>} />
          <Route path="/hr/attendances" element={<ProtectedRoute><AttendanceIndex /></ProtectedRoute>} />
          <Route path="/hr/leaves" element={<ProtectedRoute><LeaveMonitoring /></ProtectedRoute>} />

          <Route path="/admin/incoming-letters" element={<ProtectedRoute><IncomingLetterIndex /></ProtectedRoute>} />
          <Route path="/admin/incoming-letters/create" element={<ProtectedRoute><IncomingLetterCreate /></ProtectedRoute>} />
          <Route path="/admin/incoming-letters/:id" element={<ProtectedRoute><IncomingLetterShow /></ProtectedRoute>} />
          <Route path="/admin/incoming-letters/:id/edit" element={<ProtectedRoute><IncomingLetterEdit /></ProtectedRoute>} />

          <Route path="/admin/dispositions" element={<ProtectedRoute><DispositionIndex /></ProtectedRoute>} />

          <Route path="/admin/outgoing-letters" element={<ProtectedRoute><OutgoingLetterIndex /></ProtectedRoute>} />
          <Route path="/admin/outgoing-letters/create" element={<ProtectedRoute><OutgoingLetterCreate /></ProtectedRoute>} />
          <Route path="/admin/outgoing-letters/:id/edit" element={<ProtectedRoute><OutgoingLetterEdit /></ProtectedRoute>} />
          <Route path="/admin/outgoing-letters/:id" element={<ProtectedRoute><OutgoingLetterShow /></ProtectedRoute>} />
          <Route path="/admin/outgoing-letters/print/:id" element={<OutgoingLetterPrint />} />

          {/* Document Templates */}
          <Route path="/arsip/document-templates" element={<ProtectedRoute><DocumentTemplatesIndex /></ProtectedRoute>} />
          <Route path="/arsip/document-templates/create" element={<ProtectedRoute><DocumentTemplatesCreate /></ProtectedRoute>} />
          <Route path="/arsip/document-templates/:id" element={<ProtectedRoute><DocumentTemplatesShow /></ProtectedRoute>} />
          <Route path="/arsip/document-templates/:id/edit" element={<ProtectedRoute><DocumentTemplatesEdit /></ProtectedRoute>} />

          {/* Master Data */}
          <Route path="/hr/master-data/jobcategory" element={<ProtectedRoute><JobCategoryIndex /></ProtectedRoute>} />
          <Route path="/hr/master-data/jobcategory/create" element={<ProtectedRoute><JobCategoryCreate /></ProtectedRoute>} />
          <Route path="/hr/master-data/jobcategory/:id" element={<ProtectedRoute><JobCategoryShow /></ProtectedRoute>} />
          <Route path="/hr/master-data/jobcategory/:id/edit" element={<ProtectedRoute><JobCategoryEdit /></ProtectedRoute>} />
          <Route path="/hr/master-data/employmentstatus" element={<ProtectedRoute><EmploymentStatusIndex /></ProtectedRoute>} />
          <Route path="/hr/master-data/employmentstatus/create" element={<ProtectedRoute><EmploymentStatusCreate /></ProtectedRoute>} />
          <Route path="/hr/master-data/employmentstatus/:id" element={<ProtectedRoute><EmploymentStatusShow /></ProtectedRoute>} />
          <Route path="/hr/master-data/employmentstatus/:id/edit" element={<ProtectedRoute><EmploymentStatusEdit /></ProtectedRoute>} />
          <Route path="/hr/master-data/educationlevel" element={<ProtectedRoute><EducationLevelIndex /></ProtectedRoute>} />
          <Route path="/hr/master-data/educationlevel/create" element={<ProtectedRoute><EducationLevelCreate /></ProtectedRoute>} />
          <Route path="/hr/master-data/educationlevel/:id" element={<ProtectedRoute><EducationLevelShow /></ProtectedRoute>} />
          <Route path="/hr/master-data/educationlevel/:id/edit" element={<ProtectedRoute><EducationLevelEdit /></ProtectedRoute>} />
          <Route path="/hr/master-data/leavetype" element={<ProtectedRoute><LeaveTypeIndex /></ProtectedRoute>} />
          <Route path="/hr/master-data/leavetype/create" element={<ProtectedRoute><LeaveTypeCreate /></ProtectedRoute>} />
          <Route path="/hr/master-data/leavetype/:id" element={<ProtectedRoute><LeaveTypeShow /></ProtectedRoute>} />
          <Route path="/hr/master-data/leavetype/:id/edit" element={<ProtectedRoute><LeaveTypeEdit /></ProtectedRoute>} />
          <Route path="/hr/master-data/work-location" element={<ProtectedRoute><WorkLocationIndex /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
