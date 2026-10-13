package com.bengharbios.ggames.room;

import com.bengharbios.ggames.R;

import android.app.AlertDialog;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewStub;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * RoomActivity — يحمّل room_layout_room.xml الأصلي من Yalla Ludo v1.5.1.0
 *
 * البنود المنفذة:
 * 1. الشريط السفلي: roomBottomInputView -> VISIBLE + WindowInsets
 * 2. ViewStubs: vsNoticeBoard + vsTopMessage inflate
 * 3. rvRoomMic: Adapter بسيط باستخدام room_include_room_mic_item.xml
 * 4. rvRoomChat: Adapter بسيط مع رسالة ترحيب
 * 5. ivRoomTopSound -> VISIBLE
 */
public class RoomActivity extends Activity {

    private static final String TAG = "RoomActivity";

    private String roomId = "100002";
    private String roomName = "الغريب";
    private String currentUserName = "أنا";
    private int micSeatCount = 5;
    private int mySeatIndex = -1;
    private boolean isMuted = false;

    // UI
    private RecyclerView rvRoomMic;
    private RecyclerView rvChat;
    private ImageView ivSound, ivMic, ivMicEmoji, ivGift, ivSendPicture, ivSend;
    private EditText etMessage;
    private TextView tvRoomTopName;
    private View roomRoot;

    // Data
    private List<MicSeat> micSeats = new ArrayList<>();
    private List<ChatMessage> chatMessages = new ArrayList<>();
    private Handler handler = new Handler(Looper.getMainLooper());
    private Random random = new Random();

    // Adapters
    private MicAdapter micAdapter;
    private ChatAdapter chatAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

            // WindowInsets — padding سفلي لمنع تغطية شريط النظام
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

