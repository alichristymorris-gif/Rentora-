import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser, CallSession } from '../types';
import { 
  initiateCall, 
  acceptCall, 
  rejectCall, 
  endCall, 
  sendIceCandidate 
} from '../services/callService';

interface CallContextType {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  isSimulated: boolean;
  startCall: (targetUser: { uid: string, displayName: string, photoURL?: string }, type: 'audio' | 'video') => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children, currentUser }: { children: React.ReactNode, currentUser: AppUser | null }) {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isSimulated, setIsSimulated] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const ringtoneOscillations = useRef<any[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const durationInterval = useRef<any>(null);

  // Synthesize soft, elegant telephone ring utilizing browser Web Audio API
  const startRingtone = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const playRingTone = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // Standard ring frequency 1
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, ctx.currentTime); // Standard ring frequency 2

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime + 1.8);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        const stop = () => {
          try {
            osc1.stop();
            osc2.stop();
            gainNode.disconnect();
          } catch (e) {}
        };

        ringtoneOscillations.current.push(stop);
      };

      // Ring every 3 seconds
      playRingTone();
      const interval = setInterval(playRingTone, 3000);
      ringtoneOscillations.current.push(() => clearInterval(interval));
    } catch (err) {
      console.warn("Audio ringtone failed to compile: ", err);
    }
  };

  const stopRingtone = () => {
    ringtoneOscillations.current.forEach(stopFn => stopFn());
    ringtoneOscillations.current = [];
  };

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) {
      setIncomingCall(null);
      setActiveCall(null);
      return;
    }

    let channel: any = null;

    const fetchIncoming = async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('receiverId', currentUser.uid)
        .eq('status', 'ringing');
      if (!error && data && data.length > 0 && !activeCall) {
        const incomingCallData = data[0] as CallSession;
        setIncomingCall(incomingCallData);
        startRingtone();
      } else {
        setIncomingCall(null);
        stopRingtone();
      }
    };

    fetchIncoming();

    channel = supabase.channel(`incoming-calls-${currentUser.uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `receiverId=eq.${currentUser.uid}` }, () => {
        fetchIncoming();
      })
      .subscribe();

    return () => {
      if (channel) channel.unsubscribe();
      stopRingtone();
    };
  }, [currentUser, activeCall]);

  // Listen to active call updates
  useEffect(() => {
    if (!activeCall) return;

    let channel: any = null;

    const fetchActiveCall = async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('id', activeCall.id)
        .maybeSingle();

      if (error || !data) {
        cleanupCall();
        return;
      }
      const callData = data as CallSession;
      
      if (callData.status === 'rejected' || callData.status === 'ended') {
        cleanupCall();
      } else if (callData.status === 'accepted' && activeCall.status === 'ringing') {
        setActiveCall(callData);
        handleCallEstablished(callData);
      }
    };

    channel = supabase.channel(`active-call-listener-${activeCall.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${activeCall.id}` }, () => {
        fetchActiveCall();
      })
      .subscribe();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [activeCall]);

  // Handle call timer counter
  useEffect(() => {
    if (activeCall && activeCall.status === 'accepted') {
      durationInterval.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationInterval.current);
      setCallDuration(0);
    }
    return () => clearInterval(durationInterval.current);
  }, [activeCall]);

  // Trigger outbound call
  const startCall = async (targetUser: { uid: string, displayName: string, photoURL?: string }, type: 'audio' | 'video') => {
    if (!currentUser) return;
    
    try {
      const callId = await initiateCall(
        currentUser.uid,
        currentUser.displayName || 'Anonymous User',
        currentUser.photoURL || '',
        targetUser.uid,
        type
      );

      const initiatedCallData: CallSession = {
        id: callId,
        callerId: currentUser.uid,
        callerName: currentUser.displayName,
        callerPhoto: currentUser.photoURL || '',
        receiverId: targetUser.uid,
        status: 'ringing',
        type,
        createdAt: Date.now()
      };

      setActiveCall(initiatedCallData);
      
      // Start WebRTC initialization
      await setupMediaAndRTCPeer(initiatedCallData, true);
    } catch (e) {
      console.error("Start call failed: ", e);
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    
    const answeringCall = { ...incomingCall, status: 'accepted' as const };
    setIncomingCall(null);
    setActiveCall(answeringCall);

    await setupMediaAndRTCPeer(answeringCall, false);
  };

  // Decline incoming call
  const declineCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    await rejectCall(incomingCall.id);
    setIncomingCall(null);
  };

  // Hang up current call
  const hangUp = async () => {
    if (!activeCall) return;
    await endCall(activeCall.id);
    cleanupCall();
  };

  // Toggle audio
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted(prev => !prev);
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
    setIsCameraOff(prev => !prev);
  };

  // Setup WebRTC connection and fall back gracefully
  const setupMediaAndRTCPeer = async (call: CallSession, isCaller: boolean) => {
    try {
      // 1. Get User Media Devices
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: call.type === 'video'
        });
        setLocalStream(stream);
        setIsSimulated(false);
      } catch (mediaError) {
        console.warn("Microphone/Camera blocked inside frame. Initializing high-fidelity sandbox stream simulator...", mediaError);
        setIsSimulated(true);
        // Create an elegant visual placeholder
        setLocalStream(null);
        handleSimulatedCall(call);
        return;
      }

      // 2. Configure STUN servers for standard peer traversal
      const rtcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnection.current = pc;

      // Add local media tracks to Peer Connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle remote media track ingestion
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Exchanging trickle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && activeCall) {
          await sendIceCandidate(activeCall.id, event.candidate, isCaller ? 'caller' : 'receiver');
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        // Update database offer
        await supabase.from('calls').update({ offer: { sdp: offer.sdp, type: offer.type } }).eq('id', call.id);
        
        // Listen for remote answer SDP
        let activeChannel = supabase.channel(`signaling-offer-${call.id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls', filter: `id=eq.${call.id}` }, async (payload: any) => {
            const data = payload.new;
            if (data?.answer && !pc!.currentRemoteDescription) {
              const answerDesc = new RTCSessionDescription(data.answer);
              await pc!.setRemoteDescription(answerDesc);
            }
          })
          .subscribe();
        
        // Listen for receiver's ICE candidates
        const fetchIncomingCandidates = async () => {
          const { data, error } = await supabase
            .from('calls_candidates')
            .select('*')
            .eq('callId', call.id)
            .eq('type', 'receiver');
          if (!error && data) {
            data.forEach(async (candDoc: any) => {
              try {
                await pc!.addIceCandidate(new RTCIceCandidate(candDoc.candidate));
              } catch (e) {}
            });
          }
        };

        let candChannel = supabase.channel(`incoming-candidates-${call.id}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls_candidates', filter: `callId=eq.${call.id}` }, () => {
            fetchIncomingCandidates();
          })
          .subscribe();
        
        ringtoneOscillations.current.push(() => {
          if (activeChannel) activeChannel.unsubscribe();
          if (candChannel) candChannel.unsubscribe();
        });
      } else {
        // We are the receiver, wait for offer to be present
        const { data: callDocData, error: callErr } = await supabase.from('calls').select('*').eq('id', call.id).maybeSingle();
        const callData: any = callDocData;
        if (!callErr && callData?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          await acceptCall(call.id, { sdp: answer.sdp, type: answer.type });
          
          // Listen for caller's ICE candidates
          const fetchCallerCandidates = async () => {
            const { data, error } = await supabase
              .from('calls_candidates')
              .select('*')
              .eq('callId', call.id)
              .eq('type', 'caller');
            if (!error && data) {
              data.forEach(async (candDoc: any) => {
                try {
                  await pc!.addIceCandidate(new RTCIceCandidate(candDoc.candidate));
                } catch (e) {}
              });
            }
          };

          fetchCallerCandidates();

          let callerCandChannel = supabase.channel(`caller-candidates-${call.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls_candidates', filter: `callId=eq.${call.id}` }, () => {
              fetchCallerCandidates();
            })
            .subscribe();
          
          ringtoneOscillations.current.push(() => {
            if (callerCandChannel) callerCandChannel.unsubscribe();
          });
        }
      }
    } catch (err) {
      console.error("WebRTC establishment error, launching simulator...", err);
      setIsSimulated(true);
      handleSimulatedCall(call);
    }
  };

  const handleCallEstablished = (call: CallSession) => {
    // If simulated, we update status to accepted immediately
    if (isSimulated) return;
  };

  const handleSimulatedCall = async (call: CallSession) => {
    // Simulated state transition
    if (call.callerId === currentUser?.uid) {
      // Outgoing call simulation: established automatically after 4 seconds
      const timeout = setTimeout(async () => {
        await supabase.from('calls').update({ status: 'accepted' }).eq('id', call.id);
        setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);
      }, 4000);
      ringtoneOscillations.current.push(() => clearTimeout(timeout));
    } else {
      // Incoming call was accepted
      await supabase.from('calls').update({ status: 'accepted' }).eq('id', call.id);
      setActiveCall(prev => prev ? { ...prev, status: 'accepted' } : null);
    }
  };

  const cleanupCall = () => {
    stopRingtone();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    peerConnection.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    setIsSimulated(false);
  };

  return (
    <CallContext.Provider value={{
      activeCall,
      incomingCall,
      localStream,
      remoteStream,
      isMuted,
      isCameraOff,
      callDuration,
      isSimulated,
      startCall,
      answerCall,
      declineCall,
      hangUp,
      toggleMute,
      toggleCamera
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
