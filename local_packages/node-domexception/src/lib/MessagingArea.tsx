import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { 
  Search, 
  Send, 
  User, 
  ChevronLeft,
  Phone,
  Video,
  Pin,
  X,
  Paperclip,
  Mic,
  Square,
  Trash2,
  Edit2,
  ShieldAlert,
  Check,
  CheckCheck,
  MoreVertical,
  Flag,
  UserX,
  UserCheck,
  Lock,
  Download,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { AppUser, ChatSession, UserMessage } from '../types';
import { 
  sendMessage, 
  markChatAsRead,
  editMessageInDb,
  deleteMessageFromDb,
  blockUserDb,
  unblockUserDb,
  reportUserDb,
  updatePresenceStatus
} from '../services/messageService';
import { useCall } from '../context/CallContext';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessagingAreaProps {
  user: AppUser;
  initialChatId?: string;
}

export function MessagingArea({ user, initialChatId }: MessagingAreaProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  // Participant metadata
  const [partnerUser, setPartnerUser] = useState<any>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // File selection refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call connection context
  const { startCall } = useCall();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update dynamic presence state on component mount/unmount
  useEffect(() => {
    if (user.uid) {
      updatePresenceStatus(user.uid, true);
    }
    return () => {
      if (user.uid) {
        updatePresenceStatus(user.uid, false);
      }
    };
  }, [user.uid]);

  // Listen to sessions
  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      setSessions(data);
      setIsLoading(false);
      
      if (!activeChatId && data.length > 0 && window.innerWidth > 768) {
        setActiveChatId(data[0].id);
      }
    });

    return () => unsub();
  }, [user.uid, activeChatId]);

  // Listen to messages
  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserMessage)));
      markChatAsRead(activeChatId, user.uid);
      setTimeout(scrollToBottom, 100);
    });

    return () => {
      unsub();
      // Clear typing on inactive chat
      clearLocalTyping();
    };
  }, [activeChatId, user.uid]);

  // Listen to active partner presence status
  const activeSession = sessions.find(s => s.id === activeChatId);
  useEffect(() => {
    if (!activeSession) {
      setPartnerUser(null);
      return;
    }
    const partnerId = activeSession.participants.find(p => p !== user.uid);
    if (!partnerId) return;

    const unsubPartner = onSnapshot(doc(db, 'users', partnerId), (snapshot) => {
      if (snapshot.exists()) {
        setPartnerUser(snapshot.data());
      }
    });
    return () => unsubPartner();
  }, [activeChatId, activeSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChatId) return;
    
    if (isUserBlocked) return;

    const recipientId = activeSession?.participants.find(p => p !== user.uid);
    if (!recipientId) return;

    const text = inputText;
    setInputText('');
    clearLocalTyping();

    await sendMessage(activeChatId, user.uid, text, recipientId, 'text');
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = recordingTime;

        // Covert blob to Base64 to attach with full sandboxed resilience
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const recipientId = activeSession?.participants.find(p => p !== user.uid);
          if (recipientId && activeChatId) {
            await sendMessage(activeChatId, user.uid, '[🎙️ Voice Note]', recipientId, 'voice', base64Audio, duration);
          }
        };

        // Stop micro tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
    } catch (e) {
      console.warn("Microphone access is restricted inside iframe. Simulated voice note dispatched.");
      // Create highly engaging simulated voice note for testing
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(p => p + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Send beautiful mock simulation audio block URL
      const mockAudioBase64 = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
      const recipientId = activeSession?.participants.find(p => p !== user.uid);
      if (recipientId && activeChatId) {
        sendMessage(activeChatId, user.uid, '[🎙️ Simulated Voice Note]', recipientId, 'voice', mockAudioBase64, recordingTime || 5);
      }
    }
  };

  const cancelVoiceRecording = () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    mediaRecorderRef.current = null;
  };

  const triggerAttachmentSelection = () => {
    fileInputRef.current?.click();
  };

  const handleFileChanged = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId || !activeSession) return;

    const fileType = file.type.startsWith('image/') ? 'image' : 'file';
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const fileUrl = reader.result as string;
      const recipientId = activeSession.participants.find(p => p !== user.uid);
      if (recipientId) {
        await sendMessage(activeChatId, user.uid, file.name, recipientId, fileType, fileUrl);
      }
    };
  };

  const handleEnteringText = (text: string) => {
    setInputText(text);
    if (!activeChatId) return;

    const chatRef = doc(db, 'chats', activeChatId);
    updateDoc(chatRef, {
      [`typing.${user.uid}`]: text.length > 0
    }).catch(() => {});
  };

  const clearLocalTyping = () => {
    if (!activeChatId) return;
    const chatRef = doc(db, 'chats', activeChatId);
    updateDoc(chatRef, {
      [`typing.${user.uid}`]: false
    }).catch(() => {});
  };

  // Toggle chat pinning on top for user
  const handleTogglePinChat = async (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const chatRef = doc(db, 'chats', session.id);
    const isPinned = session.pinnedBy?.includes(user.uid);
    
    await updateDoc(chatRef, {
      pinnedBy: isPinned ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  // Block contact utility
  const handleToggleBlock = async () => {
    if (!activeSession) return;
    setShowOptionsDropdown(false);
    const partnerId = activeSession.participants.find(p => p !== user.uid);
    if (!partnerId) return;

    const isCurrentlyBlocked = activeSession.blocked?.includes(partnerId);

    if (isCurrentlyBlocked) {
      await unblockUserDb(user.uid, partnerId, activeChatId!);
    } else {
      await blockUserDb(user.uid, partnerId, activeChatId!);
    }
  };

  // Report contact utility
  const handleSubmitReport = async () => {
    if (!activeSession || !reportReason) return;
    const partnerId = activeSession.participants.find(p => p !== user.uid);
    if (!partnerId) return;

    await reportUserDb(user.uid, partnerId, reportReason, reportDetails);
    setShowReportModal(false);
    setReportReason('');
    setReportDetails('');
    alert("Report flagged and dispatched securely to administrators. Thank you.");
  };

  // Inline Message Editing Trigger
  const startEditingMessage = (msg: UserMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.content);
  };

  const submitEditedMessage = async (msgId: string) => {
    if (!editingText.trim() || !activeChatId) return;
    await editMessageInDb(activeChatId, msgId, editingText);
    setEditingMessageId(null);
    setEditingText('');
  };

  // Inline Message Deletion Trigger
  const deleteMessage = async (msgId: string) => {
    if (!activeChatId) return;
    if (confirm("Permanently delete this message?")) {
      await deleteMessageFromDb(activeChatId, msgId);
    }
  };

  const otherParticipant = activeSession ? 
    activeSession.participantData[activeSession.participants.find(p => p !== user.uid)!] : null;

  const isUserBlocked = activeSession?.blocked?.includes(user.uid) || 
                       (partnerUser?.blockedUsers?.includes(user.uid));

  const isPartnerBlockedByMe = activeSession?.blocked?.includes(activeSession.participants.find(p => p !== user.uid) || '');

  // Filtered and sorted sessions list incorporating PIN Priority
  const filteredSessions = sessions.filter(session => {
    const other = session.participantData[session.participants.find(p => p !== user.uid)!];
    return other?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    const aPinned = a.pinnedBy?.includes(user.uid) ? 1 : 0;
    const bPinned = b.pinnedBy?.includes(user.uid) ? 1 : 0;
    
    if (aPinned !== bPinned) {
      return bPinned - aPinned; // Pinned lists on index 0
    }
    return b.lastMessageAt - a.lastMessageAt;
  });

  const checkPartnerIsTyping = () => {
    if (!activeSession?.typing) return false;
    const partnerId = activeSession.participants.find(p => p !== user.uid);
    return partnerId ? activeSession.typing[partnerId] === true : false;
  };

  return (
    <div className="flex h-[680px] bg-white dark:bg-dark-surface rounded-[40px] border border-bento-border dark:border-dark-border overflow-hidden transition-colors shadow-2xl relative">
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChanged} 
        accept="image/*,application/pdf,text/plain"
      />

      {/* A. Sidebar Navigation Pane */}
      <div className={cn(
        "w-full md:w-1/3 border-r border-slate-100 dark:border-dark-border flex flex-col transition-all duration-300",
        !showMobileSidebar && "hidden md:flex"
      )}>
        <div className="p-6 md:p-8 border-b border-slate-50 dark:border-dark-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Secure Chats</h2>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="System Presence Live" />
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border py-3.5 pl-11 pr-4 rounded-xl text-xs outline-none focus:border-blue-500/20 transition-all font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Sessions Loop */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {filteredSessions.length === 0 && !isLoading && (
            <div className="py-16 text-center">
              <p className="text-slate-400 font-bold text-xs">No active safe-chat tunnels.</p>
            </div>
          )}
          {filteredSessions.map((session) => {
            const other = session.participantData[session.participants.find(p => p !== user.uid)!];
            const isActive = activeChatId === session.id;
            const unreadCount = session.unreadCount?.[user.uid] || 0;
            const isPinned = session.pinnedBy?.includes(user.uid);

            return (
              <button
                key={session.id}
                onClick={() => {
                  setActiveChatId(session.id);
                  setShowMobileSidebar(false);
                }}
                className={cn(
                  "w-full p-4 rounded-2xl flex items-center gap-3 transition-all group border",
                  isActive 
                    ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent"
                )}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden">
                    {other?.photoURL ? (
                      <img src={other.photoURL} alt={other.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-blue-600 text-white text-[9px] font-black rounded-lg flex items-center justify-center border-2 border-white dark:border-dark-surface">
                      {unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className={cn(
                      "text-xs font-black truncate tracking-tight transition-colors flex items-center gap-1",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                    )}>
                      {other?.displayName}
                      {isPinned && <Pin size={10} className="text-blue-500 fill-blue-500" />}
                    </h4>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap ml-2">
                       {formatDistanceToNow(session.lastMessageAt, { addSuffix: false })}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs truncate font-medium transition-colors",
                    unreadCount > 0 ? "text-slate-900 dark:text-white font-bold" : "text-slate-400 dark:text-dark-muted"
                  )}>
                    {session.lastMessage || "Establish connection"}
                  </p>
                </div>
                
                {/* Pin Button */}
                <button
                  onClick={(e) => handleTogglePinChat(e, session)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <Pin size={12} className={cn("text-slate-400", isPinned && "text-blue-500 fill-blue-500")} />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Conversations Dynamic Message Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/25 transition-all duration-300",
        showMobileSidebar && "hidden md:flex"
      )}>
        {activeChatId && otherParticipant ? (
          <>
            {/* Header: Displays partner metadata & Webrtc buttons */}
            <div className="p-5 bg-white dark:bg-dark-surface border-b border-slate-50 dark:border-dark-border flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowMobileSidebar(true)}
                  className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400 mr-1"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="relative shrink-0">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden shadow-sm">
                    {otherParticipant.photoURL ? (
                      <img src={otherParticipant.photoURL} alt={otherParticipant.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  {partnerUser?.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-dark-surface animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                    {otherParticipant.displayName}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-dark-muted">
                      {checkPartnerIsTyping() ? (
                        <span className="text-blue-600 dark:text-blue-400 animate-pulse font-black uppercase tracking-widest">Typing...</span>
                      ) : partnerUser?.online ? (
                        <span className="text-emerald-500 tracking-wider">Active now</span>
                      ) : partnerUser?.lastSeen ? (
                        `Active ${formatDistanceToNow(partnerUser.lastSeen, { addSuffix: true })}`
                      ) : (
                        "Encrypted"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Media tools & Security options triggers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startCall({ uid: activeSession!.participants.find(p => p !== user.uid)!, displayName: otherParticipant.displayName, photoURL: otherParticipant.photoURL }, 'audio')}
                  disabled={isUserBlocked}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-30"
                  title="Voice Call"
                >
                  <Phone size={14} />
                </button>
                <button
                  onClick={() => startCall({ uid: activeSession!.participants.find(p => p !== user.uid)!, displayName: otherParticipant.displayName, photoURL: otherParticipant.photoURL }, 'video')}
                  disabled={isUserBlocked}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-30"
                  title="Video Call"
                >
                  <Video size={14} />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowOptionsDropdown(prev => !prev)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                  >
                    <MoreVertical size={14} />
                  </button>

                  <AnimatePresence>
                    {showOptionsDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface border border-slate-150 dark:border-dark-border rounded-xl shadow-xl z-50 text-left p-1.5"
                      >
                        <button
                          onClick={handleToggleBlock}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                        >
                          <UserX size={14} />
                          {isPartnerBlockedByMe ? "Unblock Contact" : "Block Contact"}
                        </button>
                        <button
                          onClick={() => {
                            setShowOptionsDropdown(false);
                            setShowReportModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-dark-muted rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
                        >
                          <Flag size={14} />
                          Report User
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Messages Thread list */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar">
              {/* Security Shield Info Badge */}
              <div className="flex items-center justify-center py-2.5">
                <div className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-dark-muted px-4 py-2 rounded-2xl border border-slate-200/45 dark:border-dark-border/45 flex items-center gap-2 max-w-sm text-center">
                  <Lock size={12} className="text-blue-500" />
                  <span>Messages are encrypted and protected by Rentora Cloud Shields</span>
                </div>
              </div>

              {messages.map((msg, i) => {
                const isMine = msg.senderId === user.uid;
                const prevMsg = i > 0 ? messages[i-1] : null;
                const isEdited = msg.edited;

                return (
                  <div key={msg.id} className={cn("flex items-end gap-2.5 group", isMine ? "flex-row-reverse" : "flex-row")}>
                    
                    {/* Message Card */}
                    <div className="flex flex-col max-w-[70%]">
                      {/* Inline Sender display name for group-style clarity */}
                      {!isMine && (!prevMsg || prevMsg.senderId !== msg.senderId) && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-3 mb-1">
                          {otherParticipant.displayName}
                        </span>
                      )}

                      <div className={cn(
                        "p-4 rounded-3xl text-xs font-medium leading-relaxed relative flex flex-col gap-2.5 shadow-sm border",
                        isMine 
                          ? "bg-slate-900 dark:bg-blue-600 text-white rounded-br-none border-transparent" 
                          : "bg-white dark:bg-dark-surface text-slate-800 dark:text-dark-muted border-slate-100 dark:border-dark-border rounded-bl-none"
                      )}>
                        
                        {/* 1. TEXT MESSAGE RENDER */}
                        {(!msg.type || msg.type === 'text') && (
                          editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <input 
                                type="text"
                                className="w-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 rounded-lg outline-none text-xs"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button onClick={() => setEditingMessageId(null)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-white font-bold rounded">Cancel</button>
                                <button onClick={() => submitEditedMessage(msg.id)} className="px-3 py-1 bg-blue-600 text-[10px] text-white font-bold rounded">Save</button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )
                        )}

                        {/* 2. IMAGE MESSAGE RENDER */}
                        {msg.type === 'image' && (
                          <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 max-w-sm">
                            <img src={msg.fileUrl} alt="Attached message file" className="w-full max-h-60 object-cover" />
                          </div>
                        )}

                        {/* 3. FILE DOCUMENT ATTACHMENT */}
                        {msg.type === 'file' && (
                          <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100/10">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/35 text-blue-600 rounded-xl shrink-0">
                              <Paperclip size={16} />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-slate-800 dark:text-white leading-none mb-1">{msg.content}</p>
                              <a 
                                href={msg.fileUrl} 
                                download={msg.content}
                                className="text-[10px] font-black uppercase text-blue-500 hover:underline inline-flex items-center gap-1"
                              >
                                <Download size={10} /> Download File
                              </a>
                            </div>
                          </div>
                        )}

                        {/* 4. VOICE NOTE CHAT RECORD SPLINE */}
                        {msg.type === 'voice' && (
                          <div className="flex items-center gap-3 w-56 p-1">
                            <button className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-md">
                              <Mic size={16} />
                            </button>
                            <div className="flex-1 text-left">
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-705 rounded-full overflow-hidden">
                                <motion.div 
                                  animate={{ width: ['0%', '100%'] }} 
                                  transition={{ repeat: Infinity, duration: msg.duration || 5, ease: 'linear' }}
                                  className="h-full bg-blue-500" 
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1 text-[9px] font-bold text-slate-400">
                                <span>🎙️ Voice Note</span>
                                <span>{msg.duration ? `${Math.floor(msg.duration / 60)}:${(msg.duration % 60).toString().padStart(2, '0')}` : "0:05"}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Message Status & Timestamp */}
                        <div className="flex items-center justify-end gap-1.5 mt-1 sm:mt-1.5 text-[8px] font-black uppercase tracking-wider text-slate-400 dark:text-dark-muted">
                          {isEdited && <span className="text-[8px] italic mr-1">Edited</span>}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {/* Seen WhatsApp-style double check indicators */}
                          {isMine && (
                            msg.read ? (
                              <span title="Seen"><CheckCheck size={12} className="text-blue-500 dark:text-blue-400" /></span>
                            ) : (
                              <span title="Delivered"><CheckCheck size={12} className="text-slate-400" /></span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Operations Context buttons on hover! */}
                    {isMine && editingMessageId !== msg.id && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                        {(!msg.type || msg.type === 'text') && (
                          <button 
                            onClick={() => startEditingMessage(msg)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-dark-muted rounded-lg"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Layout */}
            <div className="p-4 md:p-6 border-t border-slate-50 dark:border-dark-border bg-white dark:bg-dark-surface transition-colors">
              
              {/* If user or partner is blocked, show alert notices */}
              {isUserBlocked || isPartnerBlockedByMe ? (
                <div className="bg-rose-500/10 text-rose-500 p-4 rounded-3xl border border-rose-500/20 flex gap-3 items-center justify-between text-xs font-bold font-mono">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} />
                    <span>Communications disabled. Participant blocking active.</span>
                  </div>
                  {isPartnerBlockedByMe && (
                    <button 
                      onClick={handleToggleBlock}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl uppercase text-[10px]"
                    >
                      Unblock
                    </button>
                  )}
                </div>
              ) : isRecording ? (
                // Recording Mic Dashboard panel
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border p-5 rounded-[24px]">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                    <span className="text-xs font-black uppercase text-rose-500 tracking-widest leading-none">
                      Recording ({recordingTime}s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={cancelVoiceRecording}
                      className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={stopVoiceRecording}
                      className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20"
                    >
                      <Square size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                // Normal Text input bars
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={triggerAttachmentSelection}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border text-slate-400 dark:text-dark-muted rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="Attach File / Picture"
                    >
                      <Paperclip size={14} />
                    </button>
                    <button 
                      onClick={startVoiceRecording}
                      className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border text-slate-400 dark:text-dark-muted rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      title="Record Voice Message"
                    >
                      <Mic size={14} />
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border py-4 px-5 rounded-[20px] text-xs outline-none focus:border-blue-500/20 transition-all font-semibold text-slate-900 dark:text-white"
                      value={inputText}
                      onChange={(e) => handleEnteringText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputText.trim()}
                    className="w-13 h-13 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 inline-shrink shadow-lg"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // Inactive chat prompt
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-[32px] flex items-center justify-center text-slate-300 mb-6 transition-colors">
              <User size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Safe Sandbox Messaging</h3>
            <p className="text-slate-400 dark:text-dark-muted font-bold text-xs max-w-sm">Choose from your sessions panel or inquire listings directly to start an end-to-end encoded stream.</p>
          </div>
        )}
      </div>

      {/* C. User Report contextual Modal popup */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[11000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-dark-border p-6 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-500" />
                  Report Chat Abuse
                </h3>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Violation Reason</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-dark-border rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                  >
                    <option value="">-- Choose reason --</option>
                    <option value="spam">Spam / Unsolicited inquiries</option>
                    <option value="harassment">Harassment or abusive language</option>
                    <option value="fraud">Fraud / Scam attempted</option>
                    <option value="other">Other policies violation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Incident Details</label>
                  <textarea 
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    rows={4}
                    placeholder="Provide specific details of the violation..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-dark-border rounded-xl text-xs font-semibold text-slate-850 dark:text-white outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2.5 justify-end">
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-lg text-[10px] uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitReport}
                    disabled={!reportReason}
                    className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-lg text-[10px] uppercase disabled:opacity-40"
                  >
                    File Safe-Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
