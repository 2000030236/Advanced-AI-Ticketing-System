import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

const StatusStepper = ({ currentStatus }) => {
  const steps = ['Raised', 'Assigned', 'In Progress', 'Solved', 'Closed'];
  
  // Logic: If status is Solved, the ticket is effectively Closed in the lifecycle
  const effectiveStatus = currentStatus === 'Solved' ? 'Closed' : currentStatus;
  const currentStepIndex = steps.indexOf(effectiveStatus);

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/5 -translate-y-1/2" />
        
        {/* Active Progress Line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <motion.div 
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted || isActive ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.05)',
                  borderColor: isCompleted || isActive ? 'rgb(59, 130, 246)' : 'rgba(255, 255, 255, 0.1)'
                }}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-shadow duration-300 ${isActive ? 'shadow-[0_0_20px_rgba(59,130,246,0.4)]' : ''}`}
              >
                {isCompleted ? (
                  <Check size={18} className="text-white" />
                ) : isActive ? (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Circle size={10} className="fill-white text-white" />
                  </motion.div>
                ) : (
                  <span className="text-[10px] font-black text-white/20">{index + 1}</span>
                )}
              </motion.div>
              
              <div className="absolute top-12 whitespace-nowrap text-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-blue-400' : isCompleted ? 'text-white/60' : 'text-white/20'}`}>
                  {step}
                </span>
                {isActive && (
                  <motion.span 
                    layoutId="active-dot"
                    className="block w-1 h-1 bg-blue-500 rounded-full mx-auto mt-1"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusStepper;
