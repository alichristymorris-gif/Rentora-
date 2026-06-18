import { supabase } from '../lib/supabase';
import { ChatSession, UserMessage, AppUser, AppNotification } from '../types';

export const startOrGetChat = async (currentUser: { uid: string, displayName: string, photoURL?: string }, targetUser: { uid: string, displayName: string, photoURL?: string }) => {
  const participants = [currentUser.uid, targetUser.uid].sort();
  const chatId = participants.join('_');
  
  const { data: existing } = await supabase.from('chats').select('id').eq('id', chatId).maybeSingle();
  
  if (!existing) {
    await supabase.from('chats').insert({
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
    });
  }

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
  const messageData: any = {
    chatId,
    senderId,
    content,
    createdAt: Date.now(),
    read: false,
    type,
    edited: false
  };

  if (fileUrl) messageData.fileUrl = fileUrl;
  if (duration !== undefined) messageData.duration = duration;

  const { data: msgData, error: msgError } = await supabase.from('messages').insert(messageData).select();
  if (msgError) throw msgError;

  // Describe message in conversational snippet for sidebar last message preview
  let lastMsgText = content;
  if (type === 'voice') lastMsgText = '🎙️ Voice Message';
  if (type === 'image') lastMsgText = '📷 Photo';
  if (type === 'file') lastMsgText = '📎 Attachment';

  const { data: chat } = await supabase.from('chats').select('*').eq('id', chatId).maybeSingle();
  const unreadCount = chat?.unreadCount || {};
  unreadCount[recipientId] = (unreadCount[recipientId] || 0) + 1;

  await supabase.from('chats').update({
    lastMessage: lastMsgText,
    lastMessageAt: Date.now(),
    unreadCount
  }).eq('id', chatId);

  // Create notifications doc
  await supabase.from('notifications').insert({
    userId: recipientId,
    title: 'New Message',
    message: lastMsgText.substring(0, 50) + (lastMsgText.length > 50 ? '...' : ''),
    type: 'message',
    link: `/chat`,
    read: false,
    createdAt: Date.now()
  });

  return msgData?.[0]?.id;
};

export const markChatAsRead = async (chatId: string, userId: string) => {
  const { data: chat } = await supabase.from('chats').select('*').eq('id', chatId).maybeSingle();
  if (chat) {
    const unreadCount = chat.unreadCount || {};
    unreadCount[userId] = 0;
    await supabase.from('chats').update({ unreadCount }).eq('id', chatId);
  }

  // Mark all incoming messages as read
  await supabase.from('messages')
    .update({ read: true })
    .eq('chatId', chatId)
    .neq('senderId', userId)
    .eq('read', false);
};

// Edit message utility
export const editMessageInDb = async (chatId: string, messageId: string, newContent: string) => {
  await supabase.from('messages').update({
    content: newContent,
    edited: true
  }).eq('id', messageId);
};

// Delete message utility
export const deleteMessageFromDb = async (chatId: string, messageId: string) => {
  await supabase.from('messages').delete().eq('id', messageId);
};

// User blocklist utilities
export const blockUserDb = async (currentUserId: string, targetUserId: string, chatId: string) => {
  // Add targetUserId to current user's blocked list
  const { data: userRaw } = await supabase.from('users').select('blockedUsers').eq('uid', currentUserId).maybeSingle();
  const blockedUsers = Array.isArray(userRaw?.blockedUsers) ? [...userRaw.blockedUsers, targetUserId] : [targetUserId];
  await supabase.from('users').update({ blockedUsers }).eq('uid', currentUserId);

  // Document block within the chat metadata
  const { data: chat } = await supabase.from('chats').select('blocked').eq('id', chatId).maybeSingle();
  const blocked = Array.isArray(chat?.blocked) ? [...chat.blocked, targetUserId] : [targetUserId];
  await supabase.from('chats').update({ blocked }).eq('id', chatId);
};

export const unblockUserDb = async (currentUserId: string, targetUserId: string, chatId: string) => {
  const { data: userRaw } = await supabase.from('users').select('blockedUsers').eq('uid', currentUserId).maybeSingle();
  const blockedUsers = Array.isArray(userRaw?.blockedUsers) ? userRaw.blockedUsers.filter((id: string) => id !== targetUserId) : [];
  await supabase.from('users').update({ blockedUsers }).eq('uid', currentUserId);

  const { data: chat } = await supabase.from('chats').select('blocked').eq('id', chatId).maybeSingle();
  const blocked = Array.isArray(chat?.blocked) ? chat.blocked.filter((id: string) => id !== targetUserId) : [];
  await supabase.from('chats').update({ blocked }).eq('id', chatId);
};

// Report content/user support
export const reportUserDb = async (reporterId: string, targetUserId: string, reason: string, details: string) => {
  await supabase.from('reports').insert({
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
  await supabase.from('users').update({
    online,
    lastSeen: Date.now()
  }).eq('uid', userId);
};
