import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, getCurrentUser } from '../lib/auth';

/**
 * Establishes a JWT-authenticated Socket.IO connection.
 *
 * Returns the live `socket` instance so consumers can call
 * `socket.on(event, handler)` / `socket.off(event, handler)` directly
 * inside their own useEffect with proper cleanup — no stale-ref issues.
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const currentUser = getCurrentUser();

    if (!token || !currentUser) {
      console.log('[Socket] Session missing — connection bypassed.');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const socketConnection = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });

    socketConnection.on('connect', () => {
      setConnected(true);
      console.log(`🔌 [Socket] Connected — ID: ${socketConnection.id}`);
      // Room assignment is handled server-side via JWT in handleRoomJoin().
      // No manual 'join-tenant' emit required.
    });

    socketConnection.on('connect_error', (error) => {
      console.error('[Socket] Connection failed:', error.message);
    });

    socketConnection.on('disconnect', (reason) => {
      setConnected(false);
      console.log(`🔌 [Socket] Disconnected — reason: ${reason}`);
    });

    // Make the socket available to consumers AFTER all base listeners are set up
    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  return { socket, connected };
}

// ─── Shared Payload Types ─────────────────────────────────────────────────────

export interface LeadNewPayload {
  lead?: Record<string, any> | null;
  leadId: string;
  name: string;
  phone?: string | null;
  source: string | null;
  stage: string;
}

export interface LeadStageChangedPayload {
  leadId: string;
  oldStage: string;
  newStage: string;
}

export interface FollowUpDuePayload {
  followUpId: string;
  leadId: string;
  note: string | null;
}

export interface SaleRecordedPayload {
  clientId: string;
  amount: number;
  leadId: string;
}

export default useSocket;
