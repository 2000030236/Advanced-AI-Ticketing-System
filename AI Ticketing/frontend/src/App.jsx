import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import TicketForm from './components/TicketForm';
import TicketResult from './components/TicketResult';
import AssigneePortal from './components/AssigneePortal';
import CustomerAuth from './components/CustomerAuth';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate } from 'react-router-dom';

// New Customer Portal Screen Component
const CustomerPortal = () => {
  const [ticket, setTicket] = useState(() => {
    const saved = localStorage.getItem('currentTicket');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('customerId')
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem('customerEmail') || ''
  );
  const [userName, setUserName] = useState(
    localStorage.getItem('userName') || ''
  );
  const [userId, setUserId] = useState(
    localStorage.getItem('customerId') || null
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem('userRole') || 'customer'
  );
  
  const [showForm, setShowForm] = useState(() => {
    return localStorage.getItem('showForm') === 'true';
  });

  const navigate = useNavigate();

  const handleSetTicket = (newTicket) => {
    setTicket(newTicket);
    if (newTicket) {
      localStorage.setItem('currentTicket', JSON.stringify(newTicket));
    } else {
      localStorage.removeItem('currentTicket');
    }
  };

  // Feature: Real-time ticket synchronization
  // If a user is viewing a result, poll the backend for updates every 5 seconds
  React.useEffect(() => {
    let intervalId;
    if (ticket && ticket.id) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`http://localhost:8000/api/tickets/${ticket.id}/`);
          // Only update if something actually changed to avoid unnecessary re-renders
          if (JSON.stringify(response.data) !== JSON.stringify(ticket)) {
            handleSetTicket(response.data);
          }
        } catch (err) {
          console.error("Polling sync failed", err);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [ticket?.id]);

  const handleLogin = (id, email, role, name) => {
    setUserId(id);
    setUserEmail(email);
    setUserRole(role);
    setUserName(name || '');
    setIsAuthenticated(true);
    localStorage.setItem('customerId', id);
    localStorage.setItem('customerEmail', email);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name || '');
    
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'assignee') {
      navigate('/portal');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerId');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserId(null);
    setUserEmail('');
    setUserName('');
    setUserRole('customer');
    setTicket(null);
    setShowForm(false);
    localStorage.removeItem('currentTicket');
    localStorage.removeItem('showForm');
  };

  const handleRaiseComplaint = () => {
    setShowForm(true);
    localStorage.setItem('showForm', 'true');
  };
  
  const handleBackToDashboard = () => {
    handleSetTicket(null);
    setShowForm(false);
    localStorage.removeItem('showForm');
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { ...data, user_id: userId };
      const response = await axios.post('http://localhost:8000/api/tickets/', payload);
      handleSetTicket(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "AI Core analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header 
        isAuthenticated={isAuthenticated}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={handleLogout}
        onBackToDashboard={handleBackToDashboard}
        isFormOrResult={showForm || !!ticket}
      />
      <main className="relative min-h-[60vh] flex flex-col items-center">
        {!isAuthenticated ? (
          <div className="min-h-screen flex items-center justify-center">
            <CustomerAuth onLogin={handleLogin} />
          </div>
        ) : (
          <div className="w-full">
            <AnimatePresence mode="wait">
              {!showForm && !ticket ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="pt-8 w-full"
                >
                  <CustomerDashboard 
                    userId={userId} 
                    onRaiseComplaint={handleRaiseComplaint} 
                    onViewTicket={(t) => handleSetTicket(t)} 
                  />
                </motion.div>
              ) : showForm && !ticket ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8 text-center space-y-4 pt-6">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                      The Power of <span className="text-blue-500">Autonomous</span> Support
                    </h2>
                    <p className="text-white/40 text-sm md:text-base font-medium max-w-xl mx-auto uppercase tracking-widest leading-loose">
                       Multi-vector AI engine for enterprise ticket intake and processing.
                    </p>
                  </div>
                  <TicketForm onSubmit={handleSubmit} loading={loading} />
                  {error && <p className="mt-6 text-center text-red-500 text-sm font-semibold uppercase tracking-widest">{error}</p>}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="pt-6"
                >
                  <div className="mb-10 flex justify-center">
                    <button 
                      onClick={handleBackToDashboard} 
                      className="group flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-blue-400 transition-all duration-300 shadow-xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>
                  <TicketResult ticket={ticket} onReset={() => handleSetTicket(null)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </main>
      <footer className="mt-24 border-t border-white/5 py-8 flex flex-col md:flex-row items-center justify-between gap-4 grayscale opacity-40">
         <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest tracking-[0.4em]">© 2026 ADVANCED AI TICKETING SYSTEMS INC.</p>
         <div className="flex gap-8 text-[10px] items-center text-white/40 font-bold uppercase tracking-widest tracking-[0.3em]">
            <span className="cursor-pointer hover:text-white transition-colors uppercase tracking-[0.3em]">Privacy Protocol</span>
            <span className="cursor-pointer hover:text-white transition-colors uppercase tracking-[0.3em]">Compliance Documentation</span>
            <span className="cursor-pointer hover:text-white transition-colors uppercase tracking-[0.3em]">Node Status</span>
         </div>
      </footer>
    </>
  );
};

const App = () => {
  return (
    <div className="min-h-screen gradient-bg p-4 md:p-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<CustomerPortal />} />
          <Route path="/portal" element={<AssigneePortal />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
