package com.bengharbios.ggames.room;

import com.bengharbios.ggames.R;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.view.View;
import android.widget.Toast;

/**
 * RoomActivity — يحمّل room_layout_room.xml الأصلي من Yalla Ludo v1.5.1.0
 * كل الأيقونات من res/drawable (مستخرجة من APK)
 */
public class RoomActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ملء الشاشة - يحل مشكلة الشريط السفلي المزدحم
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        // تحميل XML الأصلي من Yalla Ludo
        setContentView(R.layout.room_layout_room);

        Toast.makeText(this, "غرفة Yalla Ludo - إصدار أصلي 100%", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onBackPressed() {
        finish();
    }
}
