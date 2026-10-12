package com.bengharbios.ggames.plugins;

import android.content.Intent;
import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.bengharbios.ggames.room.RoomActivity;

/**
 * RoomPlugin — Capacitor plugin يفتح RoomActivity عند طلب المستخدم.
 *
 * من JavaScript في الـ WebView:
 *   RoomPlugin.openRoom({ roomId: '100002', roomName: 'الغريب', ... })
 * يفتح RoomActivity الأصلي الذي يحمّل XML من يلا لودو.
 */
@CapacitorPlugin(name = "RoomPlugin")
public class RoomPlugin extends Plugin {

    @PluginMethod
    public void openRoom(PluginCall call) {
        String roomId = call.getString("roomId", "");
        String roomName = call.getString("roomName", "");
        String roomImage = call.getString("roomImage", "");
        int micSeatCount = call.getInt("micSeatCount", 5);
        String hostName = call.getString("hostName", "");
        String authToken = call.getString("authToken", "");

        Intent intent = new Intent(getContext(), RoomActivity.class);
        intent.putExtra("room_id", roomId);
        intent.putExtra("room_name", roomName);
        intent.putExtra("room_image", roomImage);
        intent.putExtra("mic_seat_count", micSeatCount);
        intent.putExtra("host_name", hostName);
        intent.putExtra("auth_token", authToken);

        getActivity().startActivity(intent);

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("message", "Room opened: " + roomName);
        call.resolve(ret);
    }
}
