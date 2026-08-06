import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CoupleProvider } from './contexts/CoupleContext';
import { PresenceProvider } from './contexts/PresenceContext';
import PrivateRoute from './components/PrivateRoute';
import Nav from './components/Nav';
import BubbleBackground from './components/BubbleBackground';
import WelcomeScreen from './components/WelcomeScreen';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Player from './pages/Player';
import BucketList from './pages/BucketList';
import Settings from './pages/Settings';

function AppContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const welcomedUserRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useLayoutEffect(() => {
    if (loading) return;
    if (!user) {
      welcomedUserRef.current = null;
      setShowWelcome(false);
      return;
    }
    if (welcomedUserRef.current !== user.uid) {
      welcomedUserRef.current = user.uid;
      setShowWelcome(true);
    }
  }, [user, loading]);

  const finishWelcome = useCallback(() => {
    setShowWelcome(false);
    navigate('/', { replace: true });
  }, [navigate]);

  if (!loading && user && showWelcome) {
    return <WelcomeScreen user={user} onComplete={finishWelcome} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <BubbleBackground />
      <Nav />
      <main className="relative z-10 flex-1 p-4 sm:p-6">
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/watch" element={<PrivateRoute><Player /></PrivateRoute>} />
          <Route path="/bucket" element={<PrivateRoute><BucketList /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <SettingsProvider>
          <PresenceProvider>
            <AppContent />
          </PresenceProvider>
        </SettingsProvider>
      </CoupleProvider>
    </AuthProvider>
  );
}

export default App;
