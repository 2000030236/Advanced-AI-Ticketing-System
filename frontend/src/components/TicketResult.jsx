import React from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Zap, 
  RefreshCcw,
  Smile,
  ShieldCheck,
  TrendingUp,
  Ticket as TicketIcon,
  ThumbsUp,
  ThumbsDown,
  MessageSquareQuote,
  UserPlus,
  Mail,
  Activity,
  BarChart3,
  Database,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusStepper from './StatusStepper';

const TicketResult = ({ ticket, onReset }) => {
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showMessages, setShowMessages] = React.useState(false);

  const handleFeedback = async (isHelpful) => {
    try {
      await axios.post(`http://localhost:8000/api/tickets/${ticket.id}/feedback/`, {
        helpful: isHelpful
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Failed to send feedback", err);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-green-600 text-white';
      case 'Low': return 'bg-blue-500 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getSentimentIcon = (sent) => {
    switch (sent) {
      case 'Frustrated': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'Polite': return <Smile className="w-5 h-5 text-green-400" />;
      default: return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const renderFormattedAnswer = (answer) => {
    if (!answer) return null;
    const sections = answer.split(/(RESOLUTION:|IMPLEMENTATION:|NEXT STEPS:)/g).filter(x => x.trim());
    
    return sections.map((part, index) => {
      if (['RESOLUTION:', 'IMPLEMENTATION:', 'NEXT STEPS:'].includes(part)) {
        return (
          <span key={index} className="block mt-6 mb-2 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
            {part.replace(':', '')}
          </span>
        );
      }
      return (
        <span key={index} className="block text-lg text-white/90 leading-relaxed font-medium">
          {part.trim()}
        </span>
      );
    });
  };

  const profile = ticket.assigned_profile || {};

  return (
    <div className="relative">
      <AnimatePresence>
        {showProfile && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl overflow-hidden shadow-2xl relative border-white/10"
            >
              <button 
                onClick={() => setShowProfile(false)}
                className="absolute top-6 right-6 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-10 border-b border-white/10">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <UserPlus className="w-12 h-12 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold text-white tracking-tight">{profile.name}</h2>
                    <p className="text-blue-400 font-medium tracking-wide uppercase text-xs">{profile.role}</p>
                    <div className="flex items-center gap-2 text-white/40 pt-2">
                       <Mail className="w-4 h-4" />
                       <span className="text-sm">{profile.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 bg-[#0a0c10]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> AVG RESOLUTION
                    </p>
                    <p className="text-2xl font-bold text-white tracking-tight">{profile.avg_resolution_time}h</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3" /> TOTAL RESOLVED
                    </p>
                    <p className="text-2xl font-bold text-white tracking-tight">{profile.tickets_resolved}+</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity className="w-3 h-3" /> CURRENT LOAD
                    </p>
                    <p className="text-2xl font-bold text-white tracking-tight">{profile.current_load} Active</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap className="w-3 h-3" /> STATUS
                    </p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${profile.availability === 'Available' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {profile.availability}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-3 h-3" /> SPECIALIZED SKILLS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills || []).map((skill, i) => (
                      <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white/80">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5">
                   <div className="bg-blue-500/5 p-4 rounded-xl flex items-start gap-4">
                      <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5" />
                      <p className="text-xs text-white/40 leading-relaxed italic">
                        Elite Matching Protocol: This expert was selected because their technical proficiency matches "{ticket.category}" requirements with highest historical correlation.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto w-full p-8 rounded-3xl bg-[#0a0a0a] border border-white/5 relative shadow-2xl"
      >
      {ticket.notifications && ticket.notifications.length > 0 && (
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={async () => {
              const unreadCount = ticket.notifications.filter(n => !n.is_read).length;
              if (!showMessages && unreadCount > 0) {
                try {
                  await axios.post(`http://localhost:8000/api/tickets/${ticket.id}/notifications/read/`);
                  // Update locally
                  ticket.notifications.forEach(n => n.is_read = true);
                } catch (err) {
                  console.error("Failed to mark notifications read", err);
                }
              }
              setShowMessages(!showMessages);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-colors relative"
            title="Ticket Updates"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {ticket.notifications.some(n => !n.is_read) && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-bold justify-center items-center">
                  {ticket.notifications.filter(n => !n.is_read).length}
                </span>
              </span>
            )}
          </button>



          <AnimatePresence>
            {showMessages && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-4 w-[350px] max-h-[500px] flex flex-col bg-[#0f1115]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-[100] overflow-hidden"
              >
                <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Communication Log</span>
                  </div>
                  <button 
                    onClick={() => setShowMessages(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {ticket.notifications.map((notif, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={notif.id} 
                      className="group relative p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <div className="space-y-2">
                          <p className="text-sm text-white/80 leading-relaxed font-medium">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="p-4 bg-black/40 border-t border-white/5">
                  <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.2em] font-bold">
                    SECURE COMMUNICATION CHANNEL STABLE
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Analysis Complete</h2>
            <p className="text-sm text-white/40">Reference ID: {ticket.id}</p>
          </div>
        </div>
        <button 
          onClick={onReset}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
        >
          <RefreshCcw className="w-5 h-5 text-white/60 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      <div className="glass-card p-8 bg-blue-500/5">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-4 text-center">Ticket Lifecycle Progress</h4>
        <StatusStepper currentStatus={ticket.status} />
      </div>

      {ticket.resolution === 'Auto-resolve' && ticket.ai_answer && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden border-blue-500/30"
        >
           <div className="bg-blue-500/10 p-6 flex items-start gap-4 border-b border-white/10">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                 <MessageSquareQuote className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest">AI Resolution Provided</h3>
                 <p className="text-xs text-white/40">Our core engine has determined an immediate solution.</p>
              </div>
           </div>
           <div className="p-8">
              {renderFormattedAnswer(ticket.ai_answer)}
              
              <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between">
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Was this solution helpful?</p>
                 {!feedbackSent ? (
                    <div className="flex gap-4">
                       <button 
                         onClick={() => handleFeedback(true)}
                         className="flex items-center gap-2 px-6 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-green-500/20"
                       >
                          <ThumbsUp className="w-3 h-3" /> Yes
                       </button>
                       <button 
                         onClick={() => handleFeedback(false)}
                         className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-red-500/20"
                       >
                          <ThumbsDown className="w-3 h-3" /> No
                       </button>
                    </div>
                 ) : (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-bold text-green-400 uppercase tracking-widest"
                    >
                       Thank you for your feedback!
                    </motion.p>
                 )}
              </div>
           </div>
        </motion.div>
      )}

      {ticket.resolution === 'Assign' && ticket.employee && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden border-orange-500/30"
        >
           <div className="bg-orange-500/10 p-6 flex items-start gap-4 border-b border-white/10">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                 <UserPlus className="w-6 h-6 text-orange-400" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Assigned Service Expert</h3>
                 <p className="text-xs text-white/40">This ticket has been delegated to a specialized human resource.</p>
              </div>
           </div>
           <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/5 rounded-full border border-white/10">
                       <UserPlus className="w-8 h-8 text-white/60" />
                    </div>
                    <div>
                       <p className="text-2xl font-bold text-white tracking-tight">{ticket.employee.split(' (')[0]}</p>
                       <p className="text-sm text-white/40">{ticket.employee.split(' (')[1]?.replace(')', '')}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowProfile(true)}
                   className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white/60 transition-all hover:text-white"
                 >
                    Show Full Profile
                 </button>
              </div>
              
              <div className="pt-8 border-t border-white/5">
                 <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Elite Intelligence Assignment Criteria</h4>
                 <div className="grid grid-cols-3 gap-8">
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-green-400" />
                       <span className="text-xs text-white/60">Targeted Skill Match</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-green-400" />
                       <span className="text-xs text-white/60">Live Availability Verified</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-4 h-4 text-green-400" />
                       <span className="text-xs text-white/60">Balanced Workload (Low Load)</span>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Analysis Card */}
        <div className="md:col-span-2 glass-card p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/20 uppercase tracking-widest">Executive Summary</h3>
            <p className="text-lg text-white leading-relaxed font-medium">
              {ticket.summary}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <TicketIcon className="w-3 h-3" /> CATEGORY
              </span>
              <p className="text-sm font-semibold text-white bg-white/5 py-2 px-4 rounded-lg inline-block border border-white/5">
                {ticket.category}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3 h-3" /> DEPARTMENT
              </span>
              <p className="text-sm font-semibold text-white bg-white/5 py-2 px-4 rounded-lg inline-block border border-white/5">
               {ticket.department}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> ESTIMATED TIME
              </span>
              <p className="text-sm font-semibold text-blue-400">
                {ticket.estimated_time}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> CONFIDENCE
              </span>
              <div className="flex items-center gap-3">
                 <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${ticket.confidence}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                 </div>
                 <span className="text-xs font-mono text-white/60">{ticket.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">INITIAL SEVERITY</span>
             <div className={`badge ${getSeverityColor(ticket.severity)} px-6 py-2 text-sm font-bold shadow-xl shadow-red-500/10`}>
                {ticket.severity}
             </div>
          </div>

          <div className="glass-card p-6 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">RESOLUTION PATH</span>
                {ticket.resolution === 'Auto-resolve' ? <Zap className="w-4 h-4 text-yellow-400" /> : <RefreshCcw className="w-4 h-4 text-blue-400" />}
             </div>
             <p className="text-lg font-bold text-white">{ticket.resolution}</p>
             <p className="text-xs text-white/30">System indicates immediate {ticket.resolution.toLowerCase()} based on priority rules.</p>
          </div>

          {ticket.success_rate !== null && (
            <div className="glass-card p-6 space-y-4 bg-blue-500/5">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-[#6ed4f9]">Category Success Rate</span>
                  <ShieldCheck className="w-4 h-4 text-[#6ed4f9]" />
               </div>
               <div className="flex items-end gap-2">
                  <p className="text-2xl font-black text-white">{ticket.success_rate}%</p>
                  <p className="text-[10px] text-white/40 font-bold mb-1 uppercase tracking-widest">Satisfaction Score</p>
               </div>
               <p className="text-[10px] text-white/30 italic leading-relaxed">
                  Based on historic user feedback for "{ticket.category}" tickets.
               </p>
            </div>
          )}

          <div className="glass-card p-6 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">USER SENTIMENT</span>
                {getSentimentIcon(ticket.sentiment)}
             </div>
             <p className="text-lg font-bold text-white">{ticket.sentiment}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center p-4">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em]">AI Core v2.0 • Ticketing Analysis & Resolution Engine • System: Stable</p>
      </div>
    </motion.div>
    </div>
  );
};

export default TicketResult;
