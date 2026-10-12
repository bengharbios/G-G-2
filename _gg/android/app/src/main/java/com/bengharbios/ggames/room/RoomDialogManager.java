package com.bengharbios.ggames.room;

import android.app.Activity;
import android.app.Dialog;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.bengharbios.ggames.R;
import com.bengharbios.ggames.view.CustomTextView;

import java.util.Random;

/**
 * RoomDialogManager - يدير كل الحواريات والألعاب داخل الغرفة
 *
 * يدعم:
 *  ✓ حوارية معلومات المستخدم (room_dialog_user_info)
 *  ✓ حوارية انضم للمايك (room_dialog_room_take_mic)
 *  ✓ حوارية الخروج (room_dialog_room_quit)
 *  ✓ حوارية الإعلان (room_dialog_announcement)
 *  ✓ لعبة الرقم الحظ (room_dialog_lucky_number)
 */
public class RoomDialogManager {

    private final Activity activity;
    private final RoomActivity.RoomUser currentUser;
    private Dialog currentDialog;
    private Handler handler = new Handler(Looper.getMainLooper());

    public RoomDialogManager(Activity activity, RoomActivity.RoomUser currentUser) {
        this.activity = activity;
        this.currentUser = currentUser;
    }

    public interface OnTakeMicListener {
        void onTakeMic();
    }

    public interface OnQuitListener {
        void onQuit();
        void onMinimize();
    }

    // ============================================
    // معلومات المستخدم
    // ============================================
    public void showUserInfo(RoomActivity.RoomUser user, boolean canModerate) {
        dismissCurrent();
        currentDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar);
        currentDialog.setContentView(R.layout.room_dialog_user_info);
        currentDialog.setCancelable(true);
        currentDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        currentDialog.getWindow().setGravity(Gravity.CENTER);
        currentDialog.show();

        // تعبئة البيانات
        ImageView ivAvatar = currentDialog.findViewById(R.id.iv_user_avatar);
        TextView tvName = currentDialog.findViewById(R.id.tv_user_name);
        TextView tvLevel = currentDialog.findViewById(R.id.tv_user_level);
        TextView tvId = currentDialog.findViewById(R.id.tv_user_id);
        TextView tvSignature = currentDialog.findViewById(R.id.tv_user_signature);

        if (ivAvatar != null) ivAvatar.setImageResource(user.avatarResId);
        if (tvName != null) tvName.setText(user.name);
        if (tvLevel != null) tvLevel.setText("Lv." + user.level);
        if (tvId != null) tvId.setText("ID: " + user.id);

        // إظهار أدوات الإدارة
        View llAdmin = currentDialog.findViewById(R.id.ll_admin_actions);
        if (llAdmin != null) {
            llAdmin.setVisibility(canModerate ? View.VISIBLE : View.GONE);
        }

