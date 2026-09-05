import { useEffect, useState } from 'react';
import { useMailStore } from '../store/mailStore.js';
import { useUIStore } from '../store/uiStore.js';

const SSE_URL = 'http://localhost:5000/api/sync/stream';

export const useRealtimeSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const addIncomingEmail = useMailStore((s) => s.addIncomingEmail);
  const fetchEmails = useMailStore((s) => s.fetchEmails);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      eventSource = new EventSource(SSE_URL);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NEW_EMAIL') {
            const email = data.payload;
            addIncomingEmail(email);
            addToast({
              title: `New Email from ${email.senderName || email.senderEmail}`,
              message: email.subject,
              type: 'info',
            });
          } else if (data.type === 'EMAIL_UPDATED' || data.type === 'SYNC_COMPLETE') {
            fetchEmails();
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        // Reconnect after 4s
        reconnectTimeout = setTimeout(connect, 4000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, [addIncomingEmail, fetchEmails, addToast]);

  return { isConnected };
};
