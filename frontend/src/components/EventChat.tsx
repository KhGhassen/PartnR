import { useEffect, useRef, useState } from 'react';
import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import { SendHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { inputClass } from './ui/classes';
import Button from './ui/Button';
import type { ChatMessage } from '../types';

interface Props {
  eventId: string;
}

type SystemMessage = { id: string; type: 'system'; content: string };
type DisplayMessage = ChatMessage | SystemMessage;

function isSystem(msg: DisplayMessage): msg is SystemMessage {
  return (msg as SystemMessage).type === 'system';
}

export default function EventChat({ eventId }: Props) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    const connection = new HubConnectionBuilder()
      // SignalR standard: token via query string (WebSocket doesn't support Authorization header)
      .withUrl(`${API_BASE_URL}/hubs/event-chat?access_token=${token}`)
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

    connection.on('ParticipantJoined', (data: { userId: string; firstName: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, type: 'system', content: `${data.firstName} a rejoint la sortie` },
      ]);
    });

    connection.on('ParticipantLeft', (data: { userId: string; firstName: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: `sys-${Date.now()}`, type: 'system', content: `${data.firstName} a quitté la sortie` },
      ]);
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
    <section className="mt-8 border-t border-border pt-8">
      <h2 className="mb-1 text-xl font-extrabold text-text">Discussion du groupe</h2>
      <p className="mb-3 text-[15px] text-text-2">Visible uniquement par les participants.</p>

      <div className="mb-3 h-80 space-y-3 overflow-y-auto rounded-2xl bg-surface-sunken p-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-[15px] text-text-3">Aucun message. Dites bonjour !</p>
        )}
        {messages.map((msg) => {
          if (isSystem(msg)) {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="rounded-full bg-surface px-3 py-1 text-sm text-text-3">{msg.content}</span>
              </div>
            );
          }
          const isOwn = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isOwn ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-surface text-text ring-1 ring-border'
                }`}
              >
                {!isOwn && <p className="mb-0.5 text-sm font-bold text-primary-strong">{msg.userName}</p>}
                <p className="text-base leading-snug">{msg.content}</p>
                <p className={`mt-1 text-xs ${isOwn ? 'text-white/80' : 'text-text-3'}`}>
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
          placeholder={connected ? 'Écrire un message…' : 'Connexion…'}
          disabled={!connected}
          aria-label="Votre message"
          className={inputClass(false, 'flex-1 disabled:opacity-50')}
        />
        <Button onClick={send} disabled={!connected || !input.trim()}>
          <SendHorizontal size={18} aria-hidden="true" /> Envoyer
        </Button>
      </div>
    </section>
  );
}
