import { ChatProvider } from '@/context/ChatContext';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import MessageThread from '@/components/chat/MessageThread';

export default function CommunityPage() {
  return (
    <ChatProvider>
        <div className="flex h-full overflow-hidden">
          <ConversationSidebar />
          <MessageThread />
        </div>
    </ChatProvider>
  );
}
