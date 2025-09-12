import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatModal } from './ChatModal';

interface ChatIconProps {
  onChatOpen?: () => void;
  onChatClose?: () => void;
}

export const ChatIcon: React.FC<ChatIconProps> = ({ onChatOpen, onChatClose }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      onChatClose?.();
    } else {
      setIsOpen(true);
      onChatOpen?.();
    }
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <div className="fixed bottom-20 right-6 z-50">
        <button
          onClick={handleToggle}
          className={`
            w-14 h-14 rounded-full shadow-lg transition-all duration-300 ease-in-out
            flex items-center justify-center
            ${isOpen 
              ? 'bg-red-500 hover:bg-red-600 transform rotate-180' 
              : 'bg-blue-500 hover:bg-blue-600 hover:scale-110'
            }
            ${isOpen ? 'animate-pulse' : 'hover:shadow-xl'}
          `}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </button>
        
      </div>

      {/* Chat Modal */}
      <ChatModal isOpen={isOpen} onClose={handleToggle} />
    </>
  );
};
