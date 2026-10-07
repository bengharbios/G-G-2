// ============================================================
// PRISON ROOM SYNC UTILITY - Fire-and-forget sync to server
// ============================================================

export function syncPrisonRoomState(
  roomCode: string,
  data: {
    phase?: string;
    round?: number;
    stateJson?: string;
  }
): void {
  if (!roomCode) return;

  fetch(`/api/prison-room/${roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Fire-and-forget: silently catch errors
  });
}

export function endPrisonRoomSession(roomCode: string): void {
  if (!roomCode) return;

  fetch(`/api/prison-room/${roomCode}`, {
    method: 'DELETE',
  }).catch(() => {
    // Fire-and-forget: silently catch errors
  });
}
