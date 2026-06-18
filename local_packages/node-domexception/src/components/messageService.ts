import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  setDoc,
  serverTimestamp,
  increment,
  getDocs,
  limit,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChatSession, UserMessage, AppUser, AppNotification } from '../types';

export const startOrGetChat = async (currentUser: { uid: string, displayName: string, photoURL?: string }, targetUser: { uid: string, displayName: string, photoURL?: string }) => {
  const participants = [currentUser.uid, targetUser.uid].sort();
  const chatId = participants.join('_');
  
  const chatRef = doc(db, 'chats', chatId);
  
  await setDoc(chatRef, {
    id: chatId,
    participants,
    participantData: {
      [currentUser.uid]: {
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL || ''
      },
      [targetUser.uid]: {
        displayName: targetUser.displayName,
        photoURL: targetUser.photoURL || ''
      }
    },
    lastMessageAt: Date.now()
  }, { merge: true });

  return chatId;
};

export const sendMessage = async (
  chatId: string, 
  senderId: string, 
  content: string, 
  recipientId: string,
  type: 'text' | 'voice' | 'image' | 'file' = 'text',
  fileUrl?: string,
  duration?: number
) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  
  const messageData: Partial<UserMessage> = {
    senderId,
    content,
    createdAt: Date.now(),
    read: false,
    type,
    edited: false
  };

  if (fileUrl) messageData.fileUrl = fileUrl;
  if (duration !== undefined) messageData.duration = duration;

  const docRef = await addDoc(messagesRef, messageData);

  // Describe message in conversational snippet for sidebar last message preview
  let lastMsgText = content;
  if (type === 'voice') lastMsgText = '🎙️ Voice Message';
  if (type === 'image') lastMsgText = '📷 Photo';
  if (type === 'file') lastMsgText = '📎 Attachment';

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: lastMsgText,
    lastMessageAt: Date.now(),
    [`unreadCount.${recipientId}`]: increment(1)
  });

  // Create notifications doc
  const notificationsRef = collection(db, 'notifications');
  await addDoc(notificationsRef, {
    userId: recipientId,
    title: 'New Message',
    message: lastMsgText.substring(0, 50) + (lastMsgText.length > 50 ? '...' : ''),
    type: 'message',
    link: `/chat`,
    read: false,
    createdAt: Date.now()
  });

  return docRef.id;
};

export const markChatAsRead = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    [`unreadCount.${userId}`]: 0
  });

  // Mark all incoming messages as read
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, where('read', '==', false));
  const snap = await getDocs(q);
  snap.forEach(async (messageDoc) => {
    if (messageDoc.data().senderId !== userId) {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageDoc.id), {
        read: true
      });
    }
  });
};

// Edit message utility
export const editMessageInDb = async (chatId: string, messageId: string, newContent: string) => {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    content: newContent,
    edited: true
  });
};

// Delete message utility
export const deleteMessageFromDb = async (chatId: string, messageId: string) => {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await deleteDoc(msgRef);
};

// User blocklist utilities
export const blockUserDb = async (currentUserId: string, targetUserId: string, chatId: string) => {
  // Add targetUserId to current user's blocked list
  const userRef = doc(db, 'users', currentUserId);
  await updateDoc(userRef, {
    blockedUsers: arrayUnion(targetUserId)
  });

  // Document block within the chat metadata
  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    blocked: arrayUnion(targetUserId)
  });
};

export const unblockUserDb = async (currentUserId: string, targetUserId: string, chatId: string) => {
  const userRef = doc(db, 'users', currentUserId);
  await updateDoc(userRef, {
    blockedUsers: arrayRemove(targetUserId)
  });

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    blocked: arrayRemove(targetUserId)
  });
};

// Report content/user support
export const reportUserDb = async (reporterId: string, targetUserId: string, reason: string, details: string) => {
  const reportsRef = collection(db, 'reports');
  await addDoc(reportsRef, {
    reporterId,
    targetType: 'user',
    targetId: targetUserId,
    reason,
    details,
    status: 'pending',
    createdAt: Date.now()
  });
};

// Update presence system
export const updatePresenceStatus = async (userId: string, online: boolean) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    online,
    lastSeen: Date.now()
  });
};
