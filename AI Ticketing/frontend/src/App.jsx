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

  const handleLogin = (id, email, role) => {
    setUserId(id);
    setUserEmail(email);
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('customerId', id);
    localStorage.setItem('customerEmail', email);
    localStorage.setItem('userRole', role);
    
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
    setIsAuthenticated(false);
    setUserId(null);
    setUserEmail('');
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
      <Header />
      <main className="relative min-h-[60vh] flex flex-col justify-center">
        {!isAuthenticated ? (
          <CustomerAuth onLogin={handleLogin} />
        ) : (
          <AnimatePresence mode="wait">
            <div className="absolute top-4 right-4 flex space-x-4 items-center z-10">
              <span className="text-white/50 text-sm tracking-widest uppercase hidden md:inline">Logged in as {userEmail} ({userRole})</span>
              {userRole === 'admin' && (
                <button onClick={() => navigate('/admin')} className="text-red-400 hover:text-red-300 text-xs tracking-widest uppercase font-black px-3 py-1 border border-red-500/20 rounded-full">Admin Panel</button>
              )}
              {showForm && (
                <button onClick={handleBackToDashboard} className="text-white/50 hover:text-white text-xs tracking-widest uppercase">Dashboard</button>
              )}
              <button onClick={handleLogout} className="text-blue-400 hover:text-blue-300 text-xs tracking-widest uppercase">Logout</button>
            </div>
            
            {!showForm && !ticket ? (
               <motion.div
                 key="dashboard"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 transition={{ duration: 0.3 }}
                 className="pt-16 w-full"
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
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-12 text-center space-y-4 pt-12">
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="pt-12"
              >
                <div className="mb-6 flex justify-center space-x-4">
                  <button onClick={handleBackToDashboard} className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors">
                    ← Back to Dashboard
                  </button>
                </div>
                <TicketResult ticket={ticket} onReset={() => handleSetTicket(null)} />
              </motion.div>
            )}
          </AnimatePresence>
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
