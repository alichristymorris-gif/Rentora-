import { supabase } from '../lib/supabase';
import { CallSession } from '../types';

// Initiate a calling transaction
export const initiateCall = async (
  callerId: string, 
  callerName: string, 
  callerPhoto: string, 
  receiverId: string, 
  type: 'audio' | 'video'
): Promise<string> => {
  const callId = `${callerId}_${receiverId}_${Date.now()}`;

  const newCall: CallSession = {
    id: callId,
    callerId,
    callerName,
    callerPhoto: callerPhoto || '',
    receiverId,
    status: 'ringing',
    type,
    createdAt: Date.now()
  };

  await supabase.from('calls').insert(newCall);

  // Trigger notification
  await supabase.from('notifications').insert({
    userId: receiverId,
    title: `Incoming ${type} call`,
    message: `${callerName} is calling you...`,
    type: 'system',
    link: `/chat`,
    read: false,
    createdAt: Date.now()
  });

  return callId;
};

// Set signaling SDP offer
export const setCallOffer = async (callId: string, offer: any) => {
  await supabase.from('calls').update({ offer }).eq('id', callId);
};

// Accept a call and supply SDP answer
export const acceptCall = async (callId: string, answer: any) => {
  await supabase.from('calls').update({ 
    answer,
    status: 'accepted'
  }).eq('id', callId);
};

// Reject a call
export const rejectCall = async (callId: string) => {
  await supabase.from('calls').update({ status: 'rejected' }).eq('id', callId);
};

// End a call
export const endCall = async (callId: string) => {
  await supabase.from('calls').update({ status: 'ended' }).eq('id', callId);
};

// Send signaling ICE Candidates
export const sendIceCandidate = async (callId: string, candidate: any, type: 'caller' | 'receiver') => {
  await supabase.from('calls_candidates').insert({
    callId,
    type,
    candidate: candidate.toJSON ? candidate.toJSON() : candidate,
    createdAt: Date.now()
  });
};
