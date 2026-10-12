package com.bengharbios.ggames.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import androidx.recyclerview.widget.RecyclerView;

/**
 * FixedRecyclerView - RecyclerView بمقاومة تمرير أفضل
 * بديل لـ com.yalla.ludochat.view.FixedRecyclerView
 */
public class FixedRecyclerView extends RecyclerView {

    public FixedRecyclerView(Context context) {
        super(context);
    }

    public FixedRecyclerView(Context context, AttributeSet attrs) {
        super(context, attrs);
        setNestedScrollingEnabled(false);
        setItemAnimator(null);
    }

    public FixedRecyclerView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        setNestedScrollingEnabled(false);
        setItemAnimator(null);
    }

    @Override
    public void requestLayout() {
        super.requestLayout();
        // تجنب التخطيط المتكرر
    }
}
