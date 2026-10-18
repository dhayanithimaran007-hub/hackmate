import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyHackathonsPage from './pages/MyHackathonsPage';
import DiscoverHackathonsPage from './pages/DiscoverHackathonsPage';
import PostHackathonPage from './pages/PostHackathonPage';
import EditHackathonPage from './pages/EditHackathonPage';
import HackathonDetailsPage from './pages/HackathonDetailsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import MyTeamRequestsPage from './pages/MyTeamRequestsPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import DiscoverDevelopersPage from './pages/DiscoverDevelopersPage';
import NotFoundPage from './pages/NotFoundPage';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import Navbar from './components/layout/Navbar';

function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.05, opacity: 0, y: -10 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-bold text-5xl md:text-7xl uppercase tracking-tight text-center leading-[1.05]"
      >
        HACK<br/><span className="text-accent">MATE</span>
      </motion.div>
    </motion.div>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 flex flex-col w-full"
    >
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
        <Route path="/discover" element={<PageWrapper><DiscoverHackathonsPage /></PageWrapper>} />
        <Route path="/hackathons/:id" element={<PageWrapper><HackathonDetailsPage /></PageWrapper>} />
        <Route path="/developers" element={<PageWrapper><DiscoverDevelopersPage /></PageWrapper>} />
        <Route path="/profile/:username" element={<PageWrapper><PublicProfilePage /></PageWrapper>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<PageWrapper><ProtectedRoute><DashboardPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/hackathons" element={<PageWrapper><ProtectedRoute><MyHackathonsPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/hackathons/new" element={<PageWrapper><ProtectedRoute><PostHackathonPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/hackathons/:id/edit" element={<PageWrapper><ProtectedRoute><EditHackathonPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/my-applications" element={<PageWrapper><ProtectedRoute><MyApplicationsPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/team-requests" element={<PageWrapper><ProtectedRoute><MyTeamRequestsPage /></ProtectedRoute></PageWrapper>} />
        <Route path="/profile" element={<PageWrapper><ProtectedRoute><ProfilePage /></ProtectedRoute></PageWrapper>} />

        {/* 404 Fallback */}
        <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('hasSeenIntro');
      if (!hasSeen) {
        sessionStorage.setItem('hasSeenIntro', 'true');
        return true;
      }
    }
    return false;
  });

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AnimatePresence>
            {showIntro && <IntroAnimation onComplete={handleIntroComplete} key="intro" />}
          </AnimatePresence>
          
          <div className="min-h-screen flex flex-col w-full bg-background">
            <Navbar />
            <AnimatedRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
