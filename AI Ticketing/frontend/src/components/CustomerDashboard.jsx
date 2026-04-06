import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const CustomerDashboard = ({ userId, onRaiseComplaint, onViewTicket }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/auth/dashboard/?user_id=${userId}`);
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    
    // Feature: Real-time updates without refresh (Short Polling)
    const interval = setInterval(() => {
      fetchDashboard();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [userId]);

  const handleDelete = async (e, ticketId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this ticket?")) {
      try {
        await axios.delete(`http://localhost:8000/api/tickets/${ticketId}/`);
        // Refresh dashboard data
        fetchDashboard();
      } catch (err) {
        alert("Failed to delete ticket");
      }
    }
  };

  if (loading) {
    return <div className="text-center text-white/50 tracking-widest uppercase">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 tracking-widest uppercase">{error}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 relative">
        <div>
          <h2 className="text-3xl font-black text-white tracking-wider uppercase">Welcome Back</h2>
          <p className="text-white/40 uppercase tracking-widest text-xs mt-1">Here is the status of your complaints</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onRaiseComplaint}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl uppercase tracking-wider transition-colors"
          >
            Raise a Complaint
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setStatusFilter('All')}
          className={`cursor-pointer transition-all duration-300 bg-white/5 border p-6 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md hover:bg-white/10 ${statusFilter === 'All' ? 'border-white/40 scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-white/10 hover:border-white/20'}`}
        >
          <p className="text-white/40 uppercase tracking-widest text-xs font-bold mb-2">Total Raised</p>
          <p className="text-4xl text-white font-black">{data.stats.total}</p>
        </div>
        <div 
          onClick={() => setStatusFilter('In Progress')}
          className={`cursor-pointer transition-all duration-300 p-6 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md hover:bg-blue-500/20 ${statusFilter === 'In Progress' ? 'bg-blue-500/20 border-blue-500/50 scale-[1.02] shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40'}`}
        >
          <p className="text-blue-400 uppercase tracking-widest text-xs font-bold mb-2">In Progress</p>
          <p className="text-4xl text-blue-400 font-black">{data.stats.in_progress}</p>
        </div>
        <div 
          onClick={() => setStatusFilter('Solved')}
          className={`cursor-pointer transition-all duration-300 p-6 rounded-2xl flex flex-col justify-center items-center backdrop-blur-md hover:bg-green-500/20 ${statusFilter === 'Solved' ? 'bg-green-500/20 border-green-500/50 scale-[1.02] shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-green-500/10 border-green-500/20 hover:border-green-500/40'}`}
        >
          <p className="text-green-400 uppercase tracking-widest text-xs font-bold mb-2">Solved</p>
          <p className="text-4xl text-green-400 font-black">{data.stats.solved}</p>
        </div>
      </div>


      <div className="mt-12 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
               <h3 className="text-white font-bold tracking-widest uppercase text-xs opacity-60">Recent Tickets</h3>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-1.5 h-1.5 rounded-full bg-green-500" 
                  />
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live Updates</span>
               </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 min-w-[150px]"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white/60 uppercase outline-none focus:border-blue-500"
              >
                <option value="All" className="bg-[#0a0a0a]">Status: All</option>
                <option value="Raised" className="bg-[#0a0a0a]">Raised</option>
                <option value="Assigned" className="bg-[#0a0a0a]">Assigned</option>
                <option value="In Progress" className="bg-[#0a0a0a]">In Progress</option>
                <option value="Solved" className="bg-[#0a0a0a]">Solved</option>
              </select>
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white/60 uppercase outline-none focus:border-blue-500"
              >
                <option value="All" className="bg-[#0a0a0a]">Severity: All</option>
                <option value="CRITICAL" className="bg-[#0a0a0a]">Critical</option>
                <option value="HIGH" className="bg-[#0a0a0a]">High</option>
                <option value="MEDIUM" className="bg-[#0a0a0a]">Medium</option>
                <option value="LOW" className="bg-[#0a0a0a]">Low</option>
              </select>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white/60 uppercase outline-none focus:border-blue-500"
              >
                <option value="All" className="bg-[#0a0a0a]">Date: All Time</option>
                <option value="Today" className="bg-[#0a0a0a]">Today</option>
                <option value="Week" className="bg-[#0a0a0a]">Last 7 Days</option>
                <option value="Month" className="bg-[#0a0a0a]">Last 30 Days</option>
              </select>
           </div>
        </div>
        {data.tickets.length === 0 ? (
          <div className="p-8 text-center text-white/40 uppercase tracking-widest text-xs font-bold">
            No complaints found.
          </div>
        ) : (
          <ul className="p-4 space-y-3">
        {(() => {
          const filteredTickets = data.tickets.filter(ticket => {
            const matchesSearch = (ticket.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                                 (ticket.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'All' || 
                                 (statusFilter === 'In Progress' ? ['In Progress', 'Assigned'].includes(ticket.status) : ticket.status === statusFilter);
            
            const matchesSeverity = severityFilter === 'All' || (ticket.severity || '').toUpperCase() === severityFilter.toUpperCase();
            
            // Date Filtering Logic
            const ticketDate = new Date(ticket.created_at);
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Reset time for daily comparison
            const ticketDay = new Date(ticketDate);
            ticketDay.setHours(0, 0, 0, 0);

            let matchesDate = true;
            if (dateFilter === 'Today') {
              matchesDate = ticketDay.getTime() === now.getTime();
            } else if (dateFilter === 'Week') {
              const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
              matchesDate = ticketDate >= sevenDaysAgo;
            } else if (dateFilter === 'Month') {
              const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
              matchesDate = ticketDate >= thirtyDaysAgo;
            }
            
            return matchesSearch && matchesStatus && matchesSeverity && matchesDate;
          });

          if (filteredTickets.length === 0) {
            return (
              <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl mt-4">
                <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <p className="text-white/40 uppercase tracking-widest text-[10px] font-black">No tickets found matching your criteria</p>
                <button onClick={() => {setSearchTerm(''); setStatusFilter('All'); setSeverityFilter('All'); setDateFilter('All');}} className="mt-4 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:underline">Clear all filters</button>
              </div>
            );
          }

          return (
            <ul className="p-4 space-y-3">
              {filteredTickets.map((ticket) => (
                <motion.li 
                  key={ticket.id}
                  whileHover={{ scale: 1.01, x: 5 }}
                  onClick={() => onViewTicket(ticket)}
                  className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all cursor-pointer shadow-sm ${ticket.notifications && ticket.notifications.some(n => !n.is_read) ? 'border-l-4 border-l-blue-500 bg-blue-900/10' : ''}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold tracking-wide">
                        {ticket.title}
                      </h4>
                      {ticket.notifications && ticket.notifications.some(n => !n.is_read) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[8px] font-black bg-blue-500 text-white uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                          New
                        </span>
                      )}
                    </div>

                    <p className="text-white/30 text-[10px] mt-1.5 uppercase tracking-[0.1em] font-bold">
                      {new Date(ticket.created_at).toLocaleDateString()} · {ticket.category || 'General'} · <span className={`${ticket.severity?.toUpperCase() === 'CRITICAL' ? 'text-red-500/80' : 'text-blue-400/80'}`}>{ticket.severity}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-xl border transition-all duration-300 shadow-lg ${
                      ticket.status === 'Solved' ? 'bg-green-500/10 border-green-500/30 shadow-green-500/5' : 
                      ticket.status === 'Raised' ? 'bg-white/5 border-white/10 shadow-white/5' : 
                      'bg-blue-500/10 border-blue-500/30 shadow-blue-500/5'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                        ticket.status === 'Solved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                        ticket.status === 'Raised' ? 'bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 
                        'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                      }`} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                        ticket.status === 'Solved' ? 'text-green-400' : 
                        ticket.status === 'Raised' ? 'text-white/50' : 
                        'text-blue-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, ticket.id)}
                      className="p-2.5 bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 rounded-lg text-red-400 group/del transition-all"
                      title="Delete Ticket"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 opacity-50 group-hover/del:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          );
        })()}

          </ul>
        )}

      </div>
    </motion.div>
  );
};

export default CustomerDashboard;
