import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Clock, AlertTriangle, CheckCircle, ChevronRight, User, 
  Shield, BarChart2, Activity, PieChart as PieChartIcon, Zap, TrendingUp, Layers, Trash2, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const navigate = useNavigate();

  const fetchAllData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [adminRes, analyticsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/dashboard/'),
        axios.get('http://localhost:8000/api/analytics/')
      ]);
      
      setTickets(adminRes.data.tickets);
      setStats(adminRes.data.stats);
      setCategoryStats(adminRes.data.category_stats);
      setAnalytics(analyticsRes.data);

      if (selectedTicket) {
        const updatedSelected = adminRes.data.tickets.find(t => t.id === selectedTicket.id);
        if (updatedSelected) setSelectedTicket(updatedSelected);
      }
    } catch (err) {
      if (!isBackground) setError("Failed to fetch administrative and analytics data.");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await axios.post(`http://localhost:8000/api/tickets/${id}/status/`, { status: 'Solved' });
      fetchAllData();
    } catch (err) {
      console.error("Failed to resolve ticket", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("FATAL ACTION: Permanently purge this ticket from the ledger?")) {
      try {
        await axios.delete(`http://localhost:8000/api/tickets/${id}/`);
        setSelectedTicket(null);
        fetchAllData();
      } catch (err) {
        console.error("Failed to delete ticket", err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'In Progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Assigned': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Raised': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-white/40 bg-white/5 border-white/10';
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title ? t.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-32">
      <div className="flex justify-between items-center">
         <button 
          onClick={() => navigate('/')}
          className="text-[10px] text-white/20 hover:text-white font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
         >
           ← EXIT ADMIN SECTOR
         </button>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                 transition={{ repeat: Infinity, duration: 2 }}
                 className="w-1.5 h-1.5 rounded-full bg-green-500" 
               />
               <span className="text-[8px] font-black text-green-500 uppercase tracking-widest leading-none">Live Monitoring</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
               <Shield className="text-red-500 w-4 h-4" />
               <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">ADMINISTRATIVE ACCESS GRANTED</span>
            </div>
         </div>
      </div>

      {/* MODULE 6: MODULE KPI CARDS SECTION */}
      <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Operational Metrics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Open Active</p>
            <h4 className="text-4xl font-black text-white tracking-tighter relative z-10">{analytics?.summary?.open || 0}</h4>
            <AlertTriangle className="absolute -right-4 -bottom-4 text-white/5 group-hover:text-white/10 transition-colors" size={100} />
         </motion.div>
         <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Total Resolved</p>
            <h4 className="text-4xl font-black text-green-500 tracking-tighter relative z-10">{analytics?.summary?.resolved || 0}</h4>
            <CheckCircle className="absolute -right-4 -bottom-4 text-green-500/5 group-hover:text-green-500/10 transition-colors" size={100} />
         </motion.div>
         <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.2}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">AI Auto-Resolved</p>
            <h4 className="text-4xl font-black text-blue-500 tracking-tighter relative z-10">{analytics?.summary?.auto_resolved || 0}</h4>
            <Zap className="absolute -right-4 -bottom-4 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" size={100} />
         </motion.div>
         <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.3}} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md relative overflow-hidden group">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Critical Escallations</p>
            <h4 className="text-4xl font-black text-red-500 tracking-tighter relative z-10">{analytics?.summary?.escalated || 0}</h4>
            <TrendingUp className="absolute -right-4 -bottom-4 text-red-500/5 group-hover:text-red-500/10 transition-colors" size={100} />
         </motion.div>
      </div>

      {/* MODULE 6: CHARTS AND VISUALIZATION SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Department Load Chart */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} className="text-blue-500" /> Department Load Volume
            </h4>
            <span className="text-[10px] text-white/30 uppercase font-black">Live Stats</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dept_load || []}>
                <XAxis 
                  dataKey="department" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold'}}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                  itemStyle={{color: '#fff', fontSize: '12px', fontWeight: 'bold'}}
                />
                <Bar dataKey="count" radius={[10, 10, 10, 10]}>
                  {
                    (analytics?.dept_load || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Categories Distribution */}
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
           <div className="flex items-center justify-between mb-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <PieChartIcon size={14} className="text-purple-500" /> Top 5 Recurring (7D)
            </h4>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.top_categories || []}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {
                    (analytics?.top_categories || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))
                  }
                </Pie>
                <Tooltip 
                  contentStyle={{backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                  itemStyle={{color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
             {(analytics?.top_categories || []).map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                      <span className="text-white/60">{cat.category || 'General'}</span>
                   </div>
                   <span className="text-white/40">{cat.count} Units</span>
                </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* MODULE 6: TABLE SECTION AND METRICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Avg Resolution Table */}
         <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 overflow-hidden">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
               <Clock size={14} className="text-green-500" /> Avg Resolution Time (By Segment)
            </h4>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-white/5">
                        <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Department Sector</th>
                        <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Average Lag</th>
                        <th className="pb-4 text-[9px] font-black text-white/20 uppercase tracking-widest text-right">Service Level</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {(analytics?.avg_res_time || []).map((row, idx) => (
                        <tr key={idx} className="group hover:bg-white/2">
                           <td className="py-4 text-[10px] font-bold text-white uppercase tracking-widest">{row.department}</td>
                           <td className="py-4 text-xs font-black text-white font-mono tracking-tighter">{row.avg_hours}H</td>
                           <td className="py-4 text-right px-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${row.avg_hours < 2 ? 'bg-green-500/10 text-green-500' : (row.avg_hours < 5 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500')}`}>
                                 {row.avg_hours < 2 ? 'Optimal' : (row.avg_hours < 5 ? 'Standard' : 'Delayed')}
                              </span>
                           </td>
                        </tr>
                     ))}
                     {(!analytics?.avg_res_time || analytics.avg_res_time.length === 0) && (
                        <tr><td colSpan="3" className="py-8 text-center text-[10px] text-white/20 uppercase font-black">No resolution data logged yet.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Auto-Resolution Success Metrics - Refined Centered Arrangement */}
         <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-full space-y-10">
            <div className="w-full space-y-3">
               <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                  <Activity size={14} className="text-orange-500" /> AI Autonomy Success Rate
               </h4>
               <p className="text-[10px] text-white/30 uppercase font-bold leading-relaxed max-w-[240px] mx-auto">
                  Calculated based on successful AI ticket resolutions verified by user feedback protocols.
               </p>
            </div>
            
            <div className="relative w-52 h-52 flex items-center justify-center group flex-shrink-0">
                <div className="absolute inset-0 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors duration-1000" />
                <svg className="w-full h-full transform -rotate-90 relative z-10">
                    <circle cx="104" cy="104" r="94" stroke="rgba(255,255,255,0.03)" strokeWidth="14" fill="transparent" />
                    <circle 
                    cx="104" cy="104" r="94" 
                    stroke="#f97316" strokeWidth="14" fill="transparent" 
                    strokeDasharray={590.6}
                    strokeDashoffset={590.6 - (590.6 * parseFloat(analytics?.auto_res_rate || '0')) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out shadow-[0_0_40px_rgba(249,115,22,0.5)]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 translate-y-1">
                    <span className="text-4xl font-black text-white tracking-widest bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 leading-none">{analytics?.auto_res_rate || '0%'}</span>
                </div>
            </div>

            <div className="w-full space-y-1">
                <h5 className="text-[14px] font-black text-orange-500 uppercase tracking-[0.5em]">Autonomous Accuracy</h5>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Aggregate Efficiency Index</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/5">
        {/* Main Ticket Ledger - Existing Feature */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4">
               <h4 className="text-sm font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                 <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                 Central Ticket Ledger
               </h4>
               <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Showing {Math.min(visibleCount, filteredTickets.length)} of {filteredTickets.length} Entries</span>
            </div>
            <div className="flex items-center gap-3 w-full xl:w-auto">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search ledger..."
                    value={searchTerm}
                    onChange={(e) => {
                       setSearchTerm(e.target.value);
                       setVisibleCount(10); // Reset count on search
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-red-500/50 outline-none transition-all"
                  />
               </div>
               <select 
                 value={statusFilter}
                 onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setVisibleCount(10); // Reset count on filter
                 }}
                 className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-white/40 uppercase outline-none focus:border-red-500/50 cursor-pointer"
               >
                 <option value="All" className="bg-[#121212]">Filter: All</option>
                 <option value="Raised" className="bg-[#121212]">Raised</option>
                 <option value="Assigned" className="bg-[#121212]">Assigned</option>
                 <option value="In Progress" className="bg-[#121212]">In Progress</option>
                 <option value="Solved" className="bg-[#121212]">Solved</option>
               </select>
            </div>
          </div>

          <div className="overflow-hidden border border-white/10 rounded-2xl bg-white/2 backdrop-blur-xl">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Subject</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTickets
                  .slice(0, visibleCount)
                  .map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTicket(t)}
                      className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedTicket?.id === t.id ? 'bg-white/5 border-l-2 border-red-500' : ''}`}
                    >
                      <td className="px-6 py-4 text-[10px] font-mono text-white/40">#{t.id.toString().padStart(4, '0')}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors uppercase truncate max-w-[200px]">{t.title}</p>
                        <p className="text-[9px] text-white/20 font-medium">{new Date(t.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-white/60 uppercase">{t.category || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase truncate max-w-[150px] text-right">
                        {t.employee ? t.employee.split('(')[0] : 'UNASSIGNED'}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
            
            {/* LOAD MORE BUTTON */}
            {visibleCount < filteredTickets.length && (
               <div className="p-4 bg-white/2 border-t border-white/5 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="px-8 py-2 bg-white/5 hover:bg-white/10 text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest rounded-full transition-all border border-white/5"
                  >
                     Show More Tickets ({filteredTickets.length - visibleCount} Remaining)
                  </button>
               </div>
            )}
          </div>
        </div>

        {/* Analytics & Detailed View Sidebar - Existing Feature */}
        <div className="space-y-6">
          {/* Category Distribution */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Category distribution ledger</h4>
            <div className="space-y-4">
              {categoryStats.map((stat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-white/60">{stat.category || 'Unknown'}</span>
                    <span className="text-white/40">{stat.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / (stats?.total || 1)) * 100}%` }}
                      className="h-full bg-red-500/50" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selection Detail */}
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur-xl border-l-4 border-l-red-500 shadow-2xl"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Extended Metadata</h3>
                  <button onClick={() => setSelectedTicket(null)} className="text-[10px] text-white/20 hover:text-white uppercase font-black">Close</button>
                </div>
                <div className="space-y-4">
                   <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                      <p className="text-white/80 text-xs leading-relaxed font-medium">{selectedTicket.description}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black tracking-widest">
                      <div className="space-y-1">
                        <p className="text-white/20">Sentiment</p>
                        <p className={selectedTicket.sentiment === 'Negative' ? 'text-red-500' : 'text-green-500'}>{selectedTicket.sentiment || 'Neutral'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/20">Resolution</p>
                        <p className="text-blue-500">{selectedTicket.resolution || 'Standard'}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                   {selectedTicket.status !== 'Solved' && (
                      <button 
                         onClick={() => handleResolve(selectedTicket.id)}
                         className="w-full py-3 bg-green-600/80 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                      >
                         <CheckCircle2 size={14} /> Resolve Ticket
                      </button>
                   )}
                   <button 
                      onClick={() => handleDelete(selectedTicket.id)}
                      className="w-full py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20 flex items-center justify-center gap-2"
                   >
                      <Trash2 size={14} /> Permanent Delete
                   </button>
                   <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10">
                      Generate Full Report
                   </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white/2 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                 <p className="text-[10px] font-black text-white/20 uppercase tracking-widest leading-loose">Select a ledger entry for deep analysis, status override, and administrative handling.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
