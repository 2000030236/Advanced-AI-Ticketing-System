import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Clock, AlertTriangle, CheckCircle, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusStepper from './StatusStepper';

const AssigneePortal = () => {
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [notesText, setNotesText] = useState('');
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  
  const selectedTicket = selectedAssignment?.ticket;

  const handleLogin = (e) => {
    e.preventDefault();
    if (tempEmail && tempEmail.includes('@')) {
      setEmail(tempEmail);
      setIsLoggedIn(true);
    }
  };

  const fetchTickets = async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:8000/api/assignee/tickets/?email=${email}`);
      setAssignments(response.data.assignments);
      setStats(response.data.stats);
    } catch (err) {
      setError("Failed to fetch assigned tickets.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.post(`http://localhost:8000/api/tickets/${id}/status/`, { status: newStatus });
      fetchTickets();
      if (selectedAssignment && selectedAssignment.ticket.id === id) {
          setSelectedAssignment(prev => ({
              ...prev,
              ticket: { ...prev.ticket, status: newStatus }
          }));
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleUpdateNotes = async () => {
      if (!selectedAssignment) return;
      try {
          await axios.post(`http://localhost:8000/api/assignee/tickets/${selectedAssignment.id}/notes/`, { notes: notesText });
          fetchTickets();
          setSelectedAssignment(prev => ({...prev, notes: notesText}));
      } catch (err) {
          console.error("Failed to update notes", err);
      }
  };

  const handleResolve = (id) => updateStatus(id, 'Solved');
  const handleStartWork = (id) => updateStatus(id, 'In Progress');

  useEffect(() => {
    if (isLoggedIn) fetchTickets();
  }, [isLoggedIn, email]);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  if (!isLoggedIn) {
     return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto mt-20 p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl"
        >
           <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 mx-auto">
                 <User className="text-blue-500 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Internal Access</h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">SECURE ASSIGNEE SECTOR</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Work Email</label>
                 <input 
                    type="email" 
                    required
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 focus:border-blue-500 transition-colors"
                 />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20"
              >
                 Authentication Request
              </button>
           </form>
        </motion.div>
     );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
         <button 
          onClick={() => navigate('/')}
          className="text-[10px] text-white/20 hover:text-white font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
         >
           ← Back to Customer Interface
         </button>
      </div>
      
      {/* KPI DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Solved</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-white tracking-tighter">{stats?.solved || 0}</h4>
               <CheckCircle className="text-green-500/40" size={24} />
            </div>
         </motion.div>
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Active Load</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-white tracking-tighter">{stats?.active || 0}</h4>
               <AlertTriangle className="text-blue-500/40" size={24} />
            </div>
         </motion.div>
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Avg Res. Time</p>
            <div className="flex items-end justify-between">
               <h4 className="text-4xl font-black text-white tracking-tighter">{stats?.avg_time || '0h'}</h4>
               <Clock className="text-purple-500/40" size={24} />
            </div>
         </motion.div>
      </div>

      {/* Header with identity */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <User className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{stats?.role || 'Enterprise Employee'}</h3>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">{email}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsLoggedIn(false)}
          className="px-6 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
        >
          Disconnect Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 py-2">
            <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
              Active Assignments ({assignments.length})
            </h4>
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
               <div className="relative flex-1 xl:flex-none xl:min-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:bg-white/10 focus:border-blue-500 transition-all outline-none"
                  />
               </div>
               <div className="flex items-center gap-2">
                 <select 
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[10px] font-black text-white/60 uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-white/10"
                 >
                   <option value="All" className="bg-[#121212]">Status: All</option>
                   <option value="Assigned" className="bg-[#121212]">Assigned</option>
                   <option value="In Progress" className="bg-[#121212]">In Progress</option>
                   <option value="Solved" className="bg-[#121212]">Solved</option>
                 </select>
                 <select 
                   value={severityFilter}
                   onChange={(e) => setSeverityFilter(e.target.value)}
                   className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[10px] font-black text-white/60 uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-white/10"
                 >
                   <option value="All" className="bg-[#121212]">Severity: All</option>
                   <option value="CRITICAL" className="bg-[#121212]">Critical</option>
                   <option value="HIGH" className="bg-[#121212]">High</option>
                   <option value="NORMAL" className="bg-[#121212]">Normal</option>
                 </select>
                 <select 
                   value={dateFilter}
                   onChange={(e) => setDateFilter(e.target.value)}
                   className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-[10px] font-black text-white/60 uppercase outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-white/10"
                 >
                   <option value="All" className="bg-[#121212]">Date: All Time</option>
                   <option value="Today" className="bg-[#121212]">Today</option>
                   <option value="Week" className="bg-[#121212]">Last 7 Days</option>
                   <option value="Month" className="bg-[#121212]">Last 30 Days</option>
                 </select>
               </div>
            </div>
          </div>

          {loading ? (
             <div className="h-64 flex items-center justify-center border border-white/5 rounded-2xl bg-white/2">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             </div>
          ) : assignments.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/2 text-center p-8">
               <AlertTriangle className="text-white/20 mb-4" size={32} />
               <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed"> No tickets currently assigned to this profile in the secondary storage table.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments
                .filter(a => {
                  const matchesSearch = a.ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       a.ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'All' || a.ticket.status === statusFilter;
                  const matchesSeverity = severityFilter === 'All' || a.ticket.severity === severityFilter;
                  
                  // Date Filtering Logic
                  const ticketDate = new Date(a.assigned_at);
                  const now = new Date();
                  let matchesDate = true;
                  if (dateFilter === 'Today') {
                    matchesDate = ticketDate.toDateString() === now.toDateString();
                  } else if (dateFilter === 'Week') {
                    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    matchesDate = ticketDate >= sevenDaysAgo;
                  } else if (dateFilter === 'Month') {
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    matchesDate = ticketDate >= thirtyDaysAgo;
                  }
                  
                  return matchesSearch && matchesStatus && matchesSeverity && matchesDate;
                })
                .map((assignment) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                      setSelectedAssignment(assignment);
                      setNotesText(assignment.notes || '');
                  }}
                  className={`group relative p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden ${
                    selectedAssignment?.id === assignment.id 
                    ? 'bg-blue-500/10 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${getSeverityColor(assignment.ticket.severity)}`}>
                          {assignment.ticket.severity}
                        </span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                          ID: #{assignment.ticket.id.toString().padStart(4, '0')}
                        </span>
                      </div>
                      <h5 className="text-white font-bold text-lg tracking-tight group-hover:text-blue-400 transition-colors">
                        {assignment.ticket.title}
                      </h5>
                      <div className="flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                         <span className="flex items-center gap-1.5"><CheckCircle size={12} /> {assignment.ticket.status}</span>
                      </div>
                    </div>
                    <ChevronRight className={`transition-transform duration-300 ${selectedAssignment?.id === assignment.id ? 'translate-x-1 text-blue-500' : 'text-white/20 grupp-hover:text-white/40'}`} />
                  </div>
                  
                  {/* Decorative corner */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed View Sidebar */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedAssignment ? (
              <motion.div
                key={selectedAssignment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="sticky top-8 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-8 backdrop-blur-xl"
              >
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Ticket Detail View</h4>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-white/80 text-sm leading-relaxed font-medium">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Category</span>
                    <p className="text-white text-xs font-bold uppercase">{selectedTicket.category || 'Uncategorized'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Department</span>
                    <p className="text-white text-xs font-bold uppercase">{selectedTicket.department || 'General'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">AI Analysis Context</h4>
                  <div className="space-y-4">
                     <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${selectedTicket.confidence}%` }}
                          className="absolute h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        />
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-white/40">Confidence Score</span>
                        <span className="text-blue-500">{selectedTicket.confidence}%</span>
                     </div>
                  </div>
                  <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-400 text-xs font-bold leading-relaxed italic">
                      AI Summary: {selectedTicket.summary || 'No summary available.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Assignee Notes</h4>
                  <div className="space-y-3">
                      <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder="Add problem details, fixes, and notes here..."
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm placeholder:text-white/20 focus:border-blue-500 transition-colors min-h-[100px]"
                      />
                      <button 
                          onClick={handleUpdateNotes}
                          className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                          Save Notes
                      </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                  {selectedTicket.status !== 'Solved' && selectedTicket.status !== 'Resolved' && (
                    <button 
                      onClick={() => handleResolve(selectedTicket.id)}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={14} /> Mark as Resolved
                    </button>
                  )}
                  <div className="flex gap-3">
                    {selectedTicket.status === 'Assigned' && (
                      <button 
                        onClick={() => handleStartWork(selectedTicket.id)}
                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                      >
                        Start Work
                      </button>
                    )}
                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">
                      Reassign
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-white/2 flex items-center justify-center">
                    <ChevronRight className="text-white/10" size={32} />
                 </div>
                 <p className="text-white/20 text-xs font-bold uppercase tracking-widest leading-relaxed">
                   Select an assignment from the primary table to view technical details, add notes, and manage status.
                 </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AssigneePortal;
