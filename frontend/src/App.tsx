import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css'
import AppShell from './assets/components/AppShell';
import SignInPage from './page/SignInPage';
import SignUpPage from './page/SignUpPage';
import ForgotPasswordPage from './page/ForgotPass';
import DashboardPage from './page/DashboardPage';
import DashboardAdmin from './page/DashboardAdmin';
import HomePage from './page/HomePage';
import CreatorPackagePage from './page/CreatorPackagePage';
import UpdateProfilePage from './page/UpdateProfilePage';
import SurveyListPage from './page/SurveyListPage';
import UserProfilePage from './page/UserProfilePage';
import ResetPasswordPage from './page/ResetPasswordPage';
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
  if (role === 'ROLE_ADMIN') {
    return '/dashboard-admin';
  }
  if (role === 'ROLE_INTERVIEWER') {
    return '/dashboard';
  }
  return '/user-profile';
};

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireRole = ({ role, children }: { role: string; children: JSX.Element }) => {
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');
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
          <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
          <Route path="/dashboard" element={<RequireRole role="ROLE_INTERVIEWER"><DashboardPage /></RequireRole>} />
          <Route path="/dashboard-admin" element={<RequireRole role="ROLE_ADMIN"><DashboardAdmin /></RequireRole>} />
          <Route path="/creator-package" element={<CreatorPackagePage />} />
          <Route path="/update-profile" element={<RequireAuth><UpdateProfilePage /></RequireAuth>} />
          <Route path="/surveys" element={<RequireAuth><SurveyListPage /></RequireAuth>} />
          <Route path="/user-profile" element={<RequireRole role="ROLE_INTERVIEWEE"><UserProfilePage /></RequireRole>} />
          <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
