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
import android.util.TypedValue;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.ViewStub;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ViewSwitcher;

import androidx.annotation.NonNull;
import androidx.core.view.ViewCompat;
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
 * البنود A-G مع try/catch مستقل لكل بند:
 * A. المقاعد (5 مقاعد + أيقونة مايك + رقم + قفل + صورة افتراضية)
 * B. الهيدر (صورة الغرفة + ID + ivRoomTopSound)
 * C. صندوق الإعلان (vsNoticeBoard بنص تجريبي)
 * D. الشريط الجانبي الأيمن (Treasure / Activity / Music)
 * E. ivMic و ivEmoji يظهران عند التفاعل
 * F. كل الأزرار تعرض Toast باسمها
 * G. عداد الكأس = 0
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
    private ImageView ivShowGameCenter;
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

        // ===== UncaughtExceptionHandler =====
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                StringWriter sw = new StringWriter();
                PrintWriter pw = new PrintWriter(sw);
                pw.println("=== CRASH in RoomActivity ===");
                pw.println("Thread: " + thread.getName());
                pw.println("Time: " + new java.util.Date());
                pw.println("Room: " + roomId + " / " + roomName);
                throwable.printStackTrace(pw);
                String crashText = sw.toString();
                Log.e(TAG, crashText);
                java.io.FileOutputStream fos = openFileOutput("room_crash.log", MODE_PRIVATE);
                fos.write(crashText.getBytes());
                fos.close();
            } catch (Exception writeEx) {
                Log.e(TAG, "Failed to write crash log", writeEx);
            }
            finish();
            android.os.Process.killProcess(android.os.Process.myPid());
        });

        // ===== اعرض crash log سابق =====
        try {
            java.io.File crashFile = getFileStreamPath("room_crash.log");
            if (crashFile != null && crashFile.exists()) {
                java.io.FileInputStream fis = openFileInput("room_crash.log");
                byte[] data = new byte[(int) crashFile.length()];
                fis.read(data);
                fis.close();
                String crashText = new String(data);
                crashFile.delete();
                new AlertDialog.Builder(this)
                    .setTitle("💥 Crash سابق")
                    .setMessage(crashText.substring(0, Math.min(crashText.length(), 3000)))
                    .setPositiveButton("حسناً", (d, w) -> d.dismiss())
                    .setCancelable(false)
                    .show();
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to read crash log", e);
        }

        try {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
            );
            getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

            Intent intent = getIntent();
            if (intent != null) {
                if (intent.hasExtra("room_id")) roomId = intent.getStringExtra("room_id");
                if (intent.hasExtra("room_name")) roomName = intent.getStringExtra("room_name");
                micSeatCount = intent.getIntExtra("mic_seat_count", 5);
                if (intent.hasExtra("user_name")) currentUserName = intent.getStringExtra("user_name");
            }
        } catch (Exception e) {
            Log.e(TAG, "[Setup] Error", e);
        }

        // تحميل XML
        try {
            setContentView(R.layout.room_layout_room);
            Log.i(TAG, "✓ room_layout_room.xml loaded");
        } catch (Exception e) {
            Log.e(TAG, "setContentView failed", e);
            showErrorDialog("فشل تحميل تصميم الغرفة", e);
        }

        // خلفية
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

        // ===== البند A: المقاعد =====
        try {
            Log.i(TAG, "[A] بدء setupMicSeats");
            setupMicSeats();
            Log.i(TAG, "[A] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[A] setupMicSeats فشل", e);
        }

        // ===== البند B: الهيدر =====
        try {
            Log.i(TAG, "[B] بدء setupHeader");
            setupHeader();
            Log.i(TAG, "[B] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[B] setupHeader فشل", e);
        }

        // ===== البند C: الإعلان والترحيب =====
        try {
            Log.i(TAG, "[C] بدء setupAnnouncement");
            setupAnnouncement();
            Log.i(TAG, "[C] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[C] setupAnnouncement فشل", e);
        }

        // ===== البند D: الشريط الجانبي =====
        try {
            Log.i(TAG, "[D] بدء setupSidebar");
            setupSidebar();
            Log.i(TAG, "[D] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[D] setupSidebar فشل", e);
        }

        // ===== البند E: الشريط السفلي + WindowInsets =====
        try {
            Log.i(TAG, "[E] بدء setupBottomBar");
            setupBottomBar();
            Log.i(TAG, "[E] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[E] setupBottomBar فشل", e);
        }

        // ===== البند F: Toast على كل زر =====
        try {
            Log.i(TAG, "[F] بدء setupToasts");
            setupToasts();
            Log.i(TAG, "[F] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[F] setupToasts فشل", e);
        }

        // ===== البند G: عداد الكأس =====
        try {
            Log.i(TAG, "[G] بدء setupTrophy");
            setupTrophy();
            Log.i(TAG, "[G] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[G] setupTrophy فشل", e);
        }

        // ===== الدردشة =====
        try {
            Log.i(TAG, "[Chat] بدء setupChat");
            setupChat();
            Log.i(TAG, "[Chat] اكتمل بنجاح");
        } catch (Exception e) {
            Log.e(TAG, "[Chat] setupChat فشل", e);
        }

        startSpeakingSimulation();
        Toast.makeText(this, "تم فتح الغرفة", Toast.LENGTH_SHORT).show();

        // ===== تشخيص مؤقت على الشاشة =====
        showDiagnosticOverlay();
    }

    /**
     * تشخيص مؤقت: TextView أحمر يعرض حالة rvRoomMic والأخطاء
     */
    private void showDiagnosticOverlay() {
        try {
            // اجمع الأخطاء الملتقطة
            final StringBuilder diag = new StringBuilder();

            // rvRoomMic
            if (rvRoomMic != null) {
                diag.append("rvRoomMic:\n");
                diag.append("  vis=").append(rvRoomMic.getVisibility()).append("\n");
                diag.append("  w=").append(rvRoomMic.getWidth());
                diag.append(" h=").append(rvRoomMic.getHeight()).append("\n");
                diag.append("  adapter=").append(rvRoomMic.getAdapter() != null ? "set" : "NULL").append("\n");
                diag.append("  itemCount=").append(micAdapter != null ? micAdapter.getItemCount() : -1).append("\n");
                diag.append("  childCount=").append(rvRoomMic.getChildCount()).append("\n");
                // أبعاد أول child بعد post
                rvRoomMic.post(() -> {
                    try {
                        StringBuilder d2 = new StringBuilder(diag);
                        d2.append("  post-childCount=").append(rvRoomMic.getChildCount()).append("\n");
                        if (rvRoomMic.getChildCount() > 0) {
                            View child = rvRoomMic.getChildAt(0);
                            d2.append("  child0: w=").append(child.getWidth());
                            d2.append(" h=").append(child.getHeight());
                            d2.append(" vis=").append(child.getVisibility()).append("\n");
                            // أبناء الـ child
                            if (child instanceof ViewGroup) {
                                ViewGroup vg = (ViewGroup) child;
                                d2.append("  child0.childCount=").append(vg.getChildCount()).append("\n");
                                for (int i = 0; i < vg.getChildCount() && i < 5; i++) {
                                    View sub = vg.getChildAt(i);
                                    d2.append("    sub").append(i).append(": vis=").append(sub.getVisibility());
                                    d2.append(" w=").append(sub.getWidth()).append(" h=").append(sub.getHeight()).append("\n");
                                }
                            }
                        }
                        updateDiagText(d2.toString());
                    } catch (Exception e) {
                        updateDiagText("post error: " + e.getMessage());
                    }
                });
            } else {
                diag.append("rvRoomMic: NULL (fallback used)\n");
            }

            // llRoomTop
            int llRoomTopId = getId("llRoomTop");
            if (llRoomTopId != 0) {
                View llRoomTop = findViewById(llRoomTopId);
                if (llRoomTop != null) {
                    llRoomTop.post(() -> {
                        try {
                            StringBuilder d3 = new StringBuilder(diag);
                            d3.append("llRoomTop:\n");
                            d3.append("  w=").append(llRoomTop.getWidth());
                            d3.append(" h=").append(llRoomTop.getHeight()).append("\n");
                            d3.append("  vis=").append(llRoomTop.getVisibility()).append("\n");
                            d3.append("  y=").append(llRoomTop.getY()).append("\n");
                            updateDiagText(d3.toString());
                        } catch (Exception e) {}
                    });
                }
            }

            // أنشئ TextView تشخيص
            final TextView diagView = new TextView(this);
            diagView.setId(View.generateViewId());
            diagView.setText(diag.toString());
            diagView.setTextColor(Color.WHITE);
            diagView.setBackgroundColor(0xCC000000);
            diagView.setTextSize(10);
            diagView.setPadding(8, 8, 8, 8);
            diagView.setMaxLines(25);

            // أضفه فوق كل شيء
            ViewGroup contentView = (ViewGroup) findViewById(android.R.id.content);
            if (contentView != null && contentView.getChildCount() > 0) {
                FrameLayout overlay = new FrameLayout(this);
                FrameLayout.LayoutParams flp = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                );
                flp.gravity = Gravity.TOP;
                overlay.addView(diagView, flp);
                ((ViewGroup) contentView.getChildAt(0)).addView(overlay);
                diagView.setTag("diag_overlay");
            }

            // اجعل rvRoomMic خلفية حمراء شفافة
            if (rvRoomMic != null) {
                rvRoomMic.setBackgroundColor(0x44FF0000);
                rvRoomMic.bringToFront();
            }

        } catch (Exception e) {
            Log.e(TAG, "showDiagnosticOverlay error", e);
        }
    }

    private void updateDiagText(final String text) {
        try {
            runOnUiThread(() -> {
                ViewGroup content = (ViewGroup) findViewById(android.R.id.content);
                if (content != null && content.getChildCount() > 0) {
                    View root = content.getChildAt(0);
                    if (root instanceof ViewGroup) {
                        ViewGroup vg = (ViewGroup) root;
                        for (int i = 0; i < vg.getChildCount(); i++) {
                            View child = vg.getChildAt(i);
                            if (child instanceof ViewGroup) {
                                ViewGroup overlay = (ViewGroup) child;
                                for (int j = 0; j < overlay.getChildCount(); j++) {
                                    View v = overlay.getChildAt(j);
                                    if (v instanceof TextView && "diag_overlay".equals(v.getTag())) {
                                        ((TextView) v).setText(text);
                                        return;
                                    }
                                }
                            }
                            if (child instanceof TextView && "diag_overlay".equals(child.getTag())) {
                                ((TextView) child).setText(text);
                                return;
                            }
                        }
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "updateDiagText error", e);
        }
    }

    // ============================================
    // البند A: المقاعد (مع إصلاح ارتفاع rvRoomMic)
    // ============================================
    private void setupMicSeats() {
        try {
            rvRoomMic = findViewById(getId("rvRoomMic"));
            if (rvRoomMic == null) {
                Log.w(TAG, "[A] rvRoomMic not found, fallback");
                createMicRecyclerViewFallback();
                return;
            }

            // إصلاح ارتفاع rvRoomMic (تبعية دائرية → 0)
            int heightPx = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, 100,
                getResources().getDisplayMetrics());
            ViewGroup.LayoutParams params = rvRoomMic.getLayoutParams();
            if (params != null) {
                params.height = heightPx;
                rvRoomMic.setLayoutParams(params);
                Log.i(TAG, "[A] rvRoomMic height set to 100dp");
            }

            // أيضاً اضبط llRoomTop ارتفاع ثابت
            int llRoomTopId = getId("llRoomTop");
            if (llRoomTopId != 0) {
                View llRoomTop = findViewById(llRoomTopId);
                if (llRoomTop != null) {
                    int topHeightPx = (int) TypedValue.applyDimension(
                        TypedValue.COMPLEX_UNIT_DIP, 220,
                        getResources().getDisplayMetrics());
                    ViewGroup.LayoutParams topParams = llRoomTop.getLayoutParams();
                    if (topParams != null) {
                        topParams.height = topHeightPx;
                        llRoomTop.setLayoutParams(topParams);
                        Log.i(TAG, "[A] llRoomTop height set to 220dp");
                    }
                }
            }

            rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
            initMicSeats();
            micAdapter = new MicAdapter(micSeats);
            rvRoomMic.setAdapter(micAdapter);
            Log.i(TAG, "[A] rvRoomMic adapter set with " + micSeats.size() + " seats");
        } catch (Exception e) {
            Log.e(TAG, "[A] setupMicSeats error", e);
            createMicRecyclerViewFallback();
        }
    }

    private void initMicSeats() {
        micSeats.clear();
        MicSeat ownerSeat = new MicSeat(0);
        ownerSeat.user = new RoomUser("owner_001", roomName, 0, 25, "owner");
        micSeats.add(ownerSeat);
        for (int i = 1; i < micSeatCount; i++) {
            MicSeat seat = new MicSeat(i);
            // المقعد 3 مقفل (مثل Yalla Ludo الأصلي)
            if (i == 2) seat.isLocked = true;
            micSeats.add(seat);
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
            Log.e(TAG, "[A] Fallback RecyclerView error", e);
        }
    }

    // ============================================
    // البند B: الهيدر
    // ============================================
    private void setupHeader() {
        try {
            tvRoomTopName = findViewById(getId("tvRoomTopName"));
            if (tvRoomTopName != null) {
                tvRoomTopName.setText(roomName);
                Log.i(TAG, "[B] tvRoomTopName = " + roomName);
            }

            // ivRoomTopSound -> VISIBLE
            int soundId = getId("ivRoomTopSound");
            if (soundId != 0) {
                ImageView ivRoomTopSound = findViewById(soundId);
                if (ivRoomTopSound != null) {
                    ivRoomTopSound.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[B] ivRoomTopSound -> VISIBLE");
                }
            }

            // ID الغرفة = 100002 — ابحث عن tvRoomTopLevel
            int levelId = getId("tvRoomTopLevel");
            if (levelId != 0) {
                TextView tvLevel = findViewById(levelId);
                if (tvLevel != null) {
                    tvLevel.setText("ID:" + roomId);
                    Log.i(TAG, "[B] tvRoomTopLevel = ID:" + roomId);
                }
            }

            // زر الإغلاق
            int[] closeIds = {getId("ivRoomTopClose"), getId("iv_room_top_close")};
            for (int id : closeIds) {
                if (id == 0) continue;
                ImageView ivClose = findViewById(id);
                if (ivClose != null) {
                    ivClose.setOnClickListener(v -> finish());
                    Log.i(TAG, "[B] Close button found");
                    break;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[B] setupHeader error", e);
        }
    }

    // ============================================
    // البند C: الإعلان (ViewStubs)
    // ============================================
    private void setupAnnouncement() {
        // vsNoticeBoard
        try {
            int noticeId = getId("vsNoticeBoard");
            if (noticeId != 0) {
                View noticeStub = findViewById(noticeId);
                if (noticeStub instanceof ViewStub) {
                    ViewParent parent = noticeStub.getParent();
                    if (parent != null) {
                        try {
                            View inflated = ((ViewStub) noticeStub).inflate();
                            Log.i(TAG, "[C] vsNoticeBoard inflated");
                            if (inflated != null) {
                                setTextViewRecursive(inflated,
                                    "📢 إعلان: مرحباً بكم في غرفة " + roomName + "!");
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[C] vsNoticeBoard inflate failed", e);
                        }
                    }
                } else if (noticeStub != null) {
                    Log.i(TAG, "[C] vsNoticeBoard already inflated");
                    setTextViewRecursive(noticeStub,
                        "📢 إعلان: مرحباً بكم في غرفة " + roomName + "!");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[C] vsNoticeBoard error", e);
        }

        // vsTopMessage
        try {
            int topMsgId = getId("vsTopMessage");
            if (topMsgId != 0) {
                View topMsgStub = findViewById(topMsgId);
                if (topMsgStub instanceof ViewStub) {
                    ViewParent parent = topMsgStub.getParent();
                    if (parent != null) {
                        try {
                            View inflated = ((ViewStub) topMsgStub).inflate();
                            Log.i(TAG, "[C] vsTopMessage inflated");
                            if (inflated != null) {
                                setTextViewRecursive(inflated,
                                    "مرحباً بك في " + roomName + "! احترم بعضكم بعضاً.");
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[C] vsTopMessage inflate failed", e);
                        }
                    }
                } else if (topMsgStub != null) {
                    Log.i(TAG, "[C] vsTopMessage already inflated");
                    setTextViewRecursive(topMsgStub,
                        "مرحباً بك في " + roomName + "! احترم بعضكم بعضاً.");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[C] vsTopMessage error", e);
        }
    }

    private void setTextViewRecursive(View parent, String text) {
        try {
            if (parent instanceof TextView) {
                ((TextView) parent).setText(text);
            }
            if (parent instanceof ViewGroup) {
                ViewGroup vg = (ViewGroup) parent;
                for (int i = 0; i < vg.getChildCount(); i++) {
                    setTextViewRecursive(vg.getChildAt(i), text);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "setTextViewRecursive error", e);
        }
    }

    // ============================================
    // البند D: الشريط الجانبي الأيمن
    // ============================================
    private void setupSidebar() {
        try {
            // rightScrollView
            int scrollId = getId("rightScrollView");
            if (scrollId != 0) {
                View rightScroll = findViewById(scrollId);
                if (rightScroll != null) {
                    rightScroll.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[D] rightScrollView -> VISIBLE");
                }
            }

            // Treasure / Activity / Music
            String[] sidebarIds = {"operations_activity_banner", "eventAndGameBannerView",
                "activesBannerView", "ivRoomMusic", "ivMessagesBox"};
            String[] sidebarNames = {"الكنز", "النشاط", "البانر", "الموسيقى", "الرسائل"};

            for (int i = 0; i < sidebarIds.length; i++) {
                final int sid = getId(sidebarIds[i]);
                if (sid == 0) continue;
                final String name = sidebarNames[i];
                View v = findViewById(sid);
                if (v != null) {
                    v.setVisibility(View.VISIBLE);
                    v.setOnClickListener(btn ->
                        Toast.makeText(this, "📋 " + name, Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[D] " + name + " -> VISIBLE + Toast");
                }
            }

            // fl_message_box (gone) -> VISIBLE
            int msgBoxId = getId("fl_message_box");
            if (msgBoxId != 0) {
                View msgBox = findViewById(msgBoxId);
                if (msgBox != null) {
                    msgBox.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[D] fl_message_box -> VISIBLE");
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[D] setupSidebar error", e);
        }
    }

    // ============================================
    // البند E: الشريط السفلي + WindowInsets
    // ============================================
    private void setupBottomBar() {
        try {
            // roomBottomInputView (gone) -> VISIBLE
            int inputViewId = getId("roomBottomInputView");
            if (inputViewId != 0) {
                View roomBottomInputView = findViewById(inputViewId);
                if (roomBottomInputView != null) {
                    roomBottomInputView.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[E] roomBottomInputView -> VISIBLE");
                }
            }

            // staticRoomBottomView -> VISIBLE + inflate input if empty
            int staticBottomId = getId("staticRoomBottomView");
            if (staticBottomId != 0) {
                View staticRoomBottomView = findViewById(staticBottomId);
                if (staticRoomBottomView != null) {
                    staticRoomBottomView.setVisibility(View.VISIBLE);
                    if (staticRoomBottomView instanceof ViewGroup) {
                        ViewGroup container = (ViewGroup) staticRoomBottomView;
                        if (container.getChildCount() == 0) {
                            try {
                                View inputBar = LayoutInflater.from(this)
                                    .inflate(R.layout.room_include_room_input, container, false);
                                container.addView(inputBar);
                                Log.i(TAG, "[E] Inflated room_include_room_input");
                            } catch (Exception e) {
                                Log.e(TAG, "[E] Failed to inflate room_include_room_input", e);
                            }
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
            ivShowGameCenter = findViewById(getId("ivShowGameCenter"));
            etMessage = findViewById(getId("etMessage"));

            // WindowInsets
            View contentView = findViewById(android.R.id.content);
            if (contentView != null) {
                ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                    int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                    v.setPadding(0, 0, 0, bottomInset);
                    return insets;
                });
            }

            // البند E: ivMic يظهر عند الضغط على مقعد (انضم)
            // ivEmoji يظهر عند التركيز على حقل الكتابة
            final int emojiId = getId("ivEmoji");
            if (etMessage != null && emojiId != 0) {
                etMessage.setOnFocusChangeListener((v, hasFocus) -> {
                    try {
                        if (hasFocus) {
                            ImageView ivEmoji = findViewById(emojiId);
                            if (ivEmoji != null) {
                                ivEmoji.setVisibility(View.VISIBLE);
                            }
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "[E] etMessage focus error", e);
                    }
                });
            }

            Log.i(TAG, "[E] Bottom bar IDs: ivSound=" + (ivSound != null)
                + " ivMic=" + (ivMic != null)
                + " ivGift=" + (ivGift != null)
                + " etMessage=" + (etMessage != null));
        } catch (Exception e) {
            Log.e(TAG, "[E] setupBottomBar error", e);
        }
    }

    // ============================================
    // البند F: Toast على كل زر
    // ============================================
    private void setupToasts() {
        try {
            // الشريط السفلي
            if (ivSound != null) {
                ivSound.setOnClickListener(v ->
                    Toast.makeText(this, "🔊 الصوت", Toast.LENGTH_SHORT).show());
            }
            if (ivMic != null) {
                ivMic.setOnClickListener(v -> {
                    isMuted = !isMuted;
                    Toast.makeText(this, isMuted ? "🔇 مكتوم" : "🎤 مفعّل", Toast.LENGTH_SHORT).show();
                    updateBottomBarForMicState();
                });
            }
            if (ivMicEmoji != null) {
                ivMicEmoji.setOnClickListener(v ->
                    Toast.makeText(this, "🎭 مايك إيموجي", Toast.LENGTH_SHORT).show());
            }
            if (ivGift != null) {
                ivGift.setOnClickListener(v ->
                    Toast.makeText(this, "🎁 هدية", Toast.LENGTH_SHORT).show());
            }
            if (ivSendPicture != null) {
                ivSendPicture.setOnClickListener(v ->
                    Toast.makeText(this, "📷 صورة", Toast.LENGTH_SHORT).show());
            }
            if (ivSend != null) {
                ivSend.setOnClickListener(v -> {
                    Toast.makeText(this, "📨 إرسال", Toast.LENGTH_SHORT).show();
                    if (etMessage != null) {
                        String text = etMessage.getText().toString().trim();
                        if (!text.isEmpty()) {
                            addChatMessage(new ChatMessage(
                                ChatMessage.TYPE_TEXT,
                                new RoomUser("me", currentUserName, 0, 1, "member"),
                                text, null));
                            etMessage.setText("");
                        }
                    }
                });
            }
            if (ivShowGameCenter != null) {
                ivShowGameCenter.setOnClickListener(v ->
                    Toast.makeText(this, "🎮 مركز الألعاب", Toast.LENGTH_SHORT).show());
            }

            // الهيدر
            int moreId = getId("iv_more");
            if (moreId != 0) {
                ImageView ivMore = findViewById(moreId);
                if (ivMore != null) {
                    ivMore.setOnClickListener(v ->
                        Toast.makeText(this, "⚙️ المزيد", Toast.LENGTH_SHORT).show());
                }
            }

            // ivRoomTopLikeJoin
            int likeJoinId = getId("ivRoomTopLikeJoin");
            if (likeJoinId != 0) {
                View likeJoin = findViewById(likeJoinId);
                if (likeJoin != null) {
                    likeJoin.setOnClickListener(v ->
                        Toast.makeText(this, "👍 إعجاب/انضمام", Toast.LENGTH_SHORT).show());
                }
            }

            Log.i(TAG, "[F] All Toasts set");
        } catch (Exception e) {
            Log.e(TAG, "[F] setupToasts error", e);
        }
    }

    // ============================================
    // البند G: عداد الكأس = 0
    // ============================================
    private void setupTrophy() {
        try {
            // likeAndIdxViewSwitcher (ViewSwitcher في الهيدر)
            int switcherId = getId("likeAndIdxViewSwitcher");
            if (switcherId != 0) {
                View switcher = findViewById(switcherId);
                if (switcher instanceof ViewSwitcher) {
                    ViewSwitcher vs = (ViewSwitcher) switcher;
                    // ابحث عن TextView داخل الـ ViewSwitcher
                    for (int i = 0; i < vs.getChildCount(); i++) {
                        View child = vs.getChildAt(i);
                        if (child instanceof TextView) {
                            ((TextView) child).setText("0");
                            Log.i(TAG, "[G] Trophy set to 0 in ViewSwitcher child " + i);
                        }
                        if (child instanceof ViewGroup) {
                            setTextViewRecursive(child, "0");
                        }
                    }
                }
            }

            // roomTopic
            int topicId = getId("roomTopic");
            if (topicId != 0) {
                ImageView roomTopic = findViewById(topicId);
                if (roomTopic != null) {
                    roomTopic.setVisibility(View.VISIBLE);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[G] setupTrophy error", e);
        }
    }

    // ============================================
    // الدردشة
    // ============================================
    private void setupChat() {
        try {
            rvChat = findViewById(getId("rvRoomChat"));
            if (rvChat == null) {
                Log.w(TAG, "[Chat] rvRoomChat not found");
                return;
            }
            rvChat.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false));
            chatAdapter = new ChatAdapter(chatMessages);
            rvChat.setAdapter(chatAdapter);

            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                "مرحباً بك في " + roomName + "! احترم بعضكم بعضاً وتحدث بأدب.", null));
            Log.i(TAG, "[Chat] rvRoomChat adapter set");
        } catch (Exception e) {
            Log.e(TAG, "[Chat] setupChat error", e);
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
    // سلوك Yalla Ludo: المايك يظهر فقط عند الجلوس
    // ============================================
    private void updateBottomBarForMicState() {
        try {
            if (ivSound == null || ivMic == null) return;
            if (mySeatIndex == -1) {
                ivSound.setVisibility(View.VISIBLE);
                ivMic.setVisibility(View.GONE);
                if (ivMicEmoji != null) ivMicEmoji.setVisibility(View.GONE);
            } else {
                ivSound.setVisibility(View.GONE);
                ivMic.setVisibility(View.VISIBLE);
                if (ivMicEmoji != null) ivMicEmoji.setVisibility(View.VISIBLE);
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
        boolean isLocked;
        MicSeat(int index) {
            this.index = index;
            this.user = null;
            this.isMuted = false;
            this.isSpeaking = false;
            this.isLocked = false;
        }
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
            // الملف يبدأ بـ <merge> — نحتاج FrameLayout wrapper
            FrameLayout wrapper = new FrameLayout(parent.getContext());
            int widthPx = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, 80,
                parent.getResources().getDisplayMetrics());
            wrapper.setLayoutParams(new ViewGroup.LayoutParams(
                widthPx, ViewGroup.LayoutParams.WRAP_CONTENT
            ));
            try {
                LayoutInflater.from(parent.getContext())
                    .inflate(R.layout.room_include_room_mic_item, wrapper, true);
            } catch (Exception e) {
                Log.e(TAG, "[A] Failed to inflate mic_item", e);
            }
            return new MicViewHolder(wrapper);
        }

        @Override
        public void onBindViewHolder(@NonNull MicViewHolder holder, int position) {
            try {
                MicSeat seat = seats.get(position);
                holder.bind(seat);
            } catch (Exception e) {
                Log.e(TAG, "[A] MicAdapter bind error", e);
            }
        }

        @Override
        public int getItemCount() { return seats.size(); }

        class MicViewHolder extends RecyclerView.ViewHolder {
            ImageView head;
            ImageView mute;
            TextView name;

            MicViewHolder(@NonNull View itemView) {
                super(itemView);
                head = itemView.findViewById(getId("room_mic_item_head"));
                mute = itemView.findViewById(getId("room_mic_item_mute"));
                name = itemView.findViewById(getId("room_mic_item_name"));
                itemView.setOnClickListener(v -> {
                    int pos = getAdapterPosition();
                    if (pos != RecyclerView.NO_POSITION) {
                        onSeatClicked(seats.get(pos));
                    }
                });
            }

            void bind(MicSeat seat) {
                try {
                    // إخفاء الكل افتراضياً
                    if (mute != null) mute.setVisibility(View.GONE);

                    if (seat.isLocked) {
                        // مقعد مقفل
                        if (head != null) {
                            head.setVisibility(View.VISIBLE);
                            head.setImageResource(R.drawable.room_ic_room_mic_lock);
                        }
                        if (name != null) {
                            name.setText("مقفل");
                            name.setVisibility(View.VISIBLE);
                        }
                    } else if (seat.user != null) {
                        // مقعد مشغول
                        if (head != null) {
                            head.setVisibility(View.VISIBLE);
                            // صورة افتراضية: دائرة ملونة
                            GradientDrawable circle = new GradientDrawable();
                            circle.setShape(GradientDrawable.OVAL);
                            circle.setColor(0xFF0D8A7A);
                            circle.setStroke(2, seat.isSpeaking ? Color.GREEN : Color.WHITE);
                            head.setImageDrawable(circle);
                        }
                        if (mute != null && seat.isMuted) {
                            mute.setVisibility(View.VISIBLE);
                            mute.setImageResource(R.drawable.room_ic_input_mic_off);
                        }
                        if (name != null) {
                            name.setText(seat.user.name);
                            name.setVisibility(View.VISIBLE);
                        }
                    } else {
                        // مقعد فارغ — أيقونة مايك
                        if (head != null) {
                            head.setVisibility(View.VISIBLE);
                            head.setImageResource(R.drawable.room_ic_room_mic_free);
                        }
                        if (name != null) {
                            name.setText(String.valueOf(seat.index + 1));
                            name.setVisibility(View.VISIBLE);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "[A] MicViewHolder bind error", e);
                }
            }
        }
    }

    // ============================================
    // معالج نقر المقعد
    // ============================================
    private void onSeatClicked(MicSeat seat) {
        try {
            if (seat.isLocked) {
                Toast.makeText(this, "🔒 مقعد مقفل", Toast.LENGTH_SHORT).show();
            } else if (seat.user != null) {
                Toast.makeText(this, "👤 " + seat.user.name + " (Lv." + seat.user.level + ")",
                    Toast.LENGTH_SHORT).show();
            } else if (mySeatIndex == -1) {
                // انضم للمايك
                seat.user = new RoomUser("me", currentUserName, 0, 1, "member");
                seat.isMuted = false;
                mySeatIndex = seat.index;
                if (micAdapter != null) micAdapter.notifyItemChanged(seat.index);
                updateBottomBarForMicState();
                addChatMessage(new ChatMessage(
                    ChatMessage.TYPE_SYSTEM, null,
                    currentUserName + " انضم للمايك " + (seat.index + 1), null));
                Toast.makeText(this, "🎤 انضممت للمايك " + (seat.index + 1), Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "أنت على المايك " + (mySeatIndex + 1), Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "onSeatClicked error", e);
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
