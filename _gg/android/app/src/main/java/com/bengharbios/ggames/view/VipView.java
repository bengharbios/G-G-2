package com.bengharbios.ggames.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import androidx.appcompat.widget.AppCompatImageView;

/**
 * VipView - شارة VIP صغيرة تظهر فوق الصورة
 * بديل لـ com.yalla.ludochat.view.VipView
 */
public class VipView extends AppCompatImageView {

    private int vipLevel = 0;
    private Paint badgePaint;
    private Paint textPaint;

    public VipView(Context context) {
        super(context);
        init();
    }

    public VipView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public VipView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        badgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        badgePaint.setColor(0xFFFFC107); // ذهبي
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(0xFFFFFFFF);
        textPaint.setTextSize(24f);
        textPaint.setTextAlign(Paint.Align.CENTER);
    }

    public void setVipLevel(int level) {
        this.vipLevel = level;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (vipLevel <= 0) return;

        int w = getWidth();
        int h = getHeight();
        float cx = w / 2f;
        float cy = h / 2f;
        float r = Math.min(cx, cy) - 2f;

        RectF oval = new RectF(cx - r, cy - r, cx + r, cy + r);
        canvas.drawOval(oval, badgePaint);

        Paint.FontMetrics fm = textPaint.getFontMetrics();
        float textY = cy - (fm.ascent + fm.descent) / 2;
        canvas.drawText(String.valueOf(vipLevel), cx, textY, textPaint);
    }
}
