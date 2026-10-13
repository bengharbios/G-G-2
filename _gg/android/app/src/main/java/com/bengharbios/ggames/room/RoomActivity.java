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
    private String roomName = "البرج";
    private String currentUserName = "أنا";
    private int micSeatCount = 5;
    private int mySeatIndex = -1;
    private boolean isMuted = false;

    // UI
    private RecyclerView rvRoomMic;
    private RecyclerView rvChat;
    private ImageView ivSound, ivMic, ivMicEmoji, ivGift, ivSendPicture, ivSend;
    private ImageView ivShowGameCenter;
    private EditText etMessage;        // الحقل في الشريط السفلي (معطّل — يفتح overlay عند النقر)
    private EditText etInputMessage;  // الحقل في الـ overlay (نشط — يستقبل الكتابة)
    private TextView tvRoomTopName;   // اسم الغرفة في الهيدر
    private View roomRoot;
    // عناصر إضافية للصورة 21
    // (تم حذف ownerTagView — غير مطلوب في الأصل)
    // (تم حذف leftChatBtn/leftMusicBtn — هما في الأصل موجودان في rightScrollView)
    // (تم حذف inputOverlayView — استبدل بتبديل visibility بين staticRoomBottomView و roomBottomInputView)

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

        // خلفية: استخدم bg_chat_room الأصلي (cityscape ليلي مطابق للصورة 21)
        try {
            int contentViewId = getId("content_view");
            View root = findViewById(contentViewId);
            if (root != null) {
                // 1) خلفية content_view = bg_chat_room (مدينة ليلية)
                try {
                    int bgId = getResources().getIdentifier("bg_chat_room", "drawable", getPackageName());
                    if (bgId != 0) {
                        root.setBackgroundResource(bgId);
                        Log.i(TAG, "[BG] content_view bg=bg_chat_room");
                    } else {
                        // Fallback: gradient بنفسجي/أزرق غامق
                        GradientDrawable gradient = new GradientDrawable(
                            GradientDrawable.Orientation.TOP_BOTTOM,
                            new int[]{0xFF1A1A2E, 0xFF16213E, 0xFF0F3460}
                        );
                        root.setBackground(gradient);
                        Log.w(TAG, "[BG] bg_chat_room not found, fallback gradient");
                    }
                } catch (Exception e1) {
                    Log.e(TAG, "[BG] content_view bg error", e1);
                }
                roomRoot = root;
            }

            // 2) iv_room_theme: أيضاً استخدم bg_chat_room (طبقة فوقية)
            try {
                int themeIvId = getId("iv_room_theme");
                if (themeIvId != 0) {
                    ImageView ivTheme = findViewById(themeIvId);
                    if (ivTheme != null) {
                        int bgId = getResources().getIdentifier("bg_chat_room", "drawable", getPackageName());
                        if (bgId != 0) {
                            ivTheme.setImageResource(bgId);
                            ivTheme.setVisibility(View.VISIBLE);
                            Log.i(TAG, "[BG] iv_room_theme=bg_chat_room");
                        }
                    }
                }
            } catch (Exception e2) {
                Log.e(TAG, "[BG] iv_room_theme error", e2);
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

        // ===== البند D2: تم حذفه — أزرار الشريط الأيسر موجودة أصلاً في rightScrollView =====

        // ===== البند D3: Owner pill-tag — محذوف =====
        // المستخدم أشار أن الـ pill-tag يظهر فوق زر الخروج ولا يوجد في Yalla Ludo الأصلي بهذا الشكل
        // في الأصل، المالك يُحدد عبر تاج (room_icon_room_top_close_king) على صورة المستخدم في المقعد الأول
        // ولا توجد pill-tag في الأعلى. سيُحذف في بناء لاحق إذا لم يكن ضرورياً.

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
    }

    // ============================================
    // البند A: المقاعد — استخدم قيم XML الأصلية (wrap_content + marginTop=110dp)
    // إن غابت المقاعد بسبب تبعية دائرية، احسب ارتفاع llRoomTop فقط
    // ============================================
    private void setupMicSeats() {
        try {
            rvRoomMic = findViewById(getId("rvRoomMic"));
            if (rvRoomMic == null) {
                Log.w(TAG, "[A] rvRoomMic not found, fallback");
                createMicRecyclerViewFallback();
                return;
            }

            // [المرحلة 2 - البند 4] لا نضبط ارتفاع rvRoomMic ولا llRoomTop برمجياً
            // XML الأصلي: rvRoomMic height=wrap_content + marginTop=110dp
            //             llRoomTop height=wrap_content + داخله 50dp + 50dp
            // لا padding برمجي — XML يحدد كل شيء

            rvRoomMic.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));

            initMicSeats();
            micAdapter = new MicAdapter(micSeats);
            rvRoomMic.setAdapter(micAdapter);
            Log.i(TAG, "[A] rvRoomMic adapter set with " + micSeats.size() + " seats");

            // تحقق إن كانت المقاعد مرئية (ارتفاع rvRoomMic > 0)
            rvRoomMic.post(() -> {
                try {
                    if (rvRoomMic.getHeight() == 0) {
                        Log.w(TAG, "[A] rvRoomMic height==0 — fallback: set llRoomTop height");
                        // fallback: احسب ارتفاع llRoomTop فقط (لا تغير rvRoomMic)
                        // llRoomTop = 50dp (top) + 50dp (sofa) + 100dp (rvRoomMic) = 200dp تقريباً
                        int llRoomTopId = getId("llRoomTop");
                        if (llRoomTopId != 0) {
                            View llRoomTop = findViewById(llRoomTopId);
                            if (llRoomTop != null) {
                                int topHeightPx = (int) TypedValue.applyDimension(
                                    TypedValue.COMPLEX_UNIT_DIP, 200,
                                    getResources().getDisplayMetrics());
                                ViewGroup.LayoutParams topParams = llRoomTop.getLayoutParams();
                                if (topParams != null) {
                                    topParams.height = topHeightPx;
                                    llRoomTop.setLayoutParams(topParams);
                                    Log.i(TAG, "[A] llRoomTop height fallback set to 200dp");
                                }
                            }
                        }
                    } else {
                        Log.i(TAG, "[A] rvRoomMic height OK = " + rvRoomMic.getHeight());
                    }
                } catch (Exception e) {
                    Log.e(TAG, "[A] post-check error", e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "[A] setupMicSeats error", e);
            createMicRecyclerViewFallback();
        }
    }

    private void initMicSeats() {
        micSeats.clear();
        // المرحلة 1 - البند 2: لا بروفايل وهمي في المايك 1
        // جميع المقاعد فارغة مثل بعضها (مطابقة لطلب المستخدم)
        for (int i = 0; i < micSeatCount; i++) {
            MicSeat seat = new MicSeat(i);
            // المقعد 3 (index=2) مقفل (مثل Yalla Ludo الأصلي)
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
            // rivRoomTopHeader — صورة الغرفة (40dp, src=room_default)
            // app:srcCompat لا يعمل مع ImageView العادي، اضبط برمجياً
            int headerId = getId("rivRoomTopHeader");
            if (headerId != 0) {
                ImageView rivHeader = findViewById(headerId);
                if (rivHeader != null) {
                    rivHeader.setImageResource(R.drawable.room_default);
                    Log.i(TAG, "[B] rivRoomTopHeader = room_default");
                }
            }

            // tvRoomTopName — اسم الغرفة (13sp, bold, white, 20dp)
            tvRoomTopName = findViewById(getId("tvRoomTopName"));
            if (tvRoomTopName != null) {
                tvRoomTopName.setText(roomName);
                Log.i(TAG, "[B] tvRoomTopName = " + roomName);
            }

            // tvRoomTopLevel — مستوى/ID الغرفة (7sp, color_FFA, 24dp)
            int levelId = getId("tvRoomTopLevel");
            if (levelId != 0) {
                TextView tvLevel = findViewById(levelId);
                if (tvLevel != null) {
                    tvLevel.setText("ID:" + roomId);
                    Log.i(TAG, "[B] tvRoomTopLevel = ID:" + roomId);
                }
            }

            // ivRoomTopSound — invisible في الأصل (لا تظهر، متداخلة مع المقاعد)
            // أبقها invisible كما في تصميم Yalla Ludo الأصلي

            // ivRoomTopLikeJoin — عداد الكأس/الإعجاب (36dp)
            int likeJoinId = getId("ivRoomTopLikeJoin");
            if (likeJoinId != 0) {
                View likeJoin = findViewById(likeJoinId);
                if (likeJoin != null) {
                    likeJoin.setVisibility(View.VISIBLE);
                    likeJoin.setOnClickListener(v ->
                        Toast.makeText(this, "🏆 الكأس: 0", Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[B] ivRoomTopLikeJoin -> VISIBLE + Toast");
                }
            }

            // likeAndIdxViewSwitcher — نص "0" (عداد الإعجابات)
            int switcherId = getId("likeAndIdxViewSwitcher");
            if (switcherId != 0) {
                View switcher = findViewById(switcherId);
                if (switcher instanceof ViewSwitcher) {
                    ViewSwitcher vs = (ViewSwitcher) switcher;
                    for (int i = 0; i < vs.getChildCount(); i++) {
                        View child = vs.getChildAt(i);
                        if (child instanceof TextView) {
                            ((TextView) child).setText("0");
                        }
                    }
                    Log.i(TAG, "[B] likeAndIdxViewSwitcher = 0");
                }
            }

            // roomTopic — أيقونة الموضوع (wrap x 40dp, src=room_topic_entrance_icon)
            int topicId = getId("roomTopic");
            if (topicId != 0) {
                ImageView roomTopic = findViewById(topicId);
                if (roomTopic != null) {
                    roomTopic.setVisibility(View.VISIBLE);
                    roomTopic.setOnClickListener(v ->
                        Toast.makeText(this, "📝 الموضوع", Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[B] roomTopic -> VISIBLE");
                }
            }

            // iv_more — زر المزيد (wrap x 40dp, src=room_icon_room_top_more)
            int moreId = getId("iv_more");
            if (moreId != 0) {
                ImageView ivMore = findViewById(moreId);
                if (ivMore != null) {
                    ivMore.setOnClickListener(v ->
                        Toast.makeText(this, "⚙️ المزيد", Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[B] iv_more click");
                }
            }

            // ivRoomTopClose — زر الإغلاق (wrap x 40dp, src=room_icon_room_top_close)
            int[] closeIds = {getId("ivRoomTopClose"), getId("iv_room_top_close")};
            for (int id : closeIds) {
                if (id == 0) continue;
                ImageView ivClose = findViewById(id);
                if (ivClose != null) {
                    ivClose.setOnClickListener(v -> finish());
                    Log.i(TAG, "[B] ivRoomTopClose click");
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

        // vsTopMessage — رسالة ذهبية تحت المقاعد (مطابقة للصورة 21)
        try {
            int topMsgId = getId("vsTopMessage");
            String welcomeText = "مرحبا بكم في الغرفة! اضغط على ميكروفون لتحدث 🔒";
            if (topMsgId != 0) {
                View topMsgStub = findViewById(topMsgId);
                if (topMsgStub instanceof ViewStub) {
                    ViewParent parent = topMsgStub.getParent();
                    if (parent != null) {
                        try {
                            View inflated = ((ViewStub) topMsgStub).inflate();
                            Log.i(TAG, "[C] vsTopMessage inflated");
                            if (inflated != null) {
                                setTextViewRecursive(inflated, welcomeText);
                                applyGoldenTextStyle(inflated);
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[C] vsTopMessage inflate failed", e);
                        }
                    }
                } else if (topMsgStub != null) {
                    Log.i(TAG, "[C] vsTopMessage already inflated");
                    setTextViewRecursive(topMsgStub, welcomeText);
                    applyGoldenTextStyle(topMsgStub);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[C] vsTopMessage error", e);
        }
    }

    /** يطبّق لون ذهبي + ظل أسود على TextViews (مطابقة للصورة 21) */
    private void applyGoldenTextStyle(View view) {
        try {
            if (view instanceof TextView) {
                TextView tv = (TextView) view;
                tv.setTextColor(0xFFFFD700); // ذهبي
                tv.setShadowLayer(4f, 1f, 1f, 0xFF000000); // ظل أسود
                tv.setTextSize(13);
                tv.setGravity(Gravity.CENTER);
                tv.setSingleLine(false);
                tv.setMaxLines(2);
            }
            if (view instanceof ViewGroup) {
                ViewGroup vg = (ViewGroup) view;
                for (int i = 0; i < vg.getChildCount(); i++) {
                    applyGoldenTextStyle(vg.getChildAt(i));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "applyGoldenTextStyle error", e);
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
    // البند D: الشريط الجانبي الأيمن (rightScrollView)
    // مطابقة للسورس الأصلي: layout_gravity="end|bottom|center" (يمين الشاشة)
    // فقط الرسائل والموسيقى بـ VISIBLE — البانرات تبقى كما هي (فارغة/gone)
    // ============================================
    private void setupSidebar() {
        try {
            // rightScrollView: VISIBLE (مكانه على اليمين في XML الأصلي)
            int scrollId = getId("rightScrollView");
            if (scrollId != 0) {
                View rightScroll = findViewById(scrollId);
                if (rightScroll != null) {
                    rightScroll.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[D] rightScrollView -> VISIBLE (موضع: end|bottom)");
                }
            }

            // [المرحلة 3 - البند 7] فقط ivMessagesBox + ivRoomMusic بـ VISIBLE
            // البانرات (operations_activity_banner, eventAndGameBannerView, activesBannerView)
            // تبقى فارغة افتراضياً كما في السورس — لا نفعّلها

            // fl_message_box (gone) -> VISIBLE + اظهر ivMessagesBox
            int msgBoxId = getId("fl_message_box");
            if (msgBoxId != 0) {
                View msgBox = findViewById(msgBoxId);
                if (msgBox != null) {
                    msgBox.setVisibility(View.VISIBLE);
                    Log.i(TAG, "[D] fl_message_box -> VISIBLE");
                }
            }
            int ivMessagesId = getId("ivMessagesBox");
            if (ivMessagesId != 0) {
                ImageView ivMessages = findViewById(ivMessagesId);
                if (ivMessages != null) {
                    ivMessages.setVisibility(View.VISIBLE);
                    ivMessages.setOnClickListener(v ->
                        Toast.makeText(this, "💬 الرسائل", Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[D] ivMessagesBox -> VISIBLE + Toast");
                }
            }

            // ivRoomMusic: VISIBLE + Toast
            int ivRoomMusicId = getId("ivRoomMusic");
            if (ivRoomMusicId != 0) {
                ImageView ivRoomMusic = findViewById(ivRoomMusicId);
                if (ivRoomMusic != null) {
                    ivRoomMusic.setVisibility(View.VISIBLE);
                    ivRoomMusic.setOnClickListener(v ->
                        Toast.makeText(this, "🎵 الموسيقى", Toast.LENGTH_SHORT).show());
                    Log.i(TAG, "[D] ivRoomMusic -> VISIBLE + Toast");
                }
            }

            // tv_room_music: VISIBLE (النص "الموسيقى" تحت أيقونة الموسيقى)
            int tvRoomMusicId = getId("tv_room_music");
            if (tvRoomMusicId != 0) {
                TextView tvRoomMusic = findViewById(tvRoomMusicId);
                if (tvRoomMusic != null) {
                    tvRoomMusic.setVisibility(View.VISIBLE);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[D] setupSidebar error", e);
        }
    }

    // ============================================
    // البند D2: محذوف — أزرار الدردشة والموسيقى موجودة أصلاً في rightScrollView
    // ============================================

    // ============================================
    // البند D3: محذوف — Owner pill-tag لم يكن في مكانه الصحيح
    // في Yalla Ludo الأصلي، المالك يُحدد فقط عبر تاج (room_icon_room_top_close_king)
    // على صورة المستخدم في المقعد الأول، ولا توجد pill-tag في الأعلى
    // ============================================

    // ============================================
    // البند E: الشريط السفلي + لوحة الإدخال فوق الكيبورد
    // مطابقة للسورس الأصلي Yalla Ludo بتبديل visibility فقط:
    //  - staticRoomBottomView (يحمل room_include_room_input.xml) — VISIBLE افتراضياً
    //  - roomBottomInputView (يحمل room_bottom_input.xml) — GONE افتراضياً
    //  - عند النقر على etMessage: نبدّل visibility بينهما
    // ============================================
    private void setupBottomBar() {
        try {
            // ===== 1) staticRoomBottomView: VISIBLE + inflate room_include_room_input.xml بداخله =====
            int staticBottomId = getId("staticRoomBottomView");
            View staticRoomBottomView = null;
            if (staticBottomId != 0) {
                staticRoomBottomView = findViewById(staticBottomId);
                if (staticRoomBottomView != null) {
                    staticRoomBottomView.setVisibility(View.VISIBLE);
                    if (staticRoomBottomView instanceof ViewGroup) {
                        ViewGroup container = (ViewGroup) staticRoomBottomView;
                        if (container.getChildCount() == 0) {
                            try {
                                View inputBar = LayoutInflater.from(this)
                                    .inflate(R.layout.room_include_room_input, container, false);
                                container.addView(inputBar);
                                Log.i(TAG, "[E] Inflated room_include_room_input into staticRoomBottomView");
                            } catch (Exception e) {
                                Log.e(TAG, "[E] Failed to inflate room_include_room_input", e);
                            }
                        }
                    }
                }
            }

            // ===== 2) roomBottomInputView: يبقى GONE + inflate room_bottom_input.xml بداخله =====
            // مطابقة للسورس الأصلي: GONE افتراضياً، يظهر فقط عند النقر على etMessage
            int inputViewId = getId("roomBottomInputView");
            View roomBottomInputView = null;
            if (inputViewId != 0) {
                roomBottomInputView = findViewById(inputViewId);
                if (roomBottomInputView != null) {
                    // يبقى GONE كما في XML الأصلي — لا نغيّره هنا
                    if (roomBottomInputView instanceof ViewGroup) {
                        ViewGroup container = (ViewGroup) roomBottomInputView;
                        if (container.getChildCount() == 0) {
                            try {
                                View inputPanel = LayoutInflater.from(this)
                                    .inflate(R.layout.room_bottom_input, container, false);
                                container.addView(inputPanel);
                                Log.i(TAG, "[E] Inflated room_bottom_input into roomBottomInputView (still GONE)");
                            } catch (Exception e) {
                                Log.e(TAG, "[E] Failed to inflate room_bottom_input", e);
                            }
                        }
                    }
                }
            }

            // ===== 3) اربط عناصر الشريط السفلي (من room_include_room_input.xml داخل staticRoomBottomView) =====
            ivSound = findViewById(getId("ivSound"));
            ivMic = findViewById(getId("ivMic"));
            ivMicEmoji = findViewById(getId("ivMicEmoji"));
            ivGift = findViewById(getId("ivGift"));
            ivSendPicture = findViewById(getId("ivSendPicture"));
            ivSend = findViewById(getId("ivSend"));
            ivShowGameCenter = findViewById(getId("ivShowGameCenter"));
            etMessage = findViewById(getId("etMessage"));

            // ===== 4) ivGift: استبدل svga (غير مدعوم) بـ gift_default.webp من السورس =====
            // الأبعاد والموضع من XML الأصلي (45dp + marginBottom 3dp + marginStart/End 8dp)
            try {
                if (ivGift != null) {
                    int giftResId = getResources().getIdentifier("gift_default", "drawable", getPackageName());
                    if (giftResId != 0) {
                        ivGift.setImageResource(giftResId);
                        ivGift.setVisibility(View.VISIBLE);
                        Log.i(TAG, "[E] ivGift = gift_default.webp");
                    } else {
                        ivGift.setVisibility(View.VISIBLE);
                        Log.w(TAG, "[E] gift_default not found");
                    }
                }
            } catch (Exception giftEx) {
                Log.e(TAG, "[E] ivGift setup error", giftEx);
            }

            // ===== 5) etMessage: معطّل (enabled=false + focusable=false كما في XML الأصلي) =====
            // النقر عليه يبدّل visibility بين staticRoomBottomView و roomBottomInputView
            try {
                if (etMessage != null) {
                    etMessage.setEnabled(false);
                    etMessage.setFocusable(false);
                    etMessage.setFocusableInTouchMode(false);
                    etMessage.setClickable(true);
                    etMessage.setLongClickable(false);
                    etMessage.setCursorVisible(false);
                    // hint يأتي من XML الأصلي (@string/room_say_something) — لا نغيّره
                    // النقر على etMessage يبدّل الشريط السفلي
                    etMessage.setOnClickListener(v -> {
                        try {
                            switchToInputPanel();
                        } catch (Exception e) {
                            Log.e(TAG, "[E] etMessage click error", e);
                        }
                    });
                    Log.i(TAG, "[E] etMessage disabled (switches to input panel on click)");
                }
            } catch (Exception etEx) {
                Log.e(TAG, "[E] etMessage setup error", etEx);
            }

            // ===== 6) حالة افتراضية للشريط السفلي (مطابقة للصورة 23: يدخل الروم) =====
            // VISIBLE:  ivSound, ivGift, ivShowGameCenter, etMessage (hint)
            // GONE:      ivMic, ivMicEmoji, ivSendPicture, ivSend, ivEmoji
            try {
                if (ivSound != null) ivSound.setVisibility(View.VISIBLE);
                if (ivGift != null) ivGift.setVisibility(View.VISIBLE);
                if (ivShowGameCenter != null) ivShowGameCenter.setVisibility(View.VISIBLE);
                if (ivMic != null) ivMic.setVisibility(View.GONE);
                if (ivMicEmoji != null) ivMicEmoji.setVisibility(View.GONE);
                if (ivSendPicture != null) ivSendPicture.setVisibility(View.GONE);
                if (ivSend != null) ivSend.setVisibility(View.GONE);
                int emojiId = getId("ivEmoji");
                if (emojiId != 0) {
                    ImageView ivEmoji = findViewById(emojiId);
                    if (ivEmoji != null) ivEmoji.setVisibility(View.GONE);
                }
                Log.i(TAG, "[E] Default state: ivSound+ivGift+ivShowGameCenter VISIBLE; ivMic+ivMicEmoji+ivSendPicture+ivSend+ivEmoji GONE");
            } catch (Exception visEx) {
                Log.e(TAG, "[E] default state error", visEx);
            }

            // ===== 7) اربط عناصر لوحة الإدخال (من room_bottom_input.xml داخل roomBottomInputView) =====
            // etInputMessage له نفس اسم XML الأصلي لكنه معرّف برمجياً لأنه قد لا يكون في findViewById
            // مباشرة إذا لم يتم نفخه بعد — لكننا نفخناه في الخطوة 2
            try {
                etInputMessage = findViewById(getId("etInputMessage"));
                ImageView inputEmojiBtn = (ImageView) findViewById(getId("ivEmoji"));
                ImageView inputPicBtn = (ImageView) findViewById(getId("ivSendPicture"));
                ImageView inputSendBtn = (ImageView) findViewById(getId("ivSend"));
                // ملاحظة: ids في room_bottom_input.xml هي نفسها في room_include_room_input.xml
                // لكن الـ findViewById قد يرجع الأول فقط — سنبحث في roomBottomInputView بدلاً من ذلك
                if (roomBottomInputView instanceof ViewGroup) {
                    ViewGroup inputPanel = (ViewGroup) roomBottomInputView;
                    if (inputPanel.getChildCount() > 0) {
                        View firstChild = inputPanel.getChildAt(0);
                        if (firstChild instanceof ViewGroup) {
                            // ابحث داخل اللوحة السفلية (llRoomBottom)
                            searchInputPanelElements((ViewGroup) firstChild);
                        }
                    }
                }

                // اربط etInputMessage (إن وجد في roomBottomInputView) بـ listeners
                if (etInputMessage != null) {
                    // انسخ roomBottomInputView إلى final متغير محلي للاستخدام داخل TextWatcher
                    final View finalRoomBottomInputView = roomBottomInputView;
                    // TextWatcher على etInputMessage: بدّل ivSendPicture ↔ ivSend حسب فراغ الحقل
                    etInputMessage.addTextChangedListener(new android.text.TextWatcher() {
                        @Override
                        public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
                        @Override
                        public void onTextChanged(CharSequence s, int start, int before, int count) {}
                        @Override
                        public void afterTextChanged(android.text.Editable s) {
                            try {
                                boolean hasText = s != null && s.toString().trim().length() > 0;
                                if (finalRoomBottomInputView instanceof ViewGroup) {
                                    ImageView pic = (ImageView) ((ViewGroup) finalRoomBottomInputView)
                                        .findViewById(getId("ivSendPicture"));
                                    ImageView send = (ImageView) ((ViewGroup) finalRoomBottomInputView)
                                        .findViewById(getId("ivSend"));
                                    if (pic != null) pic.setVisibility(hasText ? View.GONE : View.VISIBLE);
                                    if (send != null) send.setVisibility(hasText ? View.VISIBLE : View.GONE);
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "[E] TextWatcher error", e);
                            }
                        }
                    });
                    Log.i(TAG, "[E] etInputMessage bound + TextWatcher set");
                }
            } catch (Exception inputEx) {
                Log.e(TAG, "[E] input panel elements bind error", inputEx);
            }

            // ===== 8) WindowInsets للـ edge-to-edge + padding شريط النظام =====
            View contentView = findViewById(android.R.id.content);
            if (contentView != null) {
                ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                    int bottomInset = insets.getInsets(WindowInsetsCompat.Type.systemBars()).bottom;
                    v.setPadding(0, 0, 0, bottomInset);
                    return insets;
                });
            }

            Log.i(TAG, "[E] Bottom bar IDs: ivSound=" + (ivSound != null)
                + " ivMic=" + (ivMic != null)
                + " ivGift=" + (ivGift != null)
                + " etMessage=" + (etMessage != null)
                + " etInputMessage=" + (etInputMessage != null));
        } catch (Exception e) {
            Log.e(TAG, "[E] setupBottomBar error", e);
        }
    }

    /** يبحث عن etInputMessage وأزرار الإدخال داخل لوحة room_bottom_input */
    private void searchInputPanelElements(ViewGroup root) {
        try {
            for (int i = 0; i < root.getChildCount(); i++) {
                View child = root.getChildAt(i);
                if (child instanceof EditText) {
                    int childId = child.getId();
                    int targetId = getId("etInputMessage");
                    if (targetId != 0 && childId == targetId) {
                        etInputMessage = (EditText) child;
                    }
                }
                if (child instanceof ViewGroup) {
                    searchInputPanelElements((ViewGroup) child);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[E] searchInputPanelElements error", e);
        }
    }

    /** يبدّل الشريط السفلي إلى لوحة الإدخال (طريقة السورس الأصلية بتبديل visibility) */
    private void switchToInputPanel() {
        try {
            int staticBottomId = getId("staticRoomBottomView");
            int inputViewId = getId("roomBottomInputView");
            View staticRoomBottomView = findViewById(staticBottomId);
            View roomBottomInputView = findViewById(inputViewId);

            // أخفِ الشريط السفلي الأصلي
            if (staticRoomBottomView != null) {
                staticRoomBottomView.setVisibility(View.GONE);
                Log.i(TAG, "[InputSwitch] staticRoomBottomView -> GONE");
            }
            // أظهر لوحة الإدخال
            if (roomBottomInputView != null) {
                roomBottomInputView.setVisibility(View.VISIBLE);
                Log.i(TAG, "[InputSwitch] roomBottomInputView -> VISIBLE");
            }
            // ابحث عن etInputMessage داخل لوحة الإدخال وركّز عليه لفتح الكيبورد
            // etInputMessage مع focusable=true + enabled=true في XML الأصلي → يفتح الكيبورد تلقائياً
            if (etInputMessage == null && roomBottomInputView instanceof ViewGroup) {
                searchInputPanelElements((ViewGroup) roomBottomInputView);
            }
            if (etInputMessage != null) {
                // requestFocus داخل post() لضمان تركيز الحقل بعد ظهور اللوحة
                etInputMessage.post(() -> {
                    try {
                        etInputMessage.requestFocus();
                        etInputMessage.setSelection(etInputMessage.getText() != null
                            ? etInputMessage.getText().length() : 0);
                        android.view.inputmethod.InputMethodManager imm =
                            (android.view.inputmethod.InputMethodManager)
                                getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
                        if (imm != null) {
                            imm.showSoftInput(etInputMessage,
                                android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
                        }
                        Log.i(TAG, "[InputSwitch] etInputMessage focused via post()");
                    } catch (Exception e) {
                        Log.e(TAG, "[InputSwitch] focus error", e);
                    }
                });
            }

            // اربط ivSend داخل لوحة الإدخال (إرسال + عودة للشريط الأصلي)
            if (roomBottomInputView instanceof ViewGroup) {
                ImageView sendBtn = (ImageView) ((ViewGroup) roomBottomInputView)
                    .findViewById(getId("ivSend"));
                if (sendBtn != null) {
                    sendBtn.setOnClickListener(v -> {
                        try {
                            if (etInputMessage != null) {
                                String text = etInputMessage.getText() != null
                                    ? etInputMessage.getText().toString().trim() : "";
                                if (!text.isEmpty()) {
                                    addChatMessage(new ChatMessage(
                                        ChatMessage.TYPE_TEXT,
                                        new RoomUser("me", currentUserName, 0, 1, "member"),
                                        text, null));
                                    etInputMessage.setText("");
                                    switchBackToStaticBottom();
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[InputSwitch] send error", e);
                        }
                    });
                }
                // ivEmoji + ivSendPicture داخل اللوحة
                ImageView emojiBtn = (ImageView) ((ViewGroup) roomBottomInputView)
                    .findViewById(getId("ivEmoji"));
                if (emojiBtn != null) {
                    emojiBtn.setOnClickListener(v ->
                        Toast.makeText(this, "😊 الإيموجي", Toast.LENGTH_SHORT).show());
                }
                ImageView picBtn = (ImageView) ((ViewGroup) roomBottomInputView)
                    .findViewById(getId("ivSendPicture"));
                if (picBtn != null) {
                    picBtn.setOnClickListener(v ->
                        Toast.makeText(this, "📷 صورة", Toast.LENGTH_SHORT).show());
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "[InputSwitch] switchToInputPanel error", e);
        }
    }

    /** يعيد الشريط السفلي الأصلي (طريقة السورس الأصلية بتبديل visibility) */
    private void switchBackToStaticBottom() {
        try {
            int staticBottomId = getId("staticRoomBottomView");
            int inputViewId = getId("roomBottomInputView");
            View staticRoomBottomView = findViewById(staticBottomId);
            View roomBottomInputView = findViewById(inputViewId);

            // أخفِ الكيبورد
            if (etInputMessage != null) {
                android.view.inputmethod.InputMethodManager imm =
                    (android.view.inputmethod.InputMethodManager)
                        getSystemService(android.content.Context.INPUT_METHOD_SERVICE);
                if (imm != null) {
                    imm.hideSoftInputFromWindow(etInputMessage.getWindowToken(), 0);
                }
                etInputMessage.clearFocus();
            }
            // أخفِ لوحة الإدخال
            if (roomBottomInputView != null) {
                roomBottomInputView.setVisibility(View.GONE);
                Log.i(TAG, "[InputSwitch] roomBottomInputView -> GONE");
            }
            // أظهر الشريط السفلي الأصلي
            if (staticRoomBottomView != null) {
                staticRoomBottomView.setVisibility(View.VISIBLE);
                Log.i(TAG, "[InputSwitch] staticRoomBottomView -> VISIBLE");
            }
        } catch (Exception e) {
            Log.e(TAG, "[InputSwitch] switchBackToStaticBottom error", e);
        }
    }

    // ============================================
    // [محذوف] openInputOverlay / closeInputOverlay / focusInputMessage — استبدلت بـ
    // switchToInputPanel() و switchBackToStaticBottom() (تبديل visibility فقط، مطابقة للسورس)
    // ============================================

    /** يُستدعى عند focus على etMessage: مُهمل */
    private void onInputFocused() {
        // تُستدعى عبر switchToInputPanel الآن — مُهمل
    }

    /** يُستدعى عند فقدان focus من etMessage: مُهمل */
    private void onInputUnfocused() {
        // تُستدعى عبر switchBackToStaticBottom الآن — مُهمل
    }

    // ============================================
    // نافذة مايك إيموجي (popup سفلية بـ 16 إيموجي — مطابقة للصورة 26)
    // ============================================
    private View micEmojiPopupView = null;   // النافذة المنبثقة
    private final String[] MIC_EMOJIS = {
        "\uD83D\uDE04", // 😄 ضحك
        "\uD83D\uDE02", // 😂 قهقهة
        "\uD83D\uDE22", // 😢 بكاء
        "\uD83D\uDE2E", // 😮 مفاجأة
        "\uD83D\uDE21", // 😡 غضب
        "\uD83D\uDE0D", // 😍 حب
        "\uD83D\uDE34", // 😴 نوم
        "\uD83E\uDD14", // 🤔 تفكير
        "\uD83D\uDE0E", // 😎 رائع
        "\uD83D\uDE07", // 😇 ملاك
        "\uD83D\uDE31", // 😱 ذعر
        "\uD83D\uDE41", // 🙁 حزن
        "\uD83E\uDD29", // 🤩 مبهور
        "\uD83E\uDD73", // 🥳 احتفال
        "\uD83D\uDE36", // 😶 صامت
        "\uD83E\uDD92"  // 🤒 مريض
    };
    private final String[] MIC_EMOJI_NAMES = {
        "ضحك", "قهقهة", "بكاء", "مفاجأة", "غضب", "حب", "نوم", "تفكير",
        "رائع", "ملاك", "ذعر", "حزن", "انبهار", "احتفال", "صمت", "مرض"
    };

    private void showMicEmojiPopup() {
        try {
            // إذا كانت النافذة مفتوحة، أغلقها
            if (micEmojiPopupView != null && micEmojiPopupView.isShown()) {
                dismissMicEmojiPopup();
                return;
            }

            int rootId = getId("content_view");
            ViewGroup rootView = (ViewGroup) findViewById(rootId);
            if (rootView == null) {
                Log.w(TAG, "[MicPopup] content_view not found");
                return;
            }

            int dp = (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, 1, getResources().getDisplayMetrics());
            int screenHeight = getResources().getDisplayMetrics().heightPixels;

            // الحاوية الرئيسية: FrameLayout بشاشة كاملة لالتقاط النقرات الخارجية
            FrameLayout overlay = new FrameLayout(this);
            overlay.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

            // اللوحة السفلية: LinearLayout عمودي
            LinearLayout sheet = new LinearLayout(this);
            sheet.setOrientation(LinearLayout.VERTICAL);
            int sheetHeight = (int) (screenHeight * 0.45);
            FrameLayout.LayoutParams sheetLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, sheetHeight);
            sheetLp.gravity = Gravity.BOTTOM;
            sheet.setLayoutParams(sheetLp);

            // خلفية: استخدم room_shape_mic_emoji_sheet_bg إن وُجدت، وإلا فـ GradientDrawable
            try {
                int bgResId = getResources().getIdentifier(
                    "room_shape_mic_emoji_sheet_bg", "drawable", getPackageName());
                if (bgResId != 0) {
                    sheet.setBackgroundResource(bgResId);
                } else {
                    GradientDrawable sheetBg = new GradientDrawable();
                    sheetBg.setShape(GradientDrawable.RECTANGLE);
                    sheetBg.setCornerRadii(new float[]{
                        13 * dp, 13 * dp, 13 * dp, 13 * dp, 0, 0, 0, 0
                    });
                    sheetBg.setColor(0xFF0F1D23); // رمادي غامق مزرق
                    sheet.setBackground(sheetBg);
                }
            } catch (Exception bgEx) {
                Log.e(TAG, "[MicPopup] sheet bg error", bgEx);
            }
            sheet.setPadding(8 * dp, 4 * dp, 8 * dp, 16 * dp);

            // 1) drag bar أعلى المنتصف (مطابقة للصورة 26)
            View dragBar = new View(this);
            LinearLayout.LayoutParams dragLp = new LinearLayout.LayoutParams(
                40 * dp, 4 * dp);
            dragLp.gravity = Gravity.CENTER_HORIZONTAL;
            dragLp.setMargins(0, 4 * dp, 0, 8 * dp);
            dragBar.setLayoutParams(dragLp);
            GradientDrawable dragBg = new GradientDrawable();
            dragBg.setShape(GradientDrawable.RECTANGLE);
            dragBg.setCornerRadius(2 * dp);
            dragBg.setColor(0x80FFFFFF); // أبيض شفاف
            dragBar.setBackground(dragBg);
            sheet.addView(dragBar);

            // 2) عنوان صغير
            TextView title = new TextView(this);
            title.setText("مايك إيموجي");
            title.setTextColor(Color.WHITE);
            title.setTextSize(14);
            title.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
            titleLp.setMargins(0, 4 * dp, 0, 8 * dp);
            title.setLayoutParams(titleLp);
            sheet.addView(title);

            // 3) شبكة 4 أعمدة × 4 صفوف = 16 إيموجي
            // استخدم GridView بسيط أو LinearLayout عمودي بداخله LinearLayout أفقي
            LinearLayout grid = new LinearLayout(this);
            grid.setOrientation(LinearLayout.VERTICAL);
            grid.setLayoutParams(new LinearLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT));

            for (int row = 0; row < 4; row++) {
                LinearLayout rowView = new LinearLayout(this);
                rowView.setOrientation(LinearLayout.HORIZONTAL);
                rowView.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams rowLp = new LinearLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                rowLp.setMargins(0, 4 * dp, 0, 4 * dp);
                rowView.setLayoutParams(rowLp);

                for (int col = 0; col < 4; col++) {
                    final int idx = row * 4 + col;
                    LinearLayout cell = new LinearLayout(this);
                    cell.setOrientation(LinearLayout.VERTICAL);
                    cell.setGravity(Gravity.CENTER);
                    LinearLayout.LayoutParams cellLp = new LinearLayout.LayoutParams(
                        0, FrameLayout.LayoutParams.WRAP_CONTENT, 1f);
                    cell.setLayoutParams(cellLp);

                    // دائرة صفراء بحجم 50dp
                    FrameLayout emojiFrame = new FrameLayout(this);
                    int emojiSize = 50 * dp;
                    LinearLayout.LayoutParams emojiLp = new LinearLayout.LayoutParams(
                        emojiSize, emojiSize);
                    emojiFrame.setLayoutParams(emojiLp);
                    GradientDrawable frameBg = new GradientDrawable();
                    frameBg.setShape(GradientDrawable.OVAL);
                    frameBg.setColor(0xFFFFD54F); // أصفر
                    emojiFrame.setBackground(frameBg);

                    TextView emojiTv = new TextView(this);
                    emojiTv.setText(MIC_EMOJIS[idx]);
                    emojiTv.setTextSize(28);
                    emojiTv.setGravity(Gravity.CENTER);
                    FrameLayout.LayoutParams etLp = new FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
                    etLp.gravity = Gravity.CENTER;
                    emojiTv.setLayoutParams(etLp);
                    emojiFrame.addView(emojiTv);

                    cell.addView(emojiFrame);

                    TextView nameTv = new TextView(this);
                    nameTv.setText(MIC_EMOJI_NAMES[idx]);
                    nameTv.setTextColor(0xFFCCCCCC);
                    nameTv.setTextSize(10);
                    nameTv.setGravity(Gravity.CENTER);
                    LinearLayout.LayoutParams nameLp = new LinearLayout.LayoutParams(
                        FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT);
                    nameLp.setMargins(0, 4 * dp, 0, 0);
                    nameTv.setLayoutParams(nameLp);
                    cell.addView(nameTv);

                    cell.setOnClickListener(v -> {
                        try {
                            onMicEmojiSelected(idx);
                            dismissMicEmojiPopup();
                        } catch (Exception e) {
                            Log.e(TAG, "[MicPopup] cell click error", e);
                        }
                    });

                    rowView.addView(cell);
                }
                grid.addView(rowView);
            }
            sheet.addView(grid);

            // أضف اللوحة إلى الـ overlay
            overlay.addView(sheet);

            // النقر خارج اللوحة يغلقها
            overlay.setOnClickListener(v -> dismissMicEmojiPopup());

            // أضف overlay إلى content_view
            rootView.addView(overlay);
            micEmojiPopupView = overlay;
            Log.i(TAG, "[MicPopup] shown, " + MIC_EMOJIS.length + " emojis");

            // أنميشن بسيط: slide up من الأسفل
            try {
                sheet.setTranslationY(sheetHeight);
                sheet.animate().translationY(0).setDuration(200).start();
            } catch (Exception animEx) {
                Log.e(TAG, "[MicPopup] anim error", animEx);
            }
        } catch (Exception e) {
            Log.e(TAG, "[MicPopup] show error", e);
        }
    }

    /** يُستدعى عند اختيار إيموجي: اعرضه على مقعد المستخدم */
    private void onMicEmojiSelected(int emojiIdx) {
        try {
            Toast.makeText(this,
                "🎭 تم اختيار: " + MIC_EMOJI_NAMES[emojiIdx],
                Toast.LENGTH_SHORT).show();

            if (mySeatIndex == -1) {
                Log.w(TAG, "[MicPopup] not on a mic, can't show emoji");
                return;
            }

            // ابحث عن المقعد الحالي في القائمة
            if (micAdapter != null && mySeatIndex >= 0 && mySeatIndex < micSeats.size()) {
                MicSeat seat = micSeats.get(mySeatIndex);
                if (seat.user == null) {
                    seat.user = new RoomUser("me", currentUserName, 0, 1, "member");
                }
                // خزّن الإيموجي على المقعد
                seat.micEmoji = MIC_EMOJIS[emojiIdx];
                seat.micEmojiName = MIC_EMOJI_NAMES[emojiIdx];
                micAdapter.notifyItemChanged(mySeatIndex);
                Log.i(TAG, "[MicPopup] emoji " + MIC_EMOJI_NAMES[emojiIdx] + " applied to seat " + (mySeatIndex + 1));
            }

            // أضف رسالة نظام
            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                currentUserName + " اختار إيموجي: " + MIC_EMOJI_NAMES[emojiIdx], null));

            // محاكاة: إخفاء الإيموجي بعد 5 ثوان
            handler.postDelayed(() -> {
                try {
                    if (mySeatIndex >= 0 && mySeatIndex < micSeats.size()) {
                        MicSeat s = micSeats.get(mySeatIndex);
                        if (s.micEmoji != null) {
                            s.micEmoji = null;
                            s.micEmojiName = null;
                            if (micAdapter != null) micAdapter.notifyItemChanged(mySeatIndex);
                            Log.i(TAG, "[MicPopup] emoji cleared after 5s");
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "[MicPopup] clear delay error", e);
                }
            }, 5000);
        } catch (Exception e) {
            Log.e(TAG, "[MicPopup] onMicEmojiSelected error", e);
        }
    }

    /** يغلق نافذة إيموجي المايك */
    private void dismissMicEmojiPopup() {
        try {
            if (micEmojiPopupView == null) return;
            ViewGroup parent = (ViewGroup) micEmojiPopupView.getParent();
            if (parent != null) {
                parent.removeView(micEmojiPopupView);
            }
            micEmojiPopupView = null;
            Log.i(TAG, "[MicPopup] dismissed");
        } catch (Exception e) {
            Log.e(TAG, "[MicPopup] dismiss error", e);
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
                ivMicEmoji.setOnClickListener(v -> {
                    try {
                        Toast.makeText(this, "🎭 مايك إيموجي", Toast.LENGTH_SHORT).show();
                        showMicEmojiPopup();
                    } catch (Exception e) {
                        Log.e(TAG, "[F] ivMicEmoji click error", e);
                    }
                });
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
    // الدردشة — فعّل rvRoomChat برسائل ترحيب + زر "جديد" (llNewMessage)
    // مطابقة للسورس الأصلي:
    //  - rvRoomChat: RecyclerView عمودي
    //  - llNewMessage (room_dialog_new_message_layout.xml): GONE افتراضياً،
    //    يظهر عند وصول رسالة جديدة + المستخدم ليس في أسفل القائمة،
    //    يختفي عند scroll للأسفل أو الضغط عليه
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

            // [المرحلة 3 - البند 8] رسائل ترحيب قليلة (3 رسائل)
            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                "مرحباً بكم في الغرفة! الرجاء احترام بعضكم بعضاً.", null));
            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                "أولاً: عدم التحدث بصوت عالٍ أثناء المباراة.", null));
            addChatMessage(new ChatMessage(
                ChatMessage.TYPE_SYSTEM, null,
                "ثانياً: إغلاق الميكروفون عند عدم التحدث.", null));
            Log.i(TAG, "[Chat] rvRoomChat adapter set + 3 welcome messages");

            // [المرحلة 3 - البند 5] زر "جديد" (llNewMessage)
            setupNewMessageButton();
        } catch (Exception e) {
            Log.e(TAG, "[Chat] setupChat error", e);
        }
    }

    /** يفعّل زر "جديد" (llNewMessage) — مطابقة للسورس الأصلي */
    private void setupNewMessageButton() {
        try {
            int llNewMsgId = getId("llNewMessage");
            int newMsgPopupId = getId("newMessagePopup");
            int ivNewMsgId = getId("ivNewMsg");
            int tvTipScrollId = getId("tvTipScroll");

            View llNewMessage = findViewById(llNewMsgId);
            if (llNewMessage == null) {
                Log.w(TAG, "[NewMsg] llNewMessage not found");
                return;
            }

            // GONE افتراضياً (مطابقة للسورس: يكون مختفياً حتى تأتي رسالة جديدة)
            llNewMessage.setVisibility(View.GONE);

            // النقر على الزر ينتقل لأسفل القائمة + يخفيه
            llNewMessage.setOnClickListener(v -> {
                try {
                    if (rvChat != null && chatAdapter != null) {
                        rvChat.scrollToPosition(chatMessages.size() - 1);
                    }
                    llNewMessage.setVisibility(View.GONE);
                    Log.i(TAG, "[NewMsg] clicked -> scroll to bottom + GONE");
                } catch (Exception e) {
                    Log.e(TAG, "[NewMsg] click error", e);
                }
            });

            // استمع لـ scroll على rvChat لإخفاء الزر عند الوصول للأسفل
            if (rvChat != null) {
                rvChat.addOnScrollListener(new RecyclerView.OnScrollListener() {
                    @Override
                    public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                        try {
                            LinearLayoutManager lm = (LinearLayoutManager) recyclerView.getLayoutManager();
                            if (lm == null) return;
                            int lastVisible = lm.findLastVisibleItemPosition();
                            int total = chatAdapter != null ? chatAdapter.getItemCount() : 0;
                            // إن كان في أسفل القائمة → اخفِ زر "جديد"
                            if (lastVisible >= total - 1) {
                                if (llNewMessage.getVisibility() == View.VISIBLE) {
                                    llNewMessage.setVisibility(View.GONE);
                                    Log.i(TAG, "[NewMsg] at bottom -> GONE");
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "[NewMsg] scroll error", e);
                        }
                    }
                });
            }
            Log.i(TAG, "[NewMsg] llNewMessage setup done (GONE default, scroll listener set)");
        } catch (Exception e) {
            Log.e(TAG, "[NewMsg] setupNewMessageButton error", e);
        }
    }

    private void addChatMessage(ChatMessage msg) {
        chatMessages.add(msg);
        try {
            if (chatAdapter != null) chatAdapter.notifyItemInserted(chatMessages.size() - 1);

            // [المرحلة 3 - البند 5] تحقق إن كان المستخدم في أسفل القائمة
            boolean atBottom = true;
            if (rvChat != null) {
                LinearLayoutManager lm = (LinearLayoutManager) rvChat.getLayoutManager();
                if (lm != null) {
                    int lastVisible = lm.findLastVisibleItemPosition();
                    atBottom = (lastVisible >= chatMessages.size() - 2);
                }
            }
            // لو في الأسفل → scroll للأسفل + أخفِ زر "جديد"
            if (atBottom && rvChat != null) {
                rvChat.scrollToPosition(chatMessages.size() - 1);
                // أخفِ زر "جديد" (إن كان ظاهراً)
                int llNewMsgId = getId("llNewMessage");
                if (llNewMsgId != 0) {
                    View llNewMessage = findViewById(llNewMsgId);
                    if (llNewMessage != null && llNewMessage.getVisibility() == View.VISIBLE) {
                        llNewMessage.setVisibility(View.GONE);
                    }
                }
            } else {
                // المستخدم ليس في الأسفل → اظهر زر "جديد"
                int llNewMsgId = getId("llNewMessage");
                if (llNewMsgId != 0) {
                    View llNewMessage = findViewById(llNewMsgId);
                    if (llNewMessage != null) {
                        llNewMessage.setVisibility(View.VISIBLE);
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "addChatMessage error", e);
        }
    }

    // ============================================
    // سلوك Yalla Ludo: المايك يظهر فقط عند الجلوس
    // مطابقة للصورة 24: ivSound يبقى VISIBLE دائماً، ivMic و ivMicEmoji يظهران عند الجلوس
    // ============================================
    private void updateBottomBarForMicState() {
        try {
            // تحقق أن etMessage ليس مُركّز عليه (إذا كان كذلك، onInputFocused يتحكم)
            boolean etHasFocus = etMessage != null && etMessage.hasFocus();
            if (etHasFocus) {
                Log.i(TAG, "[MicState] etMessage has focus, skip update");
                return;
            }
            // ivSound دائماً VISIBLE (مطابقة للصور 23 و24)
            if (ivSound != null) ivSound.setVisibility(View.VISIBLE);
            if (mySeatIndex == -1) {
                // الحالة A: غير جالس على مايك
                if (ivMic != null) ivMic.setVisibility(View.GONE);
                if (ivMicEmoji != null) ivMicEmoji.setVisibility(View.GONE);
            } else {
                // الحالة B: جالس على مايك — اظهر ivMic + ivMicEmoji
                if (ivMic != null) ivMic.setVisibility(View.VISIBLE);
                if (ivMicEmoji != null) ivMicEmoji.setVisibility(View.VISIBLE);
            }
            Log.i(TAG, "[MicState] updated, mySeatIndex=" + mySeatIndex
                + " ivSound=VISIBLE ivMic=" + (mySeatIndex != -1 ? "VISIBLE" : "GONE"));
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
        // أغلق popup الإيموجي إن كان مفتوحاً
        try {
            if (micEmojiPopupView != null && micEmojiPopupView.isShown()) {
                dismissMicEmojiPopup();
                return;
            }
        } catch (Exception e) {}
        // أغلق لوحة الإدخال إن كانت مفتوحة (طريقة السورس: تبديل visibility)
        try {
            int inputViewId = getId("roomBottomInputView");
            View roomBottomInputView = findViewById(inputViewId);
            if (roomBottomInputView != null && roomBottomInputView.getVisibility() == View.VISIBLE) {
                switchBackToStaticBottom();
                return;
            }
        } catch (Exception e) {}
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
        // مايك إيموجي (مطابقة للصورة 27): يحل محل صورة المستخدم مؤقتاً
        String micEmoji = null;
        String micEmojiName = null;
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
    // MicAdapter — مقاعد برمجية بسيطة
    // ============================================
    class MicAdapter extends RecyclerView.Adapter<MicAdapter.MicViewHolder> {
        private List<MicSeat> seats;

        MicAdapter(List<MicSeat> seats) { this.seats = seats; }

        @NonNull
        @Override
        public MicViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            // استخدم room_mic_item_program.xml (نسخة بأبعاد أصلية)
            View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.room_mic_item_program, parent, false);
            return new MicViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull MicViewHolder holder, int position) {
            try {
                MicSeat seat = seats.get(position);
                holder.bind(seat);
                holder.itemView.setOnClickListener(v -> onSeatClicked(seat));
            } catch (Exception e) {
                Log.e(TAG, "[A] MicAdapter bind error", e);
            }
        }

        @Override
        public int getItemCount() { return seats.size(); }

        class MicViewHolder extends RecyclerView.ViewHolder {
            ImageView headBg;    // خلفية الإطار (room_icon_mic_head_bg)
            ImageView head;     // صورة المستخدم/أيقونة المايك
            ImageView mute;     // طبقة الكتم
            ImageView ownerBadge; // تاج المالك
            TextView name;       // اسم المستخدم

            MicViewHolder(@NonNull View itemView) {
                super(itemView);
                headBg = itemView.findViewById(R.id.mic_head_bg);
                head = itemView.findViewById(R.id.mic_head);
                mute = itemView.findViewById(R.id.mic_mute);
                ownerBadge = itemView.findViewById(R.id.mic_owner_badge);
                name = itemView.findViewById(R.id.mic_name);
            }

            void bind(MicSeat seat) {
                try {
                    // إخفاء الكل افتراضياً
                    mute.setVisibility(View.GONE);
                    ownerBadge.setVisibility(View.GONE);

                    // ===== مايك إيموجي (مطابقة للصورة 27) =====
                    // ابحث عن TextView الإيموجي المُنشأ ديناميكياً (tag="mic_emoji_overlay")
                    final FrameLayout waveContainer = (FrameLayout) itemView.findViewById(R.id.mic_wave);
                    TextView existingEmoji = null;
                    if (waveContainer != null) {
                        View prev = waveContainer.findViewWithTag("mic_emoji_overlay");
                        if (prev instanceof TextView) {
                            existingEmoji = (TextView) prev;
                        }
                    }

                    if (seat.micEmoji != null && seat.user != null) {
                        // اعرض الإيموجي بدلاً من الصورة الرمزية
                        // مطابقة للصورة 27: حجم الإيموجي = حجم دائرة المايك (50dp)
                        // بدون خلفية صفراء — الإيموجي يكون شفافاً فوق دائرة المايك
                        head.setVisibility(View.GONE);
                        if (existingEmoji == null && waveContainer != null) {
                            existingEmoji = new TextView(itemView.getContext());
                            existingEmoji.setTag("mic_emoji_overlay");
                            // حجم 50dp مطابق لدائرة المايك (mic_head)
                            int emojiSizePx = (int) TypedValue.applyDimension(
                                TypedValue.COMPLEX_UNIT_DIP, 50,
                                itemView.getContext().getResources().getDisplayMetrics());
                            FrameLayout.LayoutParams emojiLp = new FrameLayout.LayoutParams(
                                emojiSizePx, emojiSizePx);
                            emojiLp.gravity = Gravity.CENTER;
                            existingEmoji.setLayoutParams(emojiLp);
                            existingEmoji.setGravity(Gravity.CENTER);
                            // حجم النص ليملأ 50dp — تقريباً 36sp
                            existingEmoji.setTextSize(36);
                            // خلفية شفافة (بدون أصفر)
                            existingEmoji.setBackgroundColor(Color.TRANSPARENT);
                            waveContainer.addView(existingEmoji);
                        }
                        if (existingEmoji != null) {
                            existingEmoji.setText(seat.micEmoji);
                            existingEmoji.setVisibility(View.VISIBLE);
                            // أنميشن: scale up + alpha (محاكاة لظهور الإيموجي)
                            try {
                                existingEmoji.setScaleX(0.3f);
                                existingEmoji.setScaleY(0.3f);
                                existingEmoji.setAlpha(0f);
                                existingEmoji.animate()
                                    .scaleX(1f).scaleY(1f).alpha(1f)
                                    .setDuration(300).start();
                            } catch (Exception animEx) {
                                Log.e(TAG, "[A] emoji anim error", animEx);
                            }
                        }
                        // استخدم خلفية دائرة المايك الأصلية (room_icon_mic_head_bg) — بدون أصفر
                        headBg.setBackgroundResource(R.drawable.room_icon_mic_head_bg);
                        // اظهر اسم المستخدم أسفل (يبقى ظاهراً)
                        name.setText(seat.user.name);
                        // اظهر تاج المالك إن لزم
                        if ("owner".equals(seat.user.role)) {
                            ownerBadge.setVisibility(View.VISIBLE);
                        }
                        return;
                    } else {
                        // لا يوجد إيموجي — أخفِ TextView الإيموجي وأعد head
                        head.setVisibility(View.VISIBLE);
                        if (existingEmoji != null) {
                            existingEmoji.setVisibility(View.GONE);
                        }
                    }

                    if (seat.isLocked) {
                        // مقعد مقفل (50dp, src=room_ic_room_mic_lock)
                        head.setImageResource(R.drawable.room_ic_room_mic_lock);
                        name.setText("مقفل");
                    } else if (seat.user != null) {
                        // مقعد مشغول (50dp, src=room_default + دائرة)
                        head.setImageResource(R.drawable.room_default);
                        // إطار دائري رفيع (مثل RoundImageView isCircle=true)
                        GradientDrawable circle = new GradientDrawable();
                        circle.setShape(GradientDrawable.OVAL);
                        circle.setColor(0xFF0D8A7A);
                        circle.setStroke(2, seat.isSpeaking ? Color.GREEN : Color.WHITE);
                        headBg.setBackground(circle);
                        // اجعل الصورة مقصوصة دائرياً
                        head.setClipToOutline(true);
                        head.setOutlineProvider(new android.view.ViewOutlineProvider() {
                            @Override
                            public void getOutline(View view, android.graphics.Outline outline) {
                                outline.setOval(0, 0, view.getWidth(), view.getHeight());
                            }
                        });
                        
                        // تاج المالك
                        if ("owner".equals(seat.user.role)) {
                            ownerBadge.setVisibility(View.VISIBLE);
                        }
                        // أيقونة الكتم
                        if (seat.isMuted) {
                            mute.setVisibility(View.VISIBLE);
                            mute.setImageResource(R.drawable.room_ic_input_mic_off);
                        }
                        name.setText(seat.user.name);
                    } else {
                        // مقعد فارغ (50dp, src=room_ic_room_mic_free)
                        head.setImageResource(R.drawable.room_ic_room_mic_free);
                        // أعد الخلفية إلى room_icon_mic_head_bg الأصلية
                        headBg.setBackgroundResource(R.drawable.room_icon_mic_head_bg);
                        name.setText(String.valueOf(seat.index + 1));
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
