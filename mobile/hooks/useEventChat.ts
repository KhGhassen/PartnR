import { useEffect, useRef, useState, useCallback } from 'react';
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
  type HubConnection,
} from '@microsoft/signalr';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
};

export function useEventChat(eventId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const connRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    let conn: HubConnection;

    (async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) { setError('Non authentifié.'); return; }

      conn = new HubConnectionBuilder()
        .withUrl(`${API_URL}/hubs/event-chat?access_token=${token}`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connRef.current = conn;

      conn.on('MessageHistory', (history: ChatMessage[]) => {
        setMessages(history);
      });

      conn.on('NewMessage', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      conn.on('ParticipantJoined', (data: { userId: string; firstName: string }) => {
        setMessages((prev) => [
          ...prev,
          { id: `sys-${Date.now()}`, content: `${data.firstName} a rejoint l'événement`, createdAt: new Date().toISOString(), userId: 'system', userName: '' },
        ]);
      });

      conn.on('ParticipantLeft', (data: { userId: string; firstName: string }) => {
        setMessages((prev) => [
          ...prev,
          { id: `sys-${Date.now()}`, content: `${data.firstName} a quitté l'événement`, createdAt: new Date().toISOString(), userId: 'system', userName: '' },
        ]);
      });

      try {
        await conn.start();
        await conn.invoke('JoinEventChat', eventId);
        setConnected(true);
      } catch (e: any) {
        setError(e?.message?.includes('not a participant')
          ? 'Vous devez rejoindre l\'événement pour accéder au chat.'
          : 'Impossible de se connecter au chat.');
      }
    })();

    return () => {
      if (conn && conn.state === HubConnectionState.Connected) {
        conn.invoke('LeaveEventChat', eventId).catch(() => {});
        conn.stop();
      }
    };
  }, [eventId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const conn = connRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected || !content.trim()) return;
      await conn.invoke('SendMessage', eventId, content.trim());
    },
    [eventId],
  );

  return { messages, connected, error, sendMessage };
}
