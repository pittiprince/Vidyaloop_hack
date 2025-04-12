import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicRoute from './components/PublicRoute.jsx';
import { Signup } from './components/Signup.jsx';
import Login from './components/Login.jsx';
import VerifyOtp from './components/VerifyOtp.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<VerifyOtp />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}
