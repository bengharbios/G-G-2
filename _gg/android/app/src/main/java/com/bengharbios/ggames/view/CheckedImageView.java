package com.bengharbios.ggames.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import androidx.appcompat.widget.AppCompatImageView;

/**
 * CheckedImageView - زر تبديل بصورة (state_checked)
 * بديل لـ com.yalla.ludochat.view.CheckedImageView
 *
 * عند الضغط عليه: يبدّل بين حالتين (مثل toggle emoji panel)
 */
public class CheckedImageView extends AppCompatImageView {

    private boolean checked = false;
    private OnCheckedChangeListener listener;

    public CheckedImageView(Context context) {
        super(context);
        setOnClickListener(v -> toggle());
    }

    public CheckedImageView(Context context, AttributeSet attrs) {
        super(context, attrs);
        setOnClickListener(v -> toggle());
    }

    public CheckedImageView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        setOnClickListener(v -> toggle());
    }

    public void toggle() {
        setChecked(!checked);
    }

    public boolean isChecked() {
        return checked;
    }

    public void setChecked(boolean checked) {
        if (this.checked != checked) {
            this.checked = checked;
            refreshDrawableState();
            if (listener != null) {
                listener.onCheckedChanged(this, checked);
            }
        }
    }

    @Override
    public int[] onCreateDrawableState(int extraSpace) {
        int[] state = super.onCreateDrawableState(extraSpace + 1);
        if (checked) {
            mergeDrawableStates(state, new int[]{android.R.attr.state_checked});
        }
        return state;
    }

    public interface OnCheckedChangeListener {
        void onCheckedChanged(CheckedImageView view, boolean isChecked);
    }

    public void setOnCheckedChangeListener(OnCheckedChangeListener listener) {
        this.listener = listener;
    }
}
