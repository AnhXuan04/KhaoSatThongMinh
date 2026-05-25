import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css'
import AppShell from './assets/components/AppShell';
import SignInPage from './page/SignInPage';
import SignUpPage from './page/SignUpPage';
import VerifyOtpPage from './page/VerifyOtpPage';
import ForgotPasswordPage from './page/ForgotPass';
import DashboardPage from './page/interviewer/DashboardPage';
import DashboardAdmin from './page/admin/DashboardAdmin';
import MngUser from './page/admin/MngUser';
import MngSurveyField from './page/admin/MngSurveyField';
import MngQualitySurvey from './page/admin/MngQualitySurvey';
import HomePage from './page/HomePage';
import CreatorPackagePage from './page/CreatorPackagePage';
import UpdateProfilePage from './page/interviewer/UpdateProfilePage';
import SurveyListPage from './page/interviewee/SurveyListPage';
import HistorySurvey from './page/interviewee/HistorySurvey';
import UserProfilePage from './page/interviewee/UserProfilePage';
import ResetPasswordPage from './page/ResetPasswordPage';
import MngSurvey from './page/interviewer/MngSurvey';
import MngSurveyReview from './page/interviewer/MngSurveyReview';
import PaymentResultPage from './page/interviewer/PaymentResultPage';
import ServicePackage from './page/interviewer/ServicePackage';
import CreateSurveys from './page/interviewer/CreateSurveys';
import ViewSurvey from './page/interviewee/ViewSurvey';
import ReviewSurvey from './page/interviewee/ReviewSurvey';
import type {JSX} from "react";

const getRoleFromToken = (token: string) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded?.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
};

const getDefaultPathByRole = (role: string | null) => {
  if (role === 'ADMIN') {
    return '/dashboard-admin';
  }
  if (role === 'INTERVIEWER') {
    return '/dashboard';
  }
  return '/user-profile';
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    const currentPath = window.location.pathname + window.location.search;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(currentPath)}`} replace />;
  }
  return children;
};

const RequireRole = ({ role, children }: { role: string; children: JSX.Element }) => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const currentRole = getRoleFromToken(token);
  if (currentRole !== role) {
    return <Navigate to={getDefaultPathByRole(currentRole)} replace />;
  }
  return children;
};

const PublicOnly = ({ children }: { children: JSX.Element }) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    return <Navigate to={getDefaultPathByRole(getRoleFromToken(token))} replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicOnly><SignInPage /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><SignUpPage /></PublicOnly>} />
          <Route path="/verify-otp" element={<PublicOnly><VerifyOtpPage /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
          <Route path="/dashboard" element={<RequireRole role="INTERVIEWER"><DashboardPage /></RequireRole>} />
          <Route path="/dashboard-admin" element={<RequireRole role="ADMIN"><DashboardAdmin /></RequireRole>} />
          <Route path="/dashboard-admin/users" element={<RequireRole role="ADMIN"><MngUser /></RequireRole>} />
          <Route path="/dashboard-admin/categories" element={<RequireRole role="ADMIN"><MngSurveyField /></RequireRole>} />
          <Route path="/dashboard-admin/quality" element={<RequireRole role="ADMIN"><MngQualitySurvey /></RequireRole>} />
          <Route path="/manage-surveys" element={<RequireRole role="INTERVIEWER"><MngSurvey /></RequireRole>} />
          <Route path="/manage-surveys/review" element={<RequireRole role="INTERVIEWER"><MngSurveyReview /></RequireRole>} />
          <Route path="/creator-package" element={<CreatorPackagePage />} />
          <Route path="/update-profile" element={<RequireAuth><UpdateProfilePage /></RequireAuth>} />
          <Route path="/surveys" element={<RequireAuth><SurveyListPage /></RequireAuth>} />
          <Route path="/survey-history" element={<RequireRole role="INTERVIEWEE"><HistorySurvey /></RequireRole>} />
          <Route path="/user-profile" element={<RequireRole role="INTERVIEWEE"><UserProfilePage /></RequireRole>} />
          <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
          <Route path="/payment-result" element={<PaymentResultPage />} />
          <Route path="/service-package" element={<ServicePackage />} />
          <Route path="/create-surveys" element={<RequireRole role="INTERVIEWER"><CreateSurveys /></RequireRole>} />
          <Route path="/survey/:id" element={<RequireAuth><ViewSurvey /></RequireAuth>} />
          <Route path="/survey-review/:responseId" element={<RequireRole role="INTERVIEWEE"><ReviewSurvey /></RequireRole>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
