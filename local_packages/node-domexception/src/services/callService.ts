import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDoc, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  const callRef = doc(db, 'calls', callId);

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

  await setDoc(callRef, newCall);

  // Trigger notification
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
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
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { offer });
};

// Accept a call and supply SDP answer
export const acceptCall = async (callId: string, answer: any) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { 
    answer,
    status: 'accepted'
  });
};

// Reject a call
export const rejectCall = async (callId: string) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { status: 'rejected' });
};

// End a call
export const endCall = async (callId: string) => {
  const callRef = doc(db, 'calls', callId);
  await updateDoc(callRef, { status: 'ended' });
};

// Send signaling ICE Candidates
export const sendIceCandidate = async (callId: string, candidate: any, type: 'caller' | 'receiver') => {
  const candidatesRef = collection(db, 'calls', callId, 'candidates');
  await addDoc(candidatesRef, {
    type,
    candidate: candidate.toJSON ? candidate.toJSON() : candidate,
    createdAt: Date.now()
  });
};
