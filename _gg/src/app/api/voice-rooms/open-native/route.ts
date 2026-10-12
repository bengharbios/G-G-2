import { NextRequest, NextResponse } from 'next/server';

/*
 * POST /api/voice-rooms/open-native
 * 
 * يُستدعى من الـ WebView عند فتح غرفة.
 * يُرجع بيانات الغرفة التي يحتاجها RoomActivity الأصلي.
 * التطبيق (Capacitor) يلتقط هذا الطلب ويفتح RoomActivity بدلاً من عرضه في WebView.
 *
 * البيانات المُرجّعة:
 *   - roomId, roomName, roomImage, micSeatCount, hostName, authToken
 *
 * في المتصفح العادي: يُرجع البيانات فقط (لا يفتح Activity).
 * في التطبيق: Capacitor plugin يلتقط الطلب ويفتح RoomActivity.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, roomName, roomImage, micSeatCount, hostName } = body;
    
    return NextResponse.json({
      success: true,
      action: 'open_native_room',
      room: {
        roomId: roomId || '',
        roomName: roomName || '',
        roomImage: roomImage || '',
        micSeatCount: micSeatCount || 5,
        hostName: hostName || '',
      },
      // Capacitor plugin يقرأ هذه البيانات ويفتح RoomActivity
      // مع هذه القيم كـ Intent extras
    });
  } catch (error) {
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
