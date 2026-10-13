package com.bengharbios.ggames.room;

import com.bengharbios.ggames.R;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * RoomActivity - يحمّل room_layout_room.xml الأصلي من Yalla Ludo v1.5.1.0
 *
 * متانة عالية: كل findViewById محاط بـ try-catch لمنع الـ crashes
 *
 * يدعم:
 *  ✓ ملء الشاشة (FLAG_FULLSCREEN)
 *  ✓ تحميل XML الأصلي
 *  ✓ 5 مقاعد مايك (RecyclerView) - ننشئها برمجياً لتجنب IDs المفقودة
 *  ✓ سلوك Yalla Ludo للشريط السفلي (المايك يظهر فقط عند الجلوس)
 *  ✓ دردشة بسيطة (نص + نظام)
 */
public class RoomActivity extends Activity {

    private static final String TAG = "RoomActivity";

    // ===== الحالة =====
    private String roomId = "100002";
    private String roomName = "الغريب";
    private String currentUserName = "أنا";
    private int micSeatCount = 5;
    private int mySeatIndex = -1;
    private boolean isMuted = false;

    // ===== UI References (قد تكون null إذا الـ IDs غير موجودة) =====
    private RecyclerView rvRoomMic;
    private RecyclerView rvChat;
    private ImageView ivSound, ivMic, ivMicEmoji, ivGift, ivSendPicture, ivSend;
    private EditText etMessage;
    private TextView tvRoomTopName;
    private View roomRoot;

    // ===== البيانات =====
    private List<MicSeat> micSeats = new ArrayList<>();
    private List<ChatMessage> chatMessages = new ArrayList<>();
    private Handler handler = new Handler(Looper.getMainLooper());
    private Random random = new Random();

    // ===== Adapters =====
    private MicAdapter micAdapter;
    private ChatAdapter chatAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // ملء الشاشة - يحل مشكلة ازدحام الشريط السفلي
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

            // قراءة البيانات من Intent
            Intent intent = getIntent();
            if (intent != null) {
                if (intent.hasExtra("room_id")) roomId = intent.getStringExtra("room_id");
                if (intent.hasExtra("room_name")) roomName = intent.getStringExtra("room_name");
                micSeatCount = intent.getIntExtra("mic_seat_count", 5);
                if (intent.hasExtra("user_name")) currentUserName = intent.getStringExtra("user_name");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in setup", e);
        }

        // تحميل XML الأصلي - في try لمنع الـ crash
        try {
            setContentView(R.layout.room_layout_room);
        } catch (Exception e) {
            Log.e(TAG, "setContentView failed", e);
            // fallback: استخدم layout بسيط
            setContentView(createFallbackLayout());
        }

        // خلفية متدرجة (يلا لودو خضراء)
        try {
            View root = findViewById(getId("content_view"));
            if (root != null) {
                GradientDrawable gradient = new GradientDrawable(
                    GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{0xFF0D8A7A, 0xFF0A6B5E, 0xFF074A42}
                );
                root.setBackground(gradient);
            }
        } catch (Exception e) {
            Log.e(TAG, "Background setup error", e);
        }

        bindViewsSafely();
        setupRecyclerViewsSafely();
        setupClickListenersSafely();
        setupMessageInputSafely();

        initMicSeats();

