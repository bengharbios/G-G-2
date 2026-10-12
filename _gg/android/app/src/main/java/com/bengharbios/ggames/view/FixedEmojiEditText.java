package com.bengharbios.ggames.view;

import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import androidx.appcompat.widget.AppCompatEditText;

/**
 * FixedEmojiEditText - حقل نصي يدعم الإيموجي
 * بديل لـ com.yalla.ludochat.view.FixedEmojiEditText
 *
 * يعالج مشكلة عرض الإيموجي على بعض الأجهزة
 */
public class FixedEmojiEditText extends AppCompatEditText {

    public FixedEmojiEditText(Context context) {
        super(context);
        init();
    }

    public FixedEmojiEditText(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public FixedEmojiEditText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null);
        addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {}
        });
    }
}
