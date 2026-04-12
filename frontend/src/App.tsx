import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css'
import SignInPage from './page/SignInPage';
import SignUpPage from './page/SignUpPage';
import ForgotPasswordPage from './page/ForgotPass';
import DashboardPage from './page/DashboardPage';
import UpdateProfilePage from './page/UpdateProfilePage';
import SurveyListPage from './page/SurveyListPage';
import UserProfilePage from './page/UserProfilePage';
import ResetPasswordPage from './page/ResetPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/update-profile" element={<UpdateProfilePage />} />
        <Route path="/surveys" element={<SurveyListPage />} />
        <Route path="/user-profile" element={<UserProfilePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
