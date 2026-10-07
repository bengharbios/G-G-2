// ============================================================
// ROOM SYNC UTILITY - Fire-and-forget sync to server
// ============================================================

export function syncRoomState(
  roomCode: string,
  data: {
    phase?: string;
    round?: number;
    stateJson?: string;
    resultsJson?: string;
    gameWinner?: string | null;
    players?: Array<{
      name: string;
      role: string | null;
      isAlive: boolean;
      isSilenced: boolean;
      hasRevealedMayor: boolean;
    }>;
  }
): void {
  if (!roomCode) return;

  fetch(`/api/room/${roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Fire-and-forget: silently catch errors
  });
}

export function syncTabotRoomState(
  roomCode: string,
  data: {
    phase?: string;
    round?: number;
    stateJson?: string;
  }
): void {
  if (!roomCode) return;

  fetch(`/api/room/${roomCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Fire-and-forget: silently catch errors
  });
}

export function endRoomSession(roomCode: string): void {
  if (!roomCode) return;

  fetch(`/api/room/${roomCode}`, {
    method: 'DELETE',
  }).catch(() => {
    // Fire-and-forget: silently catch errors
  });
}
