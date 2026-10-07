import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'participants'; // participants, newest, name

    // Import dynamically to avoid circular deps
    const { getClient } = await import('@/lib/admin-db');
    
    let sql = 'SELECT vr.*, COUNT(vrp.id) as participantCount FROM VoiceRoom vr LEFT JOIN VoiceRoomParticipant vrp ON vrp.roomId = vr.id GROUP BY vr.id';
    const args: any[] = [];
    
    const conditions: string[] = [];
    if (query) {
      conditions.push('(vr.name LIKE ? OR vr.description LIKE ? OR vr.hostName LIKE ?)');
      args.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }
    
    // For now, don't filter by category since rooms don't have a category field
    // In future, add a category field to VoiceRoom table
    
    if (conditions.length > 0) {
      sql += ' HAVING ' + conditions.join(' AND ');
    }
    
    if (sort === 'participants') {
      sql += ' ORDER BY participantCount DESC';
    } else if (sort === 'newest') {
      sql += ' ORDER BY vr.createdAt DESC';
    } else if (sort === 'name') {
      sql += ' ORDER BY vr.name ASC';
    }
    
    sql += ' LIMIT 50';
    
    const client = getClient();
    // We need to call ensureAdminTables first
    const { ensureAdminTables } = await import('@/lib/admin-db');
    await ensureAdminTables();
    
    const result = await client.execute({ sql, args });
    
    const rooms = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      hostId: r.hostId,
      hostName: r.hostName || '',
      maxParticipants: r.maxParticipants || 50,
      participantCount: Number(r.participantCount || 0),
      isPrivate: !!(r.isPrivate && r.isPrivate !== 0),
      roomMode: r.roomMode || 'public',
      roomLevel: r.roomLevel || 1,
      micSeatCount: r.micSeatCount || 10,
      micTheme: r.micTheme || 'chat5',
      roomImage: r.roomImage || '',
      roomAvatar: r.roomAvatar || '',
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Voice room search error:', error);
    return NextResponse.json({ error: error.message || 'Search failed', rooms: [] }, { status: 500 });
  }
}