            Intent intent = getIntent();
            if (intent != null) {
                if (intent.hasExtra("room_id")) roomId = intent.getStringExtra("room_id");
                if (intent.hasExtra("room_name")) roomName = intent.getStringExtra("room_name");
                micSeatCount = intent.getIntExtra("mic_seat_count", 5);
                if (intent.hasExtra("user_name")) currentUserName = intent.getStringExtra("user_name");
            }
        } catch (Exception e) {
            showErrorDialog("خطأ في الإعداد", e);
        }

        // تحميل XML الأصلي
        try {
            setContentView(R.layout.room_layout_room);
            Log.i(TAG, "✓ room_layout_room.xml loaded");
        } catch (Exception e) {
            Log.e(TAG, "setContentView failed", e);
            showErrorDialog("فشل تحميل تصميم الغرفة", e);
        }

        // خلفية متدرجة
        try {
            int contentViewId = getId("content_view");
            View root = findViewById(contentViewId);
            if (root != null) {
                GradientDrawable gradient = new GradientDrawable(
                    GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{0xFF1A1A2E, 0xFF16213E, 0xFF0F3460}
                );
                root.setBackground(gradient);
                roomRoot = root;
            }
        } catch (Exception e) {
            Log.e(TAG, "Background error", e);
        }

        // ===== البند 1: الشريط السفلي =====
        setupBottomBar();

        // ===== البند 2: ViewStubs =====
        inflateViewStubs();

        // ===== البند 5: الهيدر =====
        setupHeader();

        // ===== البند 3: مقاعد المايك =====
        setupMicSeats();

        // ===== البند 4: الدردشة =====
        setupChat();

        // محاكاة نشاط المايك
        startSpeakingSimulation();

        Toast.makeText(this, "تم فتح الغرفة", Toast.LENGTH_SHORT).show();
    }

    // ============================================
    // البند 1: الشريط السفلي
    // ============================================
    private void setupBottomBar() {
        try {
            // roomBottomInputView (gone) -> VISIBLE
            int inputViewId = getId("roomBottomInputView");
            View roomBottomInputView = findViewById(inputViewId);
            if (roomBottomInputView != null) {
                roomBottomInputView.setVisibility(View.VISIBLE);
                Log.i(TAG, "✓ roomBottomInputView -> VISIBLE");
            } else {
                Log.w(TAG, "roomBottomInputView not found");
            }

            // staticRoomBottomView -> تأكد أنه VISIBLE
            int staticBottomId = getId("staticRoomBottomView");
            View staticRoomBottomView = findViewById(staticBottomId);
            if (staticRoomBottomView != null) {
                staticRoomBottomView.setVisibility(View.VISIBLE);
                Log.i(TAG, "✓ staticRoomBottomView -> VISIBLE");

                // محاولة نفخ room_include_room_input داخله إن كان فارغاً
                if (staticRoomBottomView instanceof ViewGroup) {
                    ViewGroup container = (ViewGroup) staticRoomBottomView;
                    if (container.getChildCount() == 0) {
                        try {
                            View inputBar = LayoutInflater.from(this)
                                .inflate(R.layout.room_include_room_input, container, false);
                            container.addView(inputBar);
                            Log.i(TAG, "✓ Inflated room_include_room_input into staticRoomBottomView");
                        } catch (Exception e) {
                            Log.e(TAG, "Failed to inflate room_include_room_input", e);
                        }
                    }
                }
            }

            // اربط عناصر الشريط السفلي
            ivSound = findViewById(getId("ivSound"));
            ivMic = findViewById(getId("ivMic"));
            ivMicEmoji = findViewById(getId("ivMicEmoji"));
            ivGift = findViewById(getId("ivGift"));
            ivSendPicture = findViewById(getId("ivSendPicture"));
            ivSend = findViewById(getId("ivSend"));
            etMessage = findViewById(getId("etMessage"));

            // WindowInsets — padding سفلي
            View contentView = findViewById(android.R.id.content);
            if (contentView != null) {
                ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                    int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                    v.setPadding(0, 0, 0, bottomInset);
                    return insets;
                });
            }

            // Click listeners
            if (ivSound != null) {
                ivSound.setOnClickListener(btn -> Toast.makeText(this, "🔊 الصوت", Toast.LENGTH_SHORT).show());
            }
            if (ivMic != null) {
                ivMic.setOnClickListener(btn -> {
                    isMuted = !isMuted;
                    Toast.makeText(this, isMuted ? "🔇 مكتوم" : "🎤 مفعّل", Toast.LENGTH_SHORT).show();
                });
            }
            if (ivGift != null) {
                ivGift.setOnClickListener(btn -> Toast.makeText(this, "🎁 هدية", Toast.LENGTH_SHORT).show());
            }

            Log.i(TAG, "=== Bottom Bar IDs ===");
            Log.i(TAG, "ivSound: " + (ivSound != null ? "FOUND" : "NULL"));
            Log.i(TAG, "ivMic: " + (ivMic != null ? "FOUND" : "NULL"));
            Log.i(TAG, "ivGift: " + (ivGift != null ? "FOUND" : "NULL"));
            Log.i(TAG, "etMessage: " + (etMessage != null ? "FOUND" : "NULL"));
        } catch (Exception e) {
            Log.e(TAG, "setupBottomBar error", e);
        }
    }

    // ============================================
    // البند 2: ViewStubs (الإعلان والترحيب)
    // ============================================
    private void inflateViewStubs() {
        try {
            // vsNoticeBoard
            int noticeId = getId("vsNoticeBoard");
            if (noticeId != 0) {
                View noticeStub = findViewById(noticeId);
                if (noticeStub instanceof ViewStub) {
                    try {
                        View inflated = ((ViewStub) noticeStub).inflate();
                        Log.i(TAG, "✓ vsNoticeBoard inflated");
                        // ابحث عن TextView في الناتج واضبط نص الإعلان
                        if (inflated != null) {
                            setWelcomeText(inflated);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "vsNoticeBoard inflate failed", e);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "vsNoticeBoard error", e);
        }

        try {
            // vsTopMessage
            int topMsgId = getId("vsTopMessage");
            if (topMsgId != 0) {
                View topMsgStub = findViewById(topMsgId);
                if (topMsgStub instanceof ViewStub) {
                    try {
                        View inflated = ((ViewStub) topMsgStub).inflate();
                        Log.i(TAG, "✓ vsTopMessage inflated");
                        if (inflated != null) {
                            setWelcomeText(inflated);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "vsTopMessage inflate failed", e);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "vsTopMessage error", e);
        }
    }

    private void setWelcomeText(View parent) {
        try {
            // ابحث عن أي TextView داخل parent واضبط نص الترحيب
            if (parent instanceof ViewGroup) {
                ViewGroup vg = (ViewGroup) parent;
                for (int i = 0; i < vg.getChildCount(); i++) {
                    View child = vg.getChildAt(i);
                    if (child instanceof TextView) {
                        ((TextView) child).setText("مرحباً بك في غرفة " + roomName + "! احترم بعضكم بعضاً.");
                    }
                    if (child instanceof ViewGroup) {
                        setWelcomeText(child);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "setWelcomeText error", e);
        }
    }

    // ============================================
    // البند 5: الهيدر
    // ============================================
    private void setupHeader() {
        try {
            tvRoomTopName = findViewById(getId("tvRoomTopName"));
            if (tvRoomTopName != null) {
                tvRoomTopName.setText(roomName);
                Log.i(TAG, "✓ tvRoomTopName set to: " + roomName);
            }

            // ivRoomTopSound -> VISIBLE فقط
            int soundId = getId("ivRoomTopSound");
            if (soundId != 0) {
                ImageView ivRoomTopSound = findViewById(soundId);
                if (ivRoomTopSound != null) {
                    ivRoomTopSound.setVisibility(View.VISIBLE);
                    Log.i(TAG, "✓ ivRoomTopSound -> VISIBLE");
                }
            }

            // زر الإغلاق
            int[] closeIds = {getId("ivRoomTopClose"), getId("iv_room_top_close")};
            for (int id : closeIds) {
                if (id == 0) continue;
                ImageView ivClose = findViewById(id);
                if (ivClose != null) {
                    ivClose.setOnClickListener(v -> finish());
                    Log.i(TAG, "✓ Close button found");
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "setupHeader error", e);
        }
    }

    // ============================================
    // البند 3: مقاعد المايك
    // ============================================
    private void setupMicSeats() {
        try {
            rvRoomMic = findViewById(getId("rvRoomMic"));
            if (rvRoomMic == null) {
                Log.w(TAG, "rvRoomMic not found, creating fallback");
                createMicRecyclerViewFallback();
                return;
            }

            rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
            initMicSeats();
            micAdapter = new MicAdapter(micSeats);
            rvRoomMic.setAdapter(micAdapter);
            Log.i(TAG, "✓ rvRoomMic adapter set with " + micSeats.size() + " seats");
        } catch (Exception e) {
            Log.e(TAG, "setupMicSeats error", e);
            createMicRecyclerViewFallback();
        }
    }

    private void initMicSeats() {
        micSeats.clear();
        MicSeat ownerSeat = new MicSeat(0);
        ownerSeat.user = new RoomUser("owner_001", roomName, 0, 25, "owner");
        micSeats.add(ownerSeat);
        for (int i = 1; i < micSeatCount; i++) {
            micSeats.add(new MicSeat(i));
        }
    }

    private void createMicRecyclerViewFallback() {
        try {
            rvRoomMic = new RecyclerView(this);
            rvRoomMic.setId(View.generateViewId());
            rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
            initMicSeats();
            micAdapter = new MicAdapter(micSeats);
            rvRoomMic.setAdapter(micAdapter);
            ViewGroup content = (ViewGroup) findViewById(android.R.id.content);
            if (content != null && content.getChildCount() > 0) {
                ((ViewGroup) content.getChildAt(0)).addView(rvRoomMic);
            }
        } catch (Exception e) {
            Log.e(TAG, "Fallback RecyclerView error", e);
        }
    }

    // ============================================
    // البند 4: الدردشة
    // ============================================
    private void setupChat() {
        try {
            rvChat = findViewById(getId("rvRoomChat"));
            if (rvChat == null) {
                Log.w(TAG, "rvRoomChat not found");
                return;
            }

            rvChat.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
            chatAdapter = new ChatAdapter(chatMessages);
            rvChat.setAdapter(chatAdapter);

            // رسالة ترحيب
            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                "مرحباً بك في " + roomName + "! احترم بعضكم بعضاً وتحدث بأدب.", null
            ));
            Log.i(TAG, "✓ rvRoomChat adapter set with welcome message");
        } catch (Exception e) {
            Log.e(TAG, "setupChat error", e);
        }
    }

    private void addChatMessage(ChatMessage msg) {
        chatMessages.add(msg);
        try {
            if (chatAdapter != null) chatAdapter.notifyItemInserted(chatMessages.size() - 1);
            if (rvChat != null) rvChat.scrollToPosition(chatMessages.size() - 1);
        } catch (Exception e) {
            Log.e(TAG, "addChatMessage error", e);
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
    // شاشة الأخطاء
    // ============================================
    private void showErrorDialog(String title, Throwable error) {
        try {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            error.printStackTrace(pw);
            String stackTrace = sw.toString();
            new AlertDialog.Builder(this)
                .setTitle("❌ " + title)
                .setMessage(error.getMessage() + "\n\n" + stackTrace.substring(0, Math.min(stackTrace.length(), 1500)))
                .setPositiveButton("حسناً", (d, w) -> d.dismiss())
                .setCancelable(false)
                .show();
        } catch (Exception e) {
            Toast.makeText(this, title + ": " + error.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private int getId(String name) {
        try {
            return getResources().getIdentifier(name, "id", getPackageName());
        } catch (Exception e) {
            return 0;
        }
    }

    @Override
    public void onBackPressed() {
        finish();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try { handler.removeCallbacksAndMessages(null); } catch (Exception e) {}
    }

    // ============================================
    // Model Classes
    // ============================================
    static class MicSeat {
        int index;
        RoomUser user;
        boolean isMuted;
        boolean isSpeaking;
        MicSeat(int index) { this.index = index; this.user = null; }
    }

    static class RoomUser {
        String id, name, role;
        int avatarResId, level;
        RoomUser(String id, String name, int avatarResId, int level, String role) {
            this.id = id; this.name = name; this.avatarResId = avatarResId;
            this.level = level; this.role = role;
        }
    }

    static class ChatMessage {
        static final int TYPE_TEXT = 0;
        static final int TYPE_SYSTEM = 1;
        int type; RoomUser user; String text;
        ChatMessage(int type, RoomUser user, String text, String giftInfo) {
            this.type = type; this.user = user; this.text = text;
        }
    }

    // ============================================
    // MicAdapter — يستخدم room_include_room_mic_item.xml الأصلي
    // ============================================
    class MicAdapter extends RecyclerView.Adapter<MicAdapter.MicViewHolder> {
        private List<MicSeat> seats;

        MicAdapter(List<MicSeat> seats) { this.seats = seats; }

        @NonNull
        @Override
        public MicViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            // البند 3: استخدم room_include_room_mic_item.xml الأصلي
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.room_include_room_mic_item, parent, false);
            return new MicViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull MicViewHolder holder, int position) {
            try {
                MicSeat seat = seats.get(position);
                holder.bind(seat);
            } catch (Exception e) {
                Log.e(TAG, "MicAdapter bind error", e);
            }
        }

        @Override
        public int getItemCount() { return seats.size(); }

        class MicViewHolder extends RecyclerView.ViewHolder {
            ImageView head;
            TextView name;

            MicViewHolder(@NonNull View itemView) {
                super(itemView);
                // ابحث عن IDs من item layout الأصلي
                head = itemView.findViewById(getId("room_mic_item_head"));
                name = itemView.findViewById(getId("room_mic_item_name"));
            }

            void bind(MicSeat seat) {
                try {
                    if (seat.user != null) {
                        // مقعد مشغول
                        if (name != null) {
                            name.setText(seat.user.name);
                            name.setVisibility(View.VISIBLE);
                        }
                        // head: اتركه كما هو (له drawable افتراضي)
                        if (head != null) {
                            head.setVisibility(View.VISIBLE);
                            // اضبط خلفية دائرية للمستخدم
                            GradientDrawable circle = new GradientDrawable();
                            circle.setShape(GradientDrawable.OVAL);
                            circle.setColor(0xFF0D8A7A);
                            circle.setStroke(2, seat.isSpeaking ? Color.GREEN : Color.WHITE);
                            head.setBackground(circle);
                        }
                    } else {
                        // مقعد فارغ — اعرض رقم المقعد
                        if (name != null) {
                            name.setText(String.valueOf(seat.index + 1));
                            name.setVisibility(View.VISIBLE);
                        }
                        if (head != null) {
                            head.setVisibility(View.VISIBLE);
                            GradientDrawable circle = new GradientDrawable();
                            circle.setShape(GradientDrawable.OVAL);
                            circle.setColor(0x40000000);
                            circle.setStroke(2, 0xFF808080);
                            head.setBackground(circle);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "MicViewHolder bind error", e);
                }
            }
        }
    }

    // ============================================
    // ChatAdapter
    // ============================================
    class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.ChatViewHolder> {
        private List<ChatMessage> messages;
        ChatAdapter(List<ChatMessage> messages) { this.messages = messages; }

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
        public int getItemCount() { return messages.size(); }

        class ChatViewHolder extends RecyclerView.ViewHolder {
            ChatViewHolder(@NonNull View itemView) { super(itemView); }
        }
    }
}
