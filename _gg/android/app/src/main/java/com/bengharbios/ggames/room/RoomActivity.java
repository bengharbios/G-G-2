package com.bengharbios.ggames.room;

import com.bengharbios.ggames.R;
import com.bengharbios.ggames.view.CheckedImageView;
import com.bengharbios.ggames.view.CustomTextView;
import com.bengharbios.ggames.view.RoundImageView;
import com.bengharbios.ggames.view.WaveMicView;
import com.bengharbios.ggames.view.MarqueeTextView;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.FrameLayout;
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
 * RoomActivity — يحمّل room_layout_room.xml (نسخة مطابقة لـ Yalla Ludo v1.5.1.0)
 *
 * يدعم:
 *  ✓ ملء الشاشة (FLAG_FULLSCREEN) - يحل مشكلة الشريط السفلي المزدحم
 *  ✓ 5 مقاعد مايك (مع WaveMicView + RoundImageView + ContributionRankLabelView)
 *  ✓ الأريكة (Sofa) للمستمعين
 *  ✓ الشريط الجانبي الأيمن (8 أيقونات)
 *  ✓ الشريط السفلي بسلوك Yalla Ludo (المايك يظهر فقط عند الجلوس)
 *  ✓ الرسائل (نص + نظام + هدية)
 *  ✓ نقر المقعد → حوارية انضمام
 */
public class RoomActivity extends Activity {

    // الحالة
    private String roomId;
    private String roomName;
    private int micSeatCount = 5;
    private int currentUserId = 1001;
    private String currentUserName = "أنا";
    private int mySeatIndex = -1;  // -1 = لست على مايك
    private boolean isMuted = false;

    // UI References
    private TextView tvRoomName;
    private ImageView ivRoomClose;
    private ImageView ivInputSound;
    private ImageView ivInputMic;
    private ImageView ivInputMicEmoji;
    private ImageView ivInputGift;
    private EditText etMessage;
    private RecyclerView rvMic;
    private RecyclerView rvSofa;
    private RecyclerView rvChat;
    private TextView tvSofaCount;

    // البيانات
    private List<MicSeat> micSeats = new ArrayList<>();
    private List<SofaUser> sofaUsers = new ArrayList<>();
    private List<ChatMessage> chatMessages = new ArrayList<>();
    private Handler handler = new Handler(Looper.getMainLooper());
    private Random random = new Random();

    // Adapters
    private MicAdapter micAdapter;
    private SofaAdapter sofaAdapter;
    private ChatAdapter chatAdapter;
    
