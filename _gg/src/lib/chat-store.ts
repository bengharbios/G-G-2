/* ═══════════════════════════════════════════════════════════════════════
   In-Memory Chat Store — session-only, auto-cleanup after 2h inactivity
   ═══════════════════════════════════════════════════════════════════════ */

export interface StoredChatMessage {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isGift?: boolean;
}

class ChatStore {
  private rooms = new Map<string, StoredChatMessage[]>();
  private maxPerRoom = 300;
  private maxAge = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    // cleanup every 15 min
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }

  addMessage(msg: StoredChatMessage): StoredChatMessage {
    if (!this.rooms.has(msg.roomId)) this.rooms.set(msg.roomId, []);
    const list = this.rooms.get(msg.roomId)!;
    list.push(msg);
    if (list.length > this.maxPerRoom) {
      this.rooms.set(msg.roomId, list.slice(-this.maxPerRoom));
    }
    return msg;
  }

  getMessages(roomId: string, afterTimestamp?: number): StoredChatMessage[] {
    const list = this.rooms.get(roomId) || [];
    if (afterTimestamp) return list.filter(m => m.timestamp > afterTimestamp);
    return list;
  }

  clearRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [rid, msgs] of this.rooms.entries()) {
      const filtered = msgs.filter(m => now - m.timestamp < this.maxAge);
      if (filtered.length === 0) this.rooms.delete(rid);
      else this.rooms.set(rid, filtered);
    }
  }
}

export const chatStore = new ChatStore();
