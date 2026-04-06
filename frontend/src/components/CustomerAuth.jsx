import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

const CustomerAuth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    if (email.toLowerCase() === 'admin') return true;
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation checks
    if (!validateEmail(email)) {
        setError('Please enter a valid email address or admin identifier');
        return;
    }

    if (!isLogin && fullName.trim().length < 2) {
        setError('Please enter your full name');
        return;
    }

    if (password.length < 4) {
        setError('Password must be at least 4 characters long');
        return;
    }

    if (!isLogin && password !== confirmPassword) {
        setError('Passwords do not match');
        return;
    }

    setLoading(true);
    
    const endpoint = isLogin ? 'login' : 'register';
    
    try {
      const response = await axios.post(`http://localhost:8000/api/auth/${endpoint}/`, {
        email,
        password,
        name: fullName
      });
      
      const { user_id, role, name, email: resEmail } = response.data;
      onLogin(user_id, resEmail || email, role || 'customer', name);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto w-full p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
    >
      <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wider">
        {isLogin ? 'CUSTOMER LOGIN' : 'CREATE ACCOUNT'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4">
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
              placeholder="Enter your full name"
              required
            />
          </motion.div>
        )}
        
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Email / Identifier</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
            placeholder="Enter your email or admin ID"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
            placeholder="Enter your password"
            required
          />
        </div>

        {!isLogin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2 mt-4">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-white/20"
              placeholder="Confirm your password"
              required
            />
          </motion.div>
        )}
        
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white font-bold tracking-wider uppercase transition-colors mt-6 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Access Portal' : 'Register')}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </motion.div>
  );
};

export default CustomerAuth;
