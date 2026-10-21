import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, Send, Check, CheckCheck, Sparkles, ArrowRightLeft } from 'lucide-react';
import { User, SwapRequest, ChatMessage } from '../types';
import realtimeService from '../services/realtime';
import apiService from '../services/api';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapRequest: SwapRequest;
  currentUser: User;
  partnerUser: User;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  swapRequest,
  currentUser,
  partnerUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const currentUserId = String(currentUser?.id || (currentUser as any)?._id || '');
  const partnerId = String(partnerUser?.id || (partnerUser as any)?._id || '');
  const isPartnerOnline = onlineUsers.includes(partnerId);

  const getPhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    return `${baseUrl}${photoPath.startsWith('/') ? '' : '/'}${photoPath}`;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load message history from database
  const loadMessages = useCallback(async () => {
    try {
      setIsLoadingMessages(true);
      const res = await apiService.getMessages(swapRequest.id);
      if (res.success && res.data?.messages) {
        const formatted: ChatMessage[] = res.data.messages.map((m: any) => ({
          id: m._id || m.id,
          swapId: m.swapId,
          senderId: typeof m.senderId === 'object' ? String(m.senderId._id || m.senderId.id) : String(m.senderId),
          receiverId: typeof m.receiverId === 'object' ? String(m.receiverId._id || m.receiverId.id) : String(m.receiverId),
          sender: typeof m.senderId === 'object' ? {
            id: String(m.senderId._id || m.senderId.id),
            name: m.senderId.name,
            photo: m.senderId.photo,
          } : undefined,
          text: m.text,
          read: m.read,
          createdAt: m.createdAt,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [swapRequest.id]);

  useEffect(() => {
    if (!isOpen) return;

    loadMessages();

    // Join the socket chat room for this swap
    realtimeService.joinChat(swapRequest.id, currentUserId);

    // Mark existing incoming messages as read
    realtimeService.markRead(swapRequest.id, currentUserId);
    apiService.markMessagesAsRead(swapRequest.id).catch(() => {});

    // Listen for incoming messages
    const handleReceiveMessage = (data: { message: any }) => {
      const msg = data.message;
      if (msg.swapId === swapRequest.id) {
        const formattedMsg: ChatMessage = {
          id: String(msg._id || msg.id),
          swapId: msg.swapId,
          senderId: typeof msg.senderId === 'object' ? String(msg.senderId._id || msg.senderId.id) : String(msg.senderId),
          receiverId: typeof msg.receiverId === 'object' ? String(msg.receiverId._id || msg.receiverId.id) : String(msg.receiverId),
          sender: typeof msg.senderId === 'object' ? {
            id: String(msg.senderId._id || msg.senderId.id),
            name: msg.senderId.name,
            photo: msg.senderId.photo,
          } : undefined,
          text: msg.text,
          read: msg.read,
          createdAt: msg.createdAt,
        };

        setMessages(prev => {
          // If we already have this exact message ID, ignore
          if (prev.some(m => m.id === formattedMsg.id)) return prev;

          // If this message corresponds to an optimistic local message, replace it
          const optimisticIndex = prev.findIndex(
            m => m.id.startsWith('temp-') && 
                 m.senderId === formattedMsg.senderId && 
                 m.text === formattedMsg.text
          );

          if (optimisticIndex !== -1) {
            const next = [...prev];
            next[optimisticIndex] = formattedMsg;
            return next;
          }

          return [...prev, formattedMsg];
        });

        // If message is from partner, mark it read
        if (formattedMsg.senderId !== currentUserId) {
          realtimeService.markRead(swapRequest.id, currentUserId);
        }

        setTimeout(() => scrollToBottom(), 50);
      }
    };

    // Listen for partner typing
    const handleUserTyping = (data: { swapId: string; userId: string; isTyping: boolean }) => {
      if (data.swapId === swapRequest.id && String(data.userId) !== currentUserId) {
        setIsPartnerTyping(data.isTyping);
      }
    };

    // Listen for messages read indicator
    const handleMessagesRead = (data: { swapId: string }) => {
      if (data.swapId === swapRequest.id) {
        setMessages(prev => prev.map(m => (m.senderId === currentUserId ? { ...m, read: true } : m)));
      }
    };

    // Listen to real-time chat presence
    const handlePresence = (data: { swapId: string; onlineUsers: string[] }) => {
      if (data.swapId === swapRequest.id) {
        setOnlineUsers(data.onlineUsers.map(String));
      }
    };

    realtimeService.onReceiveMessage(handleReceiveMessage);
    realtimeService.onUserTyping(handleUserTyping);
    realtimeService.onMessagesRead(handleMessagesRead);
    realtimeService.onChatPresence(handlePresence);

    return () => {
      realtimeService.leaveChat(swapRequest.id, currentUserId);
      realtimeService.off('receive-message', handleReceiveMessage);
      realtimeService.off('user-typing', handleUserTyping);
      realtimeService.off('messages-read', handleMessagesRead);
      realtimeService.off('chat-presence', handlePresence);
    };
  }, [isOpen, swapRequest.id, currentUserId, loadMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Emit typing status
    realtimeService.sendTyping(swapRequest.id, currentUserId, true, currentUser.name);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      realtimeService.sendTyping(swapRequest.id, currentUserId, false);
    }, 1500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText('');
    realtimeService.sendTyping(swapRequest.id, currentUserId, false);

    // Optimistic local preview
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      swapId: swapRequest.id,
      senderId: currentUserId,
      receiverId: partnerId,
      text: trimmed,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(), 50);

    // SEND ONLY ONCE:
    // If WebSocket is connected, use real-time socket.
    // If WebSocket is disconnected, use REST fallback.
    if (realtimeService.isSocketConnected()) {
      realtimeService.sendChatMessage(
        swapRequest.id,
        currentUserId,
        partnerId,
        trimmed,
        (response) => {
          if (response?.success && response.message) {
            const realMsg = response.message;
            setMessages(prev => prev.map(m => (m.id === tempId ? {
              ...m,
              id: String(realMsg._id || realMsg.id),
              createdAt: realMsg.createdAt,
            } : m)));
          }
        }
      );
    } else {
      try {
        const res = await apiService.sendChatMessage(swapRequest.id, trimmed);
        if (res?.success && (res as any).data?.message) {
          const realMsg = (res as any).data.message;
          setMessages(prev => prev.map(m => (m.id === tempId ? {
            ...m,
            id: String(realMsg._id || realMsg.id),
            createdAt: realMsg.createdAt,
          } : m)));
        }
      } catch (err) {
        console.error('Failed to send message via REST fallback:', err);
      }
    }
  };

  // Senior-grade deduplication: cleans up any duplicate messages sent during network blips
  // or historical double-sends within a 3-second window
  const cleanMessages = useMemo(() => {
    const result: ChatMessage[] = [];
    const seenIds = new Set<string>();

    for (const msg of messages) {
      if (seenIds.has(msg.id)) continue;
      seenIds.add(msg.id);

      // Check if immediately preceding message is an identical duplicate (same text, same sender within 3s)
      const prev = result[result.length - 1];
      if (
        prev &&
        prev.senderId === msg.senderId &&
        prev.text === msg.text &&
        Math.abs(new Date(prev.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 3000
      ) {
        continue;
      }

      result.push(msg);
    }
    return result;
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl h-[660px] max-h-[92vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        
        {/* Chat Header */}
        <div className="relative z-10 px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar with Status Ring */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-slate-200 border border-slate-100 shadow-xs">
                {getPhotoUrl(partnerUser?.photo) ? (
                  <img src={getPhotoUrl(partnerUser?.photo)!} alt={partnerUser?.name || 'Partner'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm">
                    {(partnerUser?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Dynamic Presence Indicator */}
              {isPartnerOnline ? (
                <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5" title="Partner is active in chat">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white"></span>
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 inline-flex rounded-full h-2.5 w-2.5 bg-slate-400 border border-white" title="Partner is away / out of chat"></span>
              )}
            </div>

            {/* Partner Details & Skill Badges */}
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {partnerUser?.name || 'Swap Partner'}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isPartnerOnline 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {isPartnerOnline ? 'In Chat' : 'Away'}
                </span>
              </div>

              {/* Skills Exchange Pill Badge */}
              <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {swapRequest.skillOffered}
                </span>
                <ArrowRightLeft className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {swapRequest.skillWanted}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close conversation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="relative z-10 flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 bg-slate-50/60 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {isLoadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-indigo-600 border-t-transparent"></div>
              <p className="text-xs text-slate-500">Loading conversation history...</p>
            </div>
          ) : cleanMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Direct Swap Workspace</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                  Say hello to <span className="text-slate-800 font-semibold">{partnerUser?.name || 'your partner'}</span> and coordinate your skill sessions, meeting links, or question exchanges.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Session Security Banner */}
              <div className="flex justify-center my-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white text-slate-500 border border-slate-200 shadow-xs">
                  Real-Time Encrypted Session
                </span>
              </div>

              {cleanMessages.map((msg) => {
                const isMine = msg.senderId === currentUserId;
                const timeString = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                  >
                    <div
                      className={`max-w-[76%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-xs transition-all ${
                        isMine
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                    
                    {/* Timestamp & Read Indicator */}
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-1 px-1">
                      <span>{timeString}</span>
                      {isMine && (
                        msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-indigo-600" title="Read" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-400" title="Delivered" />
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Typing Indicator */}
          {isPartnerTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 w-fit shadow-xs animate-in fade-in">
              <span className="text-slate-800 font-semibold">{partnerUser?.name || 'Partner'}</span>
              <span>is typing</span>
              <div className="flex items-center space-x-1 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="relative z-10 p-3 sm:p-3.5 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${partnerUser?.name || 'partner'}...`}
              className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ChatModal;
