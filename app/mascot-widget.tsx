'use client';

import { useState, useEffect, useRef } from 'react';
import { Mascot } from 'page-mascot';
import { Bot, X, Send, Sparkles, Loader2, MessageSquare } from 'lucide-react';

interface MascotWidgetProps {
  size?: number;
  build?: any;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export default function MascotWidget({ size = 100, build }: MascotWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [speech, setSpeech] = useState('Hỏi em về cấu hình nhé! 💬');
  const [chatOpen, setChatOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Chào bạn! Mình là TechBot 🤖. Bạn có thắc mắc gì về việc nâng cấp linh kiện, khả năng tản nhiệt hay công suất nguồn không?',
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  async function handleSendMessage(customText?: string) {
    const textToSend = (customText ?? inputVal).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/mascot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          build,
        }),
      });

      const data = await res.json();
      const botReplyText = data.reply || 'TechBot đang tải lại dữ liệu! Cấu hình này rất ổn áp bạn nhé ⚡';

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReplyText,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: 'Mạng hơi chập chờn một xíu! Nhưng linh kiện trong cấu hình này đều tương thích 100% rồi nha 🛡️',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <>
      {/* Floating Mascot Widget */}
      <div className="mascot-widget-container">
        {!chatOpen && isOpen && (
          <div className="mascot-bubble" onClick={() => setChatOpen(true)} style={{ cursor: 'pointer' }}>
            <span>{speech}</span>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="mascot-close-btn"
              aria-label="Đóng mascot"
              title="Đóng"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <div
          className="mascot-interactive-wrap"
          onClick={() => setChatOpen(!chatOpen)}
          title="Bấm để chat với TechBot AI Co-pilot"
        >
          <Mascot
            directions="/mascots/robot/directions.png"
            reactions="/mascots/robot/reactions.png"
            size={size}
            label="TechBot"
          />
        </div>
      </div>

      {/* AI Co-pilot Chat Drawer */}
      {chatOpen && (
        <>
          <div className="mascot-chat-backdrop" onClick={() => setChatOpen(false)} />
          <div className="mascot-chat-drawer">
          <div className="mascot-chat-header">
            <div className="mascot-chat-title">
              <span className="mascot-status-dot" />
              <div>
                <strong>TechBot Co-pilot</strong>
                <small>Hỏi đáp phần cứng thời gian thực</small>
              </div>
            </div>
            <button
              className="mascot-chat-close"
              onClick={() => setChatOpen(false)}
              aria-label="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mascot-chat-messages">
            {messages.map(m => (
              <div key={m.id} className={`mascot-msg-row ${m.sender}`}>
                <div className="mascot-msg-bubble">
                  <p>{m.text}</p>
                  <span className="mascot-msg-time">{m.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="mascot-msg-row bot">
                <div className="mascot-msg-bubble typing">
                  <Loader2 className="spin" size={14} />
                  <span>TechBot đang suy nghĩ...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="mascot-quick-chips">
            {[
              'Nâng card đồ họa sau 2 năm?',
              'Nguồn có đủ công suất không?',
              'Cần lắp thêm tản nước AIO?',
            ].map(prompt => (
              <button
                key={prompt}
                className="mascot-chip"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            className="mascot-chat-input-form"
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Hỏi TechBot về cấu hình này..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={!inputVal.trim() || loading} aria-label="Gửi">
              <Send size={15} />
            </button>
          </form>
        </div>
        </>
      )}
    </>
  );
}
