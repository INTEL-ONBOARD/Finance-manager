import AppShell from '@/components/AppShell';
import { ChatProvider } from '@/context/ChatContext';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import MessageThread from '@/components/chat/MessageThread';

export default function CommunityPage() {
  return (
    <AppShell>
      <ChatProvider>
        {/* -m-8 cancels AppShell's p-8 padding for a full-bleed chat layout */}
        <div className="flex h-full -m-8 overflow-hidden">
          <ConversationSidebar />
          <MessageThread />
        </div>
      </ChatProvider>
    </AppShell>
  );
}