        // رسالة ترحيب
        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_SYSTEM,
            null,
            "مرحباً بك في " + roomName + "! 💜",
            null
        ));

        // محاكاة نشاط المايك
        startSpeakingSimulation();

        Toast.makeText(this, "تم فتح الغرفة", Toast.LENGTH_SHORT).show();
    }

    // ============================================
    // Fallback layout بسيط إذا فشل setContentView الأصلي
    // ============================================
    private View createFallbackLayout() {
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        GradientDrawable gradient = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[]{0xFF0D8A7A, 0xFF0A6B5E, 0xFF074A42}
        );
        layout.setBackground(gradient);

        TextView tvTitle = new TextView(this);
        tvTitle.setText(roomName);
        tvTitle.setTextColor(Color.WHITE);
        tvTitle.setTextSize(20);
        tvTitle.setGravity(Gravity.CENTER);
        tvTitle.setPadding(0, 60, 0, 30);
        layout.addView(tvTitle);

        LinearLayout seatsRow = new LinearLayout(this);
        seatsRow.setOrientation(LinearLayout.HORIZONTAL);
        seatsRow.setGravity(Gravity.CENTER);
        seatsRow.setId(View.generateViewId());
        seatsRow.setLayoutParams(new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ));
        layout.addView(seatsRow);
        // سجّل الـ id كـ rvRoomMic
        // (سيُستخدم لاحقاً عند bindViewsSafely)

        return layout;
    }

    // ============================================
    // ربط الـ UI بأمان (كل محاولة في try-catch)
    // ============================================
    private void bindViewsSafely() {
        // استخدام getIdentifier لتفادي compile errors للـ IDs غير الموجودة
        try { rvRoomMic = findViewById(getId("rvRoomMic")); } catch (Exception e) { Log.w(TAG, "rvRoomMic not found"); }
        try { rvChat = findViewById(getId("rvChat")); } catch (Exception e) { Log.w(TAG, "rvChat not found"); }
        try { ivSound = findViewById(getId("ivSound")); } catch (Exception e) { Log.w(TAG, "ivSound not found"); }
        try { ivMic = findViewById(getId("ivMic")); } catch (Exception e) { Log.w(TAG, "ivMic not found"); }
        try { ivMicEmoji = findViewById(getId("ivMicEmoji")); } catch (Exception e) { Log.w(TAG, "ivMicEmoji not found"); }
        try { ivGift = findViewById(getId("ivGift")); } catch (Exception e) { Log.w(TAG, "ivGift not found"); }
        try { ivSendPicture = findViewById(getId("ivSendPicture")); } catch (Exception e) { Log.w(TAG, "ivSendPicture not found"); }
        try { ivSend = findViewById(getId("ivSend")); } catch (Exception e) { Log.w(TAG, "ivSend not found"); }
        try { etMessage = findViewById(getId("etMessage")); } catch (Exception e) { Log.w(TAG, "etMessage not found"); }
        try { tvRoomTopName = findViewById(getId("tvRoomTopName")); } catch (Exception e) { Log.w(TAG, "tvRoomTopName not found"); }
        try { roomRoot = findViewById(getId("content_view")); } catch (Exception e) { Log.w(TAG, "content_view not found"); }

        if (tvRoomTopName != null) {
            try { tvRoomTopName.setText(roomName); } catch (Exception e) {}
        }
    }

    /** يحصل على resource ID بالاسم - يتغافل compile-time errors */
    private int getId(String name) {
        try {
            return getResources().getIdentifier(name, "id", getPackageName());
        } catch (Exception e) {
            return 0;
        }
    }

    private void setupRecyclerViewsSafely() {
        try {
            if (rvRoomMic != null) {
                rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
                micAdapter = new MicAdapter(micSeats, this::onSeatClicked);
                rvRoomMic.setAdapter(micAdapter);
            } else {
                // fallback: أنشئ RecyclerView برمجياً وأضفه للمحتوى
                createMicRecyclerViewFallback();
            }
        } catch (Exception e) {
            Log.e(TAG, "Mic RecyclerView setup error", e);
            createMicRecyclerViewFallback();
        }

        try {
            if (rvChat != null) {
                rvChat.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
                chatAdapter = new ChatAdapter(chatMessages);
                rvChat.setAdapter(chatAdapter);
            }
        } catch (Exception e) {
            Log.e(TAG, "Chat RecyclerView setup error", e);
        }
    }

    private void createMicRecyclerViewFallback() {
        // إنشاء RecyclerView برمجياً في حالة عدم وجود rvRoomMic في XML
        try {
            rvRoomMic = new RecyclerView(this);
            rvRoomMic.setId(View.generateViewId());
            rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
            micAdapter = new MicAdapter(micSeats, this::onSeatClicked);
            rvRoomMic.setAdapter(micAdapter);

            // أضفه للمحتوى - ابحث عن أي Container
            if (roomRoot instanceof ViewGroup) {
                ((ViewGroup) roomRoot).addView(rvRoomMic);
            } else {
                // أو أضفه لـ content view
                ViewGroup content = (ViewGroup) findViewById(android.R.id.content);
                if (content != null && content.getChildCount() > 0) {
                    ((ViewGroup) content.getChildAt(0)).addView(rvRoomMic);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Fallback RecyclerView creation error", e);
        }
    }

    private void setupClickListenersSafely() {
        try {
            if (ivSound != null) {
                ivSound.setOnClickListener(v -> {
                    try {
                        Toast.makeText(this, "🔊 الصوت", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            }
            if (ivMic != null) {
                ivMic.setOnClickListener(v -> {
                    try {
                        isMuted = !isMuted;
                        toggleMic();
                        Toast.makeText(this, isMuted ? "🔇 مكتوم" : "🎤 مفعّل", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            }
            if (ivMicEmoji != null) {
                ivMicEmoji.setOnClickListener(v -> {
                    try {
                        Toast.makeText(this, "🎭 مايك إيموجي", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            }
            if (ivGift != null) {
                ivGift.setOnClickListener(v -> {
                    try {
                        Toast.makeText(this, "🎁 هدية", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            }
            if (ivSendPicture != null) {
                ivSendPicture.setOnClickListener(v -> {
                    try {
                        Toast.makeText(this, "📷 صورة", Toast.LENGTH_SHORT).show();
                    } catch (Exception e) {}
                });
            }

            // زر الإغلاق في الهيدر - ابحث عن عدة IDs محتملة
            int[] closeIds = {getId("ivRoomTopLock"), getId("iv_room_top_lock"), getId("ivClose")};
            for (int id : closeIds) {
                if (id == 0) continue;
                ImageView ivClose = findViewById(id);
                if (ivClose != null) {
                    ivClose.setOnClickListener(v -> finish());
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Click listeners setup error", e);
        }
    }

    private void setupMessageInputSafely() {
        try {
            if (etMessage != null) {
                etMessage.setOnEditorActionListener((v, actionId, event) -> {
                    try {
                        String text = v.getText().toString().trim();
                        if (!text.isEmpty()) {
                            sendMessage(text);
                            v.setText("");
                            return true;
                        }
                    } catch (Exception e) {}
                    return false;
                });
            }
            if (ivSend != null) {
                ivSend.setOnClickListener(v -> {
                    try {
                        if (etMessage != null) {
                            String text = etMessage.getText().toString().trim();
                            if (!text.isEmpty()) {
                                sendMessage(text);
                                etMessage.setText("");
                            }
                        }
                    } catch (Exception e) {}
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Message input setup error", e);
        }
    }

    // ============================================
    // toggleMic - كتم/تشغيل
    // ============================================
    private void toggleMic() {
        // تحديث الحالة فقط (بدون WebRTC فعلي)
        if (mySeatIndex != -1 && mySeatIndex < micSeats.size()) {
            micSeats.get(mySeatIndex).isMuted = isMuted;
            if (micAdapter != null) micAdapter.notifyItemChanged(mySeatIndex);
        }
    }

    // ============================================
    // إرسال رسالة
    // ============================================
    private void sendMessage(String text) {
        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_TEXT,
            new RoomUser("me", currentUserName, 0, 1, "member"),
            text, null
        ));
    }

    private void addChatMessage(ChatMessage msg) {
        chatMessages.add(msg);
        try {
            if (chatAdapter != null) {
                chatAdapter.notifyItemInserted(chatMessages.size() - 1);
            }
            if (rvChat != null) {
                rvChat.scrollToPosition(chatMessages.size() - 1);
            }
        } catch (Exception e) {
            Log.e(TAG, "addChatMessage error", e);
        }
    }

    // ============================================
    // مقاعد المايك
    // ============================================
    private void initMicSeats() {
        micSeats.clear();
        // المالك على المقعد الأول
        MicSeat ownerSeat = new MicSeat(0);
        ownerSeat.user = new RoomUser("owner_001", roomName, 0, 25, "owner");
        ownerSeat.isSpeaking = false;
        ownerSeat.isMuted = false;
        micSeats.add(ownerSeat);

        // باقي المقاعد فارغة
        for (int i = 1; i < micSeatCount; i++) {
            micSeats.add(new MicSeat(i));
        }
        try {
            if (micAdapter != null) micAdapter.notifyDataSetChanged();
        } catch (Exception e) {}
    }

    private void onSeatClicked(MicSeat seat) {
        try {
            if (seat.user != null) {
                Toast.makeText(this, "👤 " + seat.user.name + " (Lv." + seat.user.level + ")", Toast.LENGTH_SHORT).show();
            } else if (mySeatIndex == -1) {
                joinMic(seat.index);
            } else {
                Toast.makeText(this, "أنت على المايك " + (mySeatIndex + 1), Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {}
    }

    private void joinMic(int seatIndex) {
        if (mySeatIndex != -1) return;
        if (seatIndex >= micSeats.size()) return;
        try {
            MicSeat seat = micSeats.get(seatIndex);
            seat.user = new RoomUser("me", currentUserName, 0, 1, "member");
            seat.isMuted = false;
            mySeatIndex = seatIndex;
            if (micAdapter != null) micAdapter.notifyItemChanged(seatIndex);

            // تطبيق سلوك Yalla Ludo
            updateBottomBarForMicState();

            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                currentUserName + " انضم للمايك " + (seatIndex + 1), null
            ));
        } catch (Exception e) {
            Log.e(TAG, "joinMic error", e);
        }
    }

    private void leaveMic() {
        if (mySeatIndex == -1) return;
        try {
            int oldIdx = mySeatIndex;
            MicSeat seat = micSeats.get(mySeatIndex);
            seat.user = null;
            seat.isMuted = false;
            mySeatIndex = -1;
            isMuted = false;
            if (micAdapter != null) micAdapter.notifyItemChanged(oldIdx);

            updateBottomBarForMicState();

            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                currentUserName + " غادر المايك " + (oldIdx + 1), null
            ));
        } catch (Exception e) {
            Log.e(TAG, "leaveMic error", e);
        }
    }

    /**
     * سلوك Yalla Ludo الأصلي:
     * - لست على مايك: يظهر فقط iv_input_sound + iv_input_gift
     * - على مايك: يظهر iv_input_mic + iv_input_mic_emoji + يختفي iv_input_sound
     */
    private void updateBottomBarForMicState() {
        try {
            if (ivSound == null || ivMic == null || ivMicEmoji == null) return;

            if (mySeatIndex == -1) {
                ivSound.setVisibility(View.VISIBLE);
                ivMic.setVisibility(View.GONE);
                ivMicEmoji.setVisibility(View.GONE);
            } else {
                ivSound.setVisibility(View.GONE);
                ivMic.setVisibility(View.VISIBLE);
                ivMicEmoji.setVisibility(View.VISIBLE);
            }
        } catch (Exception e) {
            Log.e(TAG, "updateBottomBar error", e);
        }
    }

    // ============================================
    // محاكاة نشاط المايك
    // ============================================
    private void startSpeakingSimulation() {
        try {
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        for (MicSeat seat : micSeats) {
                            if (seat.user != null && !seat.isMuted) {
                                seat.isSpeaking = random.nextBoolean();
                            } else {
                                seat.isSpeaking = false;
                            }
                        }
                        if (micAdapter != null) micAdapter.notifyDataSetChanged();
                        handler.postDelayed(this, 2000);
                    } catch (Exception e) {}
                }
            }, 2000);
        } catch (Exception e) {}
    }

    // ============================================
    // الأزرار الإضافية
    // ============================================
    @Override
    public void onBackPressed() {
        if (mySeatIndex != -1) leaveMic();
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            handler.removeCallbacksAndMessages(null);
        } catch (Exception e) {}
    }

    // ============================================
    // Model Classes
    // ============================================
    static class MicSeat {
        int index;
        RoomUser user;
        boolean isMuted;
        boolean isSpeaking;

        MicSeat(int index) {
            this.index = index;
            this.user = null;
            this.isMuted = false;
            this.isSpeaking = false;
        }
    }

    static class RoomUser {
        String id;
        String name;
        int avatarResId;
        int level;
        String role;

        RoomUser(String id, String name, int avatarResId, int level, String role) {
            this.id = id;
            this.name = name;
            this.avatarResId = avatarResId;
            this.level = level;
            this.role = role;
        }
    }

    static class ChatMessage {
        static final int TYPE_TEXT = 0;
        static final int TYPE_SYSTEM = 1;
        static final int TYPE_GIFT = 2;

        int type;
        RoomUser user;
        String text;
        String giftInfo;

        ChatMessage(int type, RoomUser user, String text, String giftInfo) {
            this.type = type;
            this.user = user;
            this.text = text;
            this.giftInfo = giftInfo;
        }
    }

    // ============================================
    // Adapters
    // ============================================
    class MicAdapter extends RecyclerView.Adapter<MicAdapter.MicViewHolder> {
        private List<MicSeat> seats;
        private OnSeatClickListener listener;

        interface OnSeatClickListener {
            void onSeatClicked(MicSeat seat);
        }

        MicAdapter(List<MicSeat> seats, OnSeatClickListener listener) {
            this.seats = seats;
            this.listener = listener;
        }

        @NonNull
        @Override
        public MicViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            // إنشاء LinearLayout برمجياً (لتجنب الاعتماد على XML معقد)
            LinearLayout seat = new LinearLayout(parent.getContext());
            seat.setOrientation(LinearLayout.VERTICAL);
            seat.setGravity(Gravity.CENTER_HORIZONTAL);
            seat.setPadding(16, 16, 16, 16);
            seat.setLayoutParams(new ViewGroup.LayoutParams(
                dp(80), ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            return new MicViewHolder(seat);
        }

        @Override
        public void onBindViewHolder(@NonNull MicViewHolder holder, int position) {
            try {
                MicSeat seat = seats.get(position);
                holder.bind(seat);
            } catch (Exception e) {}
        }

        @Override
        public int getItemCount() {
            return seats.size();
        }

        class MicViewHolder extends RecyclerView.ViewHolder {
            LinearLayout container;
            ImageView avatar;
            TextView name;
            View speakingRing;

            MicViewHolder(@NonNull View itemView) {
                super(itemView);
                container = (LinearLayout) itemView;
                // أنشئ ImageView للح avatar
                avatar = new ImageView(itemView.getContext());
                LinearLayout.LayoutParams avatarParams = new LinearLayout.LayoutParams(dp(60), dp(60));
                avatar.setLayoutParams(avatarParams);
                container.addView(avatar);

                name = new TextView(itemView.getContext());
                name.setGravity(Gravity.CENTER);
                name.setTextColor(Color.WHITE);
                name.setTextSize(10);
                name.setMaxLines(1);
                container.addView(name);

                itemView.setOnClickListener(v -> {
                    int pos = getAdapterPosition();
                    if (pos != RecyclerView.NO_POSITION && listener != null) {
                        listener.onSeatClicked(seats.get(pos));
                    }
                });
            }

            void bind(MicSeat seat) {
                try {
                    if (seat.user != null) {
                        // مستخدم على المقعد - اعرض دائرة بنص
                        GradientDrawable circle = new GradientDrawable();
                        circle.setShape(GradientDrawable.OVAL);
                        circle.setColor(0xFF0D8A7A);
                        circle.setStroke(2, seat.isSpeaking ? Color.GREEN : Color.WHITE);
                        avatar.setBackground(circle);
                        avatar.setImageDrawable(null);
                        name.setText(seat.user.name);
                        name.setVisibility(View.VISIBLE);
                    } else {
                        // مقعد فارغ - اعرض +
                        GradientDrawable circle = new GradientDrawable();
                        circle.setShape(GradientDrawable.OVAL);
                        circle.setColor(0x40000000);
                        circle.setStroke(2, 0xFF808080);
                        avatar.setBackground(circle);
                        avatar.setImageDrawable(null);
                        name.setText("مقعد " + (seat.index + 1));
                        name.setVisibility(View.VISIBLE);
                    }
                } catch (Exception e) {}
            }
        }
    }

    class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.ChatViewHolder> {
        private List<ChatMessage> messages;

        ChatAdapter(List<ChatMessage> messages) {
            this.messages = messages;
        }

        @NonNull
        @Override
        public ChatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            TextView tv = new TextView(parent.getContext());
            tv.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            tv.setPadding(8, 4, 8, 4);
            return new ChatViewHolder(tv);
        }

        @Override
        public void onBindViewHolder(@NonNull ChatViewHolder holder, int position) {
            try {
                ChatMessage msg = messages.get(position);
                TextView tv = (TextView) holder.itemView;
                if (msg.type == ChatMessage.TYPE_SYSTEM) {
                    tv.setText("ℹ️ " + msg.text);
                    tv.setTextColor(0xFFFFC107);
                    tv.setGravity(Gravity.CENTER);
                    tv.setTextSize(11);
                } else {
                    tv.setText(msg.user.name + ": " + msg.text);
                    tv.setTextColor(Color.WHITE);
                    tv.setGravity(Gravity.START);
                    tv.setTextSize(12);
                }
            } catch (Exception e) {}
        }

        @Override
        public int getItemCount() {
            return messages.size();
        }

        class ChatViewHolder extends RecyclerView.ViewHolder {
            ChatViewHolder(@NonNull View itemView) {
                super(itemView);
            }
        }
    }

    private int dp(int dip) {
        try {
            float density = getResources().getDisplayMetrics().density;
            return (int) (dip * density + 0.5f);
        } catch (Exception e) {
            return dip;
        }
    }
}
