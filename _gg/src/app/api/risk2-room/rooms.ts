// ============================================================
// Shared in-memory room storage for Risk 2 Diwaniya mode
// ============================================================

export interface RoomData {
  data: Record<string, unknown>;
  spectators: { id: string; name: string; joinedAt: number }[];
  lastHeartbeat: number;
}

export const rooms = new Map<string, RoomData>();
