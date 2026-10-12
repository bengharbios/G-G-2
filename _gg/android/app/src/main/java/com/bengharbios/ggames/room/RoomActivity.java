package com.bengharbios.ggames.room;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.LinearLayout;
import android.widget.EditText;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;

/**
 * RoomActivity — يحمّل room_layout_room.xml (نسخة نظيفة بـ Android views قياسية)
 * كل الأيقونات من res/drawable-xxhdpi (من يلا لودو v1.5.1.0)
 */
public class RoomActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ملء الشاشة
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        );

        // قراءة البيانات من Intent
        Intent intent = getIntent();
        String roomId = intent.getStringExtra("room_id");
        String roomName = intent.getStringExtra("room_name");
        int micSeatCount = intent.getIntExtra("mic_seat_count", 5);

        // تحميل XML النظيف
        setContentView(R.layout.room_layout_room);

        // خلفية الغرفة (تدرّج أخضر يلا لودو)
        View root = findViewById(R.id.roomRoot);
        GradientDrawable gradient = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[]{0xFF0D8A7A, 0xFF0A6B5E, 0xFF074A42}
        );
        root.setBackground(gradient);

        // اسم الغرفة
        TextView tvRoomName = findViewById(R.id.tvRoomTopName);
        if (tvRoomName != null && roomName != null) {
            tvRoomName.setText(roomName);
        }

        // معرّف الغرفة
        TextView tvRoomId = findViewById(R.id.tvRoomTopId);
        if (tvRoomId != null && roomId != null) {
            tvRoomId.setText("ID: " + roomId);
        }

        // زر الإغلاق
        ImageView ivClose = findViewById(R.id.ivRoomTopClose);
        if (ivClose != null) {
            ivClose.setOnClickListener(v -> finish());
        }

        // زر المشاركة
        ImageView ivShare = findViewById(R.id.iv_share);
        if (ivShare != null) {
            ivShare.setOnClickListener(v -> {
                Toast.makeText(this, "مشاركة", Toast.LENGTH_SHORT).show();
            });
        }

        // زر المزيد
        ImageView ivMore = findViewById(R.id.iv_more);
        if (ivMore != null) {
            ivMore.setOnClickListener(v -> {
                Toast.makeText(this, "الإعدادات", Toast.LENGTH_SHORT).show();
            });
        }

        // إنشاء مقاعد المايك
        LinearLayout micContainer = findViewById(R.id.rvRoomMic);
        if (micContainer != null) {
            for (int i = 0; i < micSeatCount; i++) {
                View seat = createSeatView(i);
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
                );
                seat.setLayoutParams(params);
                micContainer.addView(seat);
            }
        }

        // حقل الإدخال
        EditText etMessage = findViewById(R.id.etMessage);
        if (etMessage != null) {
            etMessage.setHint(R.string.room_say_something);
        }

        // زر الصوت
        ImageView ivSound = findViewById(R.id.ivSound);
        if (ivSound != null) {
            ivSound.setOnClickListener(v -> {
                Toast.makeText(this, "الصوت", Toast.LENGTH_SHORT).show();
            });
        }

        // زر الموسيقى (في القائمة الجانبية)
        ImageView ivMusic = findViewById(R.id.iv_room_music);
        if (ivMusic != null) {
            ivMusic.setOnClickListener(v -> {
                Toast.makeText(this, "الموسيقى", Toast.LENGTH_SHORT).show();
            });
        }

        // زر الهدية
        ImageView ivGift = findViewById(R.id.ivGift);
        if (ivGift != null) {
            ivGift.setOnClickListener(v -> {
                Toast.makeText(this, "هدايا", Toast.LENGTH_SHORT).show();
            });
        }
    }

    /** إنشاء مقعد مايك (دائرة + رقم) */
    private View createSeatView(int index) {
        LinearLayout seat = new LinearLayout(this);
        seat.setOrientation(LinearLayout.VERTICAL);
        seat.setGravity(Gravity.CENTER_HORIZONTAL);
        seat.setPadding(8, 8, 8, 8);

        // الدائرة (44dp) مع أيقونة المايك
        ImageView circle = new ImageView(this);
        LinearLayout.LayoutParams circleParams = new LinearLayout.LayoutParams(
            dp(44), dp(44)
        );
        circle.setLayoutParams(circleParams);
        circle.setImageResource(R.drawable.room_ic_room_mic_free);
        circle.setScaleType(ImageView.ScaleType.FIT_CENTER);

        // الرقم
        TextView number = new TextView(this);
        number.setText(String.valueOf(index + 1));
        number.setTextColor(Color.WHITE);
        number.setTextSize(10);
        number.setGravity(Gravity.CENTER);

        seat.addView(circle);
        seat.addView(number);

        return seat;
    }

    private int dp(int dip) {
        float density = getResources().getDisplayMetrics().density;
        return (int) (dip * density + 0.5f);
    }

    @Override
    public void onBackPressed() {
        finish();
    }
}
