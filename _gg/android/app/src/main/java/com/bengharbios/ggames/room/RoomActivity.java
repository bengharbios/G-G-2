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
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.LayoutInflater;

/**
 * RoomActivity — يحمّل room_layout_room.xml من يلا لودو v1.5.1.0 كما هو.
 *
 * البيانات تأتي من Intent extras:
 *   - room_id: معرّف الغرفة
 *   - room_name: اسم الغرفة
 *   - room_image: خلفية الغرفة (URL أو فارغ للتدرّج الافتراضي)
 *   - mic_seat_count: عدد المقاعد (5 افتراضياً)
 *   - host_name: اسم المضيف
 *   - auth_token: رمز المصادقة (لـ WebSocket)
 */
public class RoomActivity extends Activity {

    private String roomId = "";
    private String roomName = "";
    private String roomImage = "";
    private int micSeatCount = 5;
    private String hostName = "";
    private String authToken = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // إخفاء شريط الحالة — ملء الشاشة
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        );

        // قراءة البيانات من Intent
        Intent intent = getIntent();
        roomId = intent.getStringExtra("room_id");
        roomName = intent.getStringExtra("room_name");
        roomImage = intent.getStringExtra("room_image");
        hostName = intent.getStringExtra("host_name");
        authToken = intent.getStringExtra("auth_token");
        micSeatCount = intent.getIntExtra("mic_seat_count", 5);

        // تحميل XML الأصلي من يلا لودو
        setContentView(R.layout.room_layout_room);

        // تطبيق خلفية الغرفة
        View root = findViewById(R.id.roomRoot);
        if (root != null) {
            if (roomImage != null && !roomImage.isEmpty()) {
                // TODO: تحميل صورة الخلفية من URL باستخدام Glide/Picasso
                // مؤقتاً: تدرّج أخضر يلا لودو
                root.setBackgroundColor(Color.parseColor("#0D8A7A"));
            } else {
                // التدرّج الافتراضي: #0D8A7A → #0A6B5E → #074a42
                GradientDrawable gradient = new GradientDrawable(
                    GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{0xFF0D8A7A, 0xFF0A6B5E, 0xFF074A42}
                );
                root.setBackground(gradient);
            }
        }

        // تعيين اسم الغرفة
        TextView tvRoomName = findViewById(R.id.tvRoomTopName); // من room_include_room_top
        if (tvRoomName != null && roomName != null) {
            tvRoomName.setText(roomName);
        }

        // تعيين معرّف الغرفة
        // tvRoomTopId قد يكون داخل llPretty — نبحث عنه
        TextView tvRoomId = findViewById(R.id.tvRoomTopId);
        if (tvRoomId != null && roomId != null) {
            tvRoomId.setText("ID:" + roomId);
        }

        // زر الإغلاق
        ImageView ivClose = findViewById(R.id.ivRoomTopClose);
        if (ivClose != null) {
            ivClose.setOnClickListener(v -> {
                finish(); // إغلاق Activity والعودة للـ WebView
            });
        }

        // زر المشاركة
        ImageView ivShare = findViewById(R.id.iv_share);
        if (ivShare != null) {
            ivShare.setVisibility(View.VISIBLE);
            ivShare.setOnClickListener(v -> {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_TEXT, "انضم لغرفتي: https://ggame3.vercel.app/voice-rooms");
                startActivity(Intent.createChooser(shareIntent, "مشاركة"));
            });
        }

        // زر المزيد (للمشرف)
        ImageView ivMore = findViewById(R.id.iv_more);
        if (ivMore != null) {
            ivMore.setVisibility(View.VISIBLE);
            ivMore.setOnClickListener(v -> {
                Toast.makeText(this, "الإعدادات", Toast.LENGTH_SHORT).show();
            });
        }

        // إنشاء مقاعد المايك
        LinearLayout micContainer = findViewById(R.id.rvRoomMic);
        if (micContainer != null) {
            // إنشاء مقاعد ديناميكياً (سيتم استبدالها بـ RecyclerView)
            for (int i = 0; i < micSeatCount; i++) {
                View seatView = createSeatView(i);
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
                );
                seatView.setLayoutParams(params);
                micContainer.addView(seatView);
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

        // زر الهدية (SVGA)
        // ivGift موجود في room_include_room_input — لكنه LudoSVGAView
        // يحتاج مشغل SVGA (مكتبة svgaplayerweb للويب، أو SVGAPlayer للـ Android)

        // زر الموسيقى (في القائمة الجانبية)
        // iv_room_music موجود في room_include_room_body_sidebar
    }

    /**
     * إنشاء مقعد مايك (دائرة + رقم + أيقونة)
     */
    private View createSeatView(int index) {
        LinearLayout seat = new LinearLayout(this);
        seat.setOrientation(LinearLayout.VERTICAL);
        seat.setGravity(Gravity.CENTER_HORIZONTAL);
        seat.setPadding(4, 4, 4, 4);

        // الدائرة
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

        // الاسم (فارغ)
        TextView name = new TextView(this);
        name.setText("");
        name.setTextColor(Color.WHITE);
        name.setTextSize(10);
        name.setGravity(Gravity.CENTER);
        name.setMaxWidth(dp(55));
        name.setMaxLines(1);

        seat.addView(circle);
        seat.addView(number);
        seat.addView(name);

        return seat;
    }

    /** تحويل dip إلى px */
    private int dp(int dip) {
        float density = getResources().getDisplayMetrics().density;
        return (int) (dip * density + 0.5f);
    }

    @Override
    public void onBackPressed() {
        // عند الضغط على زر الرجوع، أغلق الغرفة
        finish();
    }
}