    // Dialog Manager
    private RoomDialogManager dialogManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ===== ملء الشاشة - يحل مشكلة ازدحام الشريط السفلي =====
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);

        // قراءة البيانات من Intent
        Intent intent = getIntent();
        roomId = intent.getStringExtra("room_id");
        if (roomId == null) roomId = "100002";
        roomName = intent.getStringExtra("room_name");
        if (roomName == null) roomName = "الغريب";
        micSeatCount = intent.getIntExtra("mic_seat_count", 5);
        currentUserName = intent.getStringExtra("user_name");
        if (currentUserName == null) currentUserName = "أنا";

        // تحميل XML
        setContentView(R.layout.room_layout_room);

        // خلفية الغرفة (تدرّج أخضر يلا لودو)
        View root = findViewById(R.id.roomRoot);
        GradientDrawable gradient = new GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            new int[]{0xFF0D8A7A, 0xFF0A6B5E, 0xFF074A42}
        );
        root.setBackground(gradient);

        // ===== ربط الـ UI =====
        bindViews();
        setupRecyclerViews();
        setupClickListeners();
        setupMessageInput();

        // ===== تهيئة البيانات =====
        initMicSeats();
        initSofaUsers();
        initChatMessages();

        // ===== Dialog Manager =====
        dialogManager = new RoomDialogManager(this, null);

        // ربط زر الإغلاق بـ dialog الخروج
        if (ivRoomClose != null) {
            ivRoomClose.setOnClickListener(v -> showQuitDialog());
        }

        // ربط زر الشريط الجانبي (info) بـ dialog الإعلان
        View llSidebarInfo = findViewById(R.id.ll_sidebar_info);
        if (llSidebarInfo != null) {
            llSidebarInfo.setOnClickListener(v -> {
                dialogManager.showAnnouncement("مرحباً! هذه غرفة " + roomName, text ->
                    Toast.makeText(this, "✅ تم حفظ الإعلان", Toast.LENGTH_SHORT).show()
                );
            });
        }

        // ربط زر الألعاب بـ dialog الرقم الحظ
        View llSidebarGame = findViewById(R.id.ll_sidebar_game);
        if (llSidebarGame != null) {
            llSidebarGame.setOnClickListener(v -> dialogManager.showLuckyNumber());
        }

        // رسالة ترحيب
        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_SYSTEM,
            null,
            "مرحباً بك في " + roomName + "! 💜",
            null
        ));

        // محاكاة نشاط المايك
        startSpeakingSimulation();
    }

    private void showQuitDialog() {
        dialogManager.showQuit(new RoomDialogManager.OnQuitListener() {
            @Override
            public void onQuit() {
                if (mySeatIndex != -1) leaveMic();
                finish();
            }
            @Override
            public void onMinimize() {
                // تصغير الغرفة - العودة للـ WebView
                finish();
            }
        });
    }

    // ============================================
    // ربط الـ UI
    // ============================================
    private void bindViews() {
        tvRoomName = findViewById(R.id.tv_room_top_name);
        ivRoomClose = findViewById(R.id.iv_room_top_close);
        ivInputSound = findViewById(R.id.iv_input_sound);
        ivInputMic = findViewById(R.id.iv_input_mic);
        ivInputMicEmoji = findViewById(R.id.iv_input_mic_emoji);
        ivInputGift = findViewById(R.id.iv_input_gift);
        etMessage = findViewById(R.id.et_message);
        rvMic = findViewById(R.id.rv_room_mic);
        rvSofa = findViewById(R.id.rv_sofa_listeners);
        rvChat = findViewById(R.id.rv_chat_messages);
        tvSofaCount = findViewById(R.id.tv_sofa_count);

        if (tvRoomName != null) tvRoomName.setText(roomName);
    }

    private void setupRecyclerViews() {
        // مقاعد المايك (5 مقاعد أفقية)
        rvMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        micAdapter = new MicAdapter(micSeats, this::onSeatClicked);
        rvMic.setAdapter(micAdapter);

        // الأريكة (مستمعين أفقياً)
        rvSofa.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        sofaAdapter = new SofaAdapter(sofaUsers);
        rvSofa.setAdapter(sofaAdapter);

        // الرسائل (عمودية)
        rvChat.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
        chatAdapter = new ChatAdapter(chatMessages);
        rvChat.setAdapter(chatAdapter);
    }

    private void setupClickListeners() {
        if (ivRoomClose != null) {
            ivRoomClose.setOnClickListener(v -> finish());
        }
        if (ivInputSound != null) {
            ivInputSound.setOnClickListener(v -> {
                Toast.makeText(this, "🔊 مستوى الصوت", Toast.LENGTH_SHORT).show();
            });
        }
        if (ivInputMic != null) {
            ivInputMic.setOnClickListener(v -> {
                isMuted = !isMuted;
                ivInputMic.setImageResource(
                    isMuted ? R.drawable.room_ic_input_mic_off : R.drawable.room_ic_input_mic
                );
                Toast.makeText(this, isMuted ? "🔇 مكتوم" : "🎤 مفعّل", Toast.LENGTH_SHORT).show();
            });
        }
        if (ivInputMicEmoji != null) {
            ivInputMicEmoji.setOnClickListener(v -> {
                Toast.makeText(this, "🎭 مايك إيموجي", Toast.LENGTH_SHORT).show();
            });
        }
        if (ivInputGift != null) {
            ivInputGift.setOnClickListener(v -> {
                Toast.makeText(this, "🎁 إرسال هدية", Toast.LENGTH_SHORT).show();
            });
        }

        // الشريط الجانبي
        setupSidebarClickListeners();
    }

    private void setupSidebarClickListeners() {
        findViewById(R.id.ll_sidebar_info).setOnClickListener(v ->
            Toast.makeText(this, "ℹ️ معلومات الغرفة", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_message).setOnClickListener(v ->
            Toast.makeText(this, "💬 الرسائل", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_gift_rank).setOnClickListener(v ->
            Toast.makeText(this, "🏆 التصنيف", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_fun).setOnClickListener(v ->
            Toast.makeText(this, "🎮 مركز المرح", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_shop).setOnClickListener(v ->
            Toast.makeText(this, "🛍️ المتجر", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_music).setOnClickListener(v ->
            Toast.makeText(this, "🎵 الموسيقى", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_game).setOnClickListener(v ->
            Toast.makeText(this, "🎲 الألعاب", Toast.LENGTH_SHORT).show());
        findViewById(R.id.ll_sidebar_rank).setOnClickListener(v ->
            Toast.makeText(this, "📊 التصنيف الأسبوعي", Toast.LENGTH_SHORT).show());
    }

    private void setupMessageInput() {
        if (etMessage != null) {
            etMessage.setOnEditorActionListener((v, actionId, event) -> {
                String text = v.getText().toString().trim();
                if (!text.isEmpty()) {
                    sendMessage(text);
                    v.setText("");
                    return true;
                }
                return false;
            });
            etMessage.addTextChangedListener(new TextWatcher() {
                @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
                @Override public void afterTextChanged(Editable s) {}
            });
        }
    }

    // ============================================
    // تهيئة البيانات
    // ============================================
    private void initMicSeats() {
        micSeats.clear();
        // المالك على المقعد الأول
        MicSeat ownerSeat = new MicSeat(0);
        ownerSeat.user = new RoomUser("owner_001", "أحمد", R.drawable.room_default, 25, "owner");
        ownerSeat.isSpeaking = false;
        ownerSeat.isMuted = false;
        micSeats.add(ownerSeat);

        // باقي المقاعد فارغة
        for (int i = 1; i < micSeatCount; i++) {
            micSeats.add(new MicSeat(i));
        }
        micAdapter.notifyDataSetChanged();
    }

    private void initSofaUsers() {
        sofaUsers.clear();
        sofaUsers.add(new SofaUser("u1", "سارة", R.drawable.room_default));
        sofaUsers.add(new SofaUser("u2", "محمد", R.drawable.room_default));
        sofaUsers.add(new SofaUser("u3", "فاطمة", R.drawable.room_default));
        sofaUsers.add(new SofaUser("u4", "عمر", R.drawable.room_default));
        sofaUsers.add(new SofaUser("u5", "نورة", R.drawable.room_default));
        sofaAdapter.notifyDataSetChanged();
        updateSofaCount();
    }

    private void initChatMessages() {
        chatMessages.clear();
        chatMessages.add(new ChatMessage(
            ChatMessage.TYPE_TEXT,
            new RoomUser("u1", "سارة", R.drawable.room_default, 18, "member"),
            "السلام عليكم ورحمة الله 🌟",
            null
        ));
        chatAdapter.notifyDataSetChanged();
    }

    private void updateSofaCount() {
        if (tvSofaCount != null) {
            tvSofaCount.setText(sofaUsers.size() + " مستمع");
        }
    }

    // ============================================
    // نقر المقعد - سلوك Yalla Ludo الأصلي
    // ============================================
    private void onSeatClicked(MicSeat seat) {
        if (seat.user != null) {
            // المقعد مشغول → عرض معلومات المستخدم
            dialogManager.showUserInfo(seat.user, false);
        } else if (mySeatIndex == -1) {
            // المقعد فارغ وأنا لست على مايك → حوارية انضم
            dialogManager.showTakeMic(() -> joinMic(seat.index));
        } else {
            // أنا على مايك آخر → اعرض خيار التبديل
            Toast.makeText(this, "أنت على المايك " + (mySeatIndex + 1) + ". غادر أولاً.", Toast.LENGTH_SHORT).show();
        }
    }

    private void joinMic(int seatIndex) {
        if (mySeatIndex != -1) return; // أنا على مايك بالفعل
        MicSeat seat = micSeats.get(seatIndex);
        seat.user = new RoomUser("me", currentUserName, R.drawable.room_default, 10, "member");
        seat.isMuted = false;
        mySeatIndex = seatIndex;
        micAdapter.notifyDataSetChanged();

        // تطبيق سلوك Yalla Ludo: المايك يظهر فقط عند الجلوس
        updateBottomBarForMicState();

        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_SYSTEM,
            null,
            currentUserName + " انضم للماك " + (seatIndex + 1),
            null
        ));
        Toast.makeText(this, "🎤 انضممت للماك " + (seatIndex + 1), Toast.LENGTH_SHORT).show();
    }

    private void leaveMic() {
        if (mySeatIndex == -1) return;
        MicSeat seat = micSeats.get(mySeatIndex);
        seat.user = null;
        seat.isMuted = false;
        int oldIdx = mySeatIndex;
        mySeatIndex = -1;
        isMuted = false;
        micAdapter.notifyDataSetChanged();

        updateBottomBarForMicState();

        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_SYSTEM,
            null,
            currentUserName + " غادر المايك " + (oldIdx + 1),
            null
        ));
    }

    /**
     * سلوك Yalla Ludo الأصلي:
     * - لست على مايك: يظهر فقط iv_input_sound + iv_input_gift
     * - على مايك: يظهر iv_input_mic + iv_input_mic_emoji + iv_input_gift (ويختفي iv_input_sound)
     */
    private void updateBottomBarForMicState() {
        if (mySeatIndex == -1) {
            // لست على مايك
            ivInputSound.setVisibility(View.VISIBLE);
            ivInputMic.setVisibility(View.GONE);
            ivInputMicEmoji.setVisibility(View.GONE);
        } else {
            // على مايك
            ivInputSound.setVisibility(View.GONE);
            ivInputMic.setVisibility(View.VISIBLE);
            ivInputMic.setImageResource(isMuted ? R.drawable.room_ic_input_mic_off : R.drawable.room_ic_input_mic);
            ivInputMicEmoji.setVisibility(View.VISIBLE);
        }
    }

    // ============================================
    // إرسال رسالة
    // ============================================
    private void sendMessage(String text) {
        addChatMessage(new ChatMessage(
            ChatMessage.TYPE_TEXT,
            new RoomUser("me", currentUserName, R.drawable.room_default, 10, "member"),
            text,
            null
        ));
    }

    private void addChatMessage(ChatMessage msg) {
        chatMessages.add(msg);
        chatAdapter.notifyItemInserted(chatMessages.size() - 1);
        rvChat.scrollToPosition(chatMessages.size() - 1);
    }

    // ============================================
    // محاكاة نشاط المايك
    // ============================================
    private void startSpeakingSimulation() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                for (MicSeat seat : micSeats) {
                    if (seat.user != null && !seat.isMuted) {
                        seat.isSpeaking = random.nextBoolean();
                    } else {
                        seat.isSpeaking = false;
                    }
                }
                micAdapter.notifyDataSetChanged();
                handler.postDelayed(this, 2000);
            }
        }, 2000);
    }

    // ============================================
    // الأزرار الإضافية
    // ============================================
    @Override
    public void onBackPressed() {
        // اعرض حوارية الخروج بدلاً من الإغلاق المباشر
        showQuitDialog();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        if (dialogManager != null) {
            dialogManager.dismissCurrent();
        }
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

    static class SofaUser {
        String id;
        String name;
        int avatarResId;

        SofaUser(String id, String name, int avatarResId) {
            this.id = id;
            this.name = name;
            this.avatarResId = avatarResId;
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
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.room_include_room_mic_item, parent, false);
            return new MicViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull MicViewHolder holder, int position) {
            MicSeat seat = seats.get(position);
            holder.bind(seat, listener);
        }

        @Override
        public int getItemCount() {
            return seats.size();
        }

        class MicViewHolder extends RecyclerView.ViewHolder {
            ImageView micBg;
            RoundImageView userAvatar;
            WaveMicView waveView;
            ImageView roleBadge;
            CustomTextView userName;

            MicViewHolder(@NonNull View itemView) {
                super(itemView);
                micBg = itemView.findViewById(R.id.mic_bg);
                userAvatar = itemView.findViewById(R.id.mic_user_avatar);
                waveView = itemView.findViewById(R.id.mic_wave_view);
                roleBadge = itemView.findViewById(R.id.mic_role_badge);
                userName = itemView.findViewById(R.id.mic_user_name);
            }

            void bind(MicSeat seat, OnSeatClickListener listener) {
                // إعادة تعيين كل شيء
                userName.setVisibility(View.GONE);
                roleBadge.setVisibility(View.GONE);
                waveView.setSpeaking(false);

                if (seat.user != null) {
                    // مقعد مشغول
                    userAvatar.setVisibility(View.VISIBLE);
                    userAvatar.setImageResource(seat.user.avatarResId);
                    userName.setVisibility(View.VISIBLE);
                    userName.setText(seat.user.name);

                    // تاج المالك
                    if ("owner".equals(seat.user.role)) {
                        roleBadge.setVisibility(View.VISIBLE);
                        roleBadge.setImageResource(R.drawable.room_icon_room_top_close_king);
                    }

                    // موجات صوتية عند الكلام
                    if (seat.isSpeaking && !seat.isMuted) {
                        waveView.setSpeaking(true);
                    }

                    // أيقونة مقفل (مكتوم)
                    if (seat.isMuted) {
                        micBg.setImageResource(R.drawable.room_ic_input_mic_off);
                    } else {
                        micBg.setImageResource(R.drawable.room_ic_room_mic_free);
                    }
                } else {
                    // مقعد فارغ
                    userAvatar.setVisibility(View.GONE);
                    micBg.setImageResource(R.drawable.room_ic_room_mic_free);
                }

                itemView.setOnClickListener(v -> {
                    if (listener != null) listener.onSeatClicked(seat);
                });
            }
        }
    }

    class SofaAdapter extends RecyclerView.Adapter<SofaAdapter.SofaViewHolder> {
        private List<SofaUser> users;

        SofaAdapter(List<SofaUser> users) {
            this.users = users;
        }

        @NonNull
        @Override
        public SofaViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.room_include_room_sofa_item, parent, false);
            return new SofaViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull SofaViewHolder holder, int position) {
            SofaUser user = users.get(position);
            holder.avatar.setImageResource(user.avatarResId);
        }

        @Override
        public int getItemCount() {
            return users.size();
        }

        class SofaViewHolder extends RecyclerView.ViewHolder {
            RoundImageView avatar;

            SofaViewHolder(@NonNull View itemView) {
                super(itemView);
                avatar = itemView.findViewById(R.id.sofa_user_avatar);
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
}
