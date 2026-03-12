import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import { useAuth } from '../context/AuthContext';
import type { ChatMessage } from '../types';

interface Props {
  eventId: string;
}

export default function EventChat({ eventId }: Props) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      // SignalR standard: token via query string (WebSocket doesn't support Authorization header)
      .withUrl(`/hubs/event-chat?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on('MessageHistory', (history: ChatMessage[]) => {
      setMessages(history);
    });

    connection.on('NewMessage', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    connection.start().then(() => {
      setConnected(true);
      connection.invoke('JoinEventChat', eventId);
    }).catch(() => {});

    return () => {
      connection.invoke('LeaveEventChat', eventId).catch(() => {});
      connection.stop();
    };
  }, [eventId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !connectionRef.current) return;
    connectionRef.current.invoke('SendMessage', eventId, input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold mb-3">Chat du groupe</h2>

      <div className="bg-gray-50 rounded-lg h-80 overflow-y-auto p-4 mb-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Aucun message. Lancez la conversation !
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-3 py-2 rounded-lg ${
                isOwn ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200'
              }`}>
                {!isOwn && (
                  <p className="text-xs font-medium text-indigo-600 mb-1">{msg.userName}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? 'Écrire un message...' : 'Connexion...'}
          disabled={!connected}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!connected || !input.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
