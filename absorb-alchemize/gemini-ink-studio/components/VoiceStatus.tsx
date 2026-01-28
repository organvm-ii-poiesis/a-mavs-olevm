/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Mic, MicOff, Activity, Loader2 } from 'lucide-react';
import { LiveState } from '../types';

interface VoiceStatusProps {
  liveState: LiveState;
  toggleLive: () => void;
}

const VoiceStatus: React.FC<VoiceStatusProps> = ({ liveState, toggleLive }) => {
  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none">
      <button 
        onClick={toggleLive}
        className={`pointer-events-auto rounded-full h-12 px-6 transition-all duration-300 shadow-lg mb-4 flex items-center justify-center gap-2 border ${
          liveState.isConnected 
            ? liveState.isSpeaking 
                ? 'bg-blue-500 border-blue-400 text-white shadow-blue-500/50 scale-105'
                : 'bg-green-500 border-green-400 text-white shadow-green-500/50' 
            : 'bg-white/90 border-gray-200 text-gray-700 hover:bg-white'
        } backdrop-blur-md`}
      >
        {liveState.isConnected ? (
           liveState.isSpeaking ? <Activity size={18} className="animate-pulse" /> : <Mic size={18} />
        ) : (
           <MicOff size={18} />
        )}
        
        <span className="text-xs font-bold uppercase tracking-wider min-w-[60px] text-center">
          {liveState.isConnected 
            ? (liveState.isSpeaking ? 'Speaking' : 'Listening') 
            : 'Start AI'}
        </span>
      </button>

      {liveState.error && (
        <div className="bg-red-500/90 backdrop-blur text-white px-4 py-2 rounded-lg text-xs font-bold animate-in fade-in slide-in-from-top-2">
          {liveState.error}
        </div>
      )}
    </div>
  );
};

export default VoiceStatus;