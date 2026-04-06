import React, { useState } from 'react';
import { Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TicketForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    onSubmit(formData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto glass-card p-8 shadow-2xl shadow-blue-500/5"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Intake Engine</h2>
          <p className="text-sm text-gray-400">Initialize a new support request for AI analysis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 ml-1">ISSUE TITLE</label>
          <input
            type="text"
            required
            disabled={loading}
            placeholder="e.g. Server down in US-EAST-1"
            className="w-full input-field placeholder:text-white/10"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 ml-1">DESCRIPTION</label>
          <textarea
            required
            disabled={loading}
            rows={5}
            placeholder="Describe the issue in detail for the AI engine..."
            className="w-full input-field placeholder:text-white/10 resize-none"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-400/10 text-red-400 rounded-xl border border-red-400/20 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing with AI...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>PROCESS TICKET</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default TicketForm;
