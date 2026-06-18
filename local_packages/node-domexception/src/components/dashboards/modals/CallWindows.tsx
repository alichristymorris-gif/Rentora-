import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Volume2, 
  VolumeX,
  User,
  Radio,
  Timer
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { AppUser } from '../../types';

export function CallInterfaceManager({ currentUser }: { currentUser: AppUser | null }) {
  const { 
    activeCall, 
    incomingCall, 
    localStream, 
    remoteStream, 
    isMuted, 
    isCameraOff, 
    callDuration, 
    isSimulated,
    answerCall, 
    declineCall, 
    hangUp, 
    toggleMute, 
    toggleCamera 
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Sync streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, activeCall]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {/* 1. Incoming Call Prompt */}
      {incomingCall && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-[9999] w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-dark-border p-6 rounded-[32px] shadow-2xl transition-colors"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center overflow-hidden">
                {incomingCall.callerPhoto ? (
                  <img src={incomingCall.callerPhoto} alt={incomingCall.callerName} className="w-full h-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 animate-pulse">
                {incomingCall.type === 'video' ? <Video size={10} /> : <Phone size={10} />}
              </div>
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-none mb-1">
                {incomingCall.callerName}
              </h4>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-dark-muted animate-pulse">
                Incoming {incomingCall.type} Call...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={declineCall}
              className="py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <PhoneOff size={16} /> Decline
            </button>
            <button
              onClick={answerCall}
              className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              <Phone size={16} /> Answer
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Full Active Call Dialogue Screen */}
      {activeCall && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden"
        >
          {/* Header context */}
          <div className="absolute top-8 left-8 right-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs uppercase font-black tracking-widest text-slate-400">
                SECURE END-TO-END {activeCall.type} CALL
              </span>
            </div>
            {isSimulated && (
              <span className="px-3 py-1.5 bg-yellow-500/20 text-yellow-500 rounded-lg text-[9px] font-black uppercase tracking-wider">
                Sandbox Connected
              </span>
            )}
          </div>

          {/* Central Media Window */}
          <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl flex flex-col items-center justify-center mb-8">
            {activeCall.status === 'ringing' ? (
              // Status: Outgoing Ringing Screen
              <div className="text-center p-8">
                <div className="relative mx-auto w-32 h-32 mb-8">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-[40px] animate-ping" />
                  <div className="relative w-32 h-32 bg-slate-800 rounded-[40px] border border-slate-700 flex items-center justify-center text-slate-400 overflow-hidden">
                    {activeCall.callerId === currentUser?.uid ? (
                      // Displaying target caller's avatar or outline
                      <User size={48} />
                    ) : (
                      <User size={48} />
                    )}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Connecting...</h3>
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider animate-pulse">
                  Ringing destination peer
                </p>
              </div>
            ) : (
              // Status: Established Peer Connection
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                {activeCall.type === 'video' ? (
                  <>
                    {/* Main Remote Feed */}
                    {isSimulated || !remoteStream ? (
                      <div className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4 animate-pulse">
                          <User size={36} />
                        </div>
                        <h4 className="text-base font-black text-white">Remote Peer Video</h4>
                        <p className="text-xs text-slate-500 mt-1">Live simulation feed active</p>
                      </div>
                    ) : (
                      <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Draggable Picture-In-Picture Local Micro-videofeed */}
                    <div className="absolute bottom-6 right-6 w-40 aspect-video bg-slate-900 border-2 border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                      {isCameraOff || (isSimulated && !localStream) ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                          <VideoOff size={16} />
                        </div>
                      ) : (
                        <video 
                          ref={localVideoRef} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  // Audio Call: Static waves and avatar
                  <div className="text-center p-8 flex flex-col items-center">
                    <div className="relative mb-8 flex items-center justify-center">
                      <div className="absolute w-44 h-44 bg-blue-500/10 rounded-full animate-ping duration-1000" />
                      <div className="absolute w-36 h-36 bg-emerald-500/5 rounded-full animate-ping duration-700" />
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 overflow-hidden shadow-inner border border-slate-700">
                        {activeCall.callerPhoto ? (
                          <img src={activeCall.callerPhoto} alt="Peer" className="w-full h-full object-cover" />
                        ) : (
                          <User size={36} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2 bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full">
                      <Radio size={12} className="animate-pulse" />
                      <span className="text-[10px] uppercase font-black tracking-widest leading-none">Voice stream synced</span>
                    </div>
                    {/* Wave lines simulation */}
                    <div className="flex items-center gap-1.5 mt-4">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1, 3, 4, 2, 1, 3, 4].map((h, i) => (
                        <motion.div 
                          key={i} 
                          animate={{ height: [6, h * 6, 6] }}
                          transition={{ repeat: Infinity, duration: 0.8 + (i % 3) * 0.1, ease: "easeInOut" }}
                          className="w-1 bg-emerald-500 rounded-full"
                          style={{ height: '6px' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time text indicator */}
          {activeCall.status === 'accepted' && (
            <div className="flex items-center gap-2 text-white/80 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-2xl mb-8">
              <Timer size={14} className="text-emerald-500" />
              <span className="text-sm font-black tracking-tight font-mono">{formatTimer(callDuration)}</span>
            </div>
          )}

          {/* Call Session Controls dashboard */}
          <div className="flex items-center gap-4 bg-slate-900 border border-slate-800/80 px-8 py-5 rounded-[32px] shadow-2xl">
            {/* 1. Mute Mic Toggle */}
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isMuted ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* 2. Red End Call Button */}
            <button
              onClick={hangUp}
              className="w-16 h-16 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-rose-500/30"
            >
              <PhoneOff size={24} />
            </button>

            {/* 3. Camera Toggle if Video call */}
            {activeCall.type === 'video' && (
              <button
                onClick={toggleCamera}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isCameraOff ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