        // زر الإغلاق
        View ivClose = currentDialog.findViewById(R.id.iv_dialog_close);
        if (ivClose != null) {
            ivClose.setOnClickListener(v -> dismissCurrent());
        }
    }

    // ============================================
    // انضم للمايك
    // ============================================
    public void showTakeMic(OnTakeMicListener listener) {
        dismissCurrent();
        currentDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar);
        currentDialog.setContentView(R.layout.room_dialog_room_take_mic);
        currentDialog.setCancelable(true);
        currentDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        currentDialog.getWindow().setGravity(Gravity.CENTER);
        currentDialog.show();

        View btnJoin = currentDialog.findViewById(R.id.btn_take_mic_join);
        View btnCancel = currentDialog.findViewById(R.id.btn_take_mic_cancel);

        if (btnJoin != null) {
            btnJoin.setOnClickListener(v -> {
                if (listener != null) listener.onTakeMic();
                dismissCurrent();
            });
        }
        if (btnCancel != null) {
            btnCancel.setOnClickListener(v -> dismissCurrent());
        }
    }

    // ============================================
    // الخروج
    // ============================================
    public void showQuit(OnQuitListener listener) {
        dismissCurrent();
        currentDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar);
        currentDialog.setContentView(R.layout.room_dialog_room_quit);
        currentDialog.setCancelable(true);
        currentDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        currentDialog.getWindow().setGravity(Gravity.CENTER);
        currentDialog.show();

        View btnQuit = currentDialog.findViewById(R.id.btn_quit_confirm);
        View btnMinimize = currentDialog.findViewById(R.id.btn_quit_minimize);
        View btnCancel = currentDialog.findViewById(R.id.btn_quit_cancel);

        if (btnQuit != null) {
            btnQuit.setOnClickListener(v -> {
                if (listener != null) listener.onQuit();
                dismissCurrent();
            });
        }
        if (btnMinimize != null) {
            btnMinimize.setOnClickListener(v -> {
                if (listener != null) listener.onMinimize();
                dismissCurrent();
            });
        }
        if (btnCancel != null) {
            btnCancel.setOnClickListener(v -> dismissCurrent());
        }
    }

    // ============================================
    // الإعلان
    // ============================================
    public void showAnnouncement(String currentText, OnSaveListener listener) {
        dismissCurrent();
        currentDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar);
        currentDialog.setContentView(R.layout.room_dialog_announcement);
        currentDialog.setCancelable(true);
        currentDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        currentDialog.getWindow().setGravity(Gravity.CENTER);
        currentDialog.show();

        EditText etAnnouncement = currentDialog.findViewById(R.id.et_announcement);
        View btnSave = currentDialog.findViewById(R.id.btn_announcement_save);
        View btnCancel = currentDialog.findViewById(R.id.btn_announcement_cancel);

        if (etAnnouncement != null && currentText != null) {
            etAnnouncement.setText(currentText);
        }
        if (btnSave != null) {
            btnSave.setOnClickListener(v -> {
                if (listener != null && etAnnouncement != null) {
                    listener.onSave(etAnnouncement.getText().toString());
                }
                dismissCurrent();
            });
        }
        if (btnCancel != null) {
            btnCancel.setOnClickListener(v -> dismissCurrent());
        }
    }

    public interface OnSaveListener {
        void onSave(String text);
    }

    // ============================================
    // لعبة الرقم الحظ
    // ============================================
    public void showLuckyNumber() {
        dismissCurrent();
        currentDialog = new Dialog(activity, android.R.style.Theme_Translucent_NoTitleBar);
        currentDialog.setContentView(R.layout.room_dialog_lucky_number);
        currentDialog.setCancelable(true);
        currentDialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        currentDialog.getWindow().setGravity(Gravity.CENTER);
        currentDialog.show();

        TextView tvDisplay = currentDialog.findViewById(R.id.tv_lucky_number_display);
        TextView tvResult = currentDialog.findViewById(R.id.tv_lucky_result);
        View btnSpin = currentDialog.findViewById(R.id.btn_lucky_spin);

        final int[] selectedNumber = {-1};
        final int[] winningNumber = {-1};

        // أزرار الأرقام
        int[] btnIds = {
            R.id.btn_lucky_1, R.id.btn_lucky_2, R.id.btn_lucky_3, R.id.btn_lucky_4, R.id.btn_lucky_5,
            R.id.btn_lucky_6, R.id.btn_lucky_7, R.id.btn_lucky_8, R.id.btn_lucky_9, R.id.btn_lucky_10
        };

        for (int i = 0; i < btnIds.length; i++) {
            View btn = currentDialog.findViewById(btnIds[i]);
            final int num = i + 1;
            if (btn != null) {
                btn.setOnClickListener(v -> {
                    selectedNumber[0] = num;
                    // إعادة تعيين كل الأزرار
                    for (int id : btnIds) {
                        View b = currentDialog.findViewById(id);
                        if (b != null) {
                            b.setBackgroundResource(R.drawable.dialog_action_bg);
                        }
                    }
                    // تمييز المختار
                    btn.setBackgroundResource(R.drawable.dialog_action_confirm);
                    if (tvResult != null) {
                        tvResult.setVisibility(View.INVISIBLE);
                    }
                });
            }
        }

        if (btnSpin != null) {
            btnSpin.setOnClickListener(v -> {
                if (selectedNumber[0] == -1) {
                    Toast.makeText(activity, "اختر رقم أولاً", Toast.LENGTH_SHORT).show();
                    return;
                }
                // محاكاة الدوران
                final Random random = new Random();
                final int[] counter = {0};
                final int finalNum = random.nextInt(10) + 1;

                handler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        if (tvDisplay != null) {
                            tvDisplay.setText(String.valueOf(random.nextInt(10) + 1));
                        }
                        counter[0]++;
                        if (counter[0] < 15) {
                            handler.postDelayed(this, 80);
                        } else {
                            // النتيجة النهائية
                            winningNumber[0] = finalNum;
                            if (tvDisplay != null) {
                                tvDisplay.setText(String.valueOf(finalNum));
                            }
                            boolean win = finalNum == selectedNumber[0];
                            if (tvResult != null) {
                                tvResult.setVisibility(View.VISIBLE);
                                tvResult.setText(win ? "🎉 فزت! +50 💎" : "🙁 حظ أوفر");
                                tvResult.setTextColor(win ? 0xFF4ADE80 : 0xFFFF5252);
                            }
                        }
                    }
                }, 80);
            });
        }
    }

    // ============================================
    // إغلاق
    // ============================================
    public void dismissCurrent() {
        if (currentDialog != null && currentDialog.isShowing()) {
            currentDialog.dismiss();
        }
        currentDialog = null;
    }
}
