import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MemberDashboard from './pages/MemberDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicHome from './pages/PublicHome';
import SignupPage from './pages/SignupPage';
import Layout from './components/Layout';
import { Role, Member } from './types';

function App() {
  const [showPortal, setShowPortal] = useState(false);
  const [registrationPlan, setRegistrationPlan] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(() => {
    const saved = localStorage.getItem('cofit_role');
    return (saved as Role) || null;
  });

  const handleLogin = (selectedRole: Role, userId?: string) => {
    setRole(selectedRole);
    localStorage.setItem('cofit_role', selectedRole);
    if (userId) {
      localStorage.setItem('cofit_user_id', userId);
    }
  };

  const handleStartRegistration = (plan: string) => {
    setRegistrationPlan(plan);
  };

  const handleSignupComplete = (member: Member) => {
    setRole('member');
    setRegistrationPlan(null);
    setShowPortal(true);
    localStorage.setItem('cofit_role', 'member');
    localStorage.setItem('cofit_user_id', member.id);
  };

  const handleLogout = () => {
    setRole(null);
    setShowPortal(false);
    setRegistrationPlan(null);
    localStorage.removeItem('cofit_role');
    localStorage.removeItem('cofit_user_id');
  };

  if (registrationPlan) {
    return (
      <SignupPage 
        plan={registrationPlan} 
        onSignupComplete={handleSignupComplete} 
        onBack={() => setRegistrationPlan(null)} 
      />
    );
  }

  if (!showPortal && !role) {
    return <PublicHome onEnterPortal={() => setShowPortal(true)} onStartRegistration={handleStartRegistration} />;
  }

  if (!role) {
    return <LandingPage onLogin={handleLogin} onBack={() => setShowPortal(false)} />;
  }

  return (
    <BrowserRouter>
      <Layout role={role} onLogout={handleLogout}>
        <Routes>
          {role === 'member' && (
            <>
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/trainer" element={<MemberDashboard />} />
              <Route path="/member/progress" element={<MemberDashboard />} />
              <Route path="/member/profile" element={<MemberDashboard />} />
              <Route path="/member/payments" element={<MemberDashboard />} />
              <Route path="*" element={<Navigate to="/member" replace />} />
            </>
          )}
          {role === 'trainer' && (
            <>
              <Route path="/trainer" element={<TrainerDashboard />} />
              <Route path="/trainer/members" element={<TrainerDashboard />} />
              <Route path="/trainer/schedule" element={<TrainerDashboard />} />
              <Route path="/trainer/profile" element={<TrainerDashboard />} />
              <Route path="*" element={<Navigate to="/trainer" replace />} />
            </>
          )}
          {role === 'admin' && (
            <>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<AdminDashboard />} />
              <Route path="/admin/trainers" element={<AdminDashboard />} />
              <Route path="/admin/payments" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
