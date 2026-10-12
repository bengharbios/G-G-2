package com.bengharbios.ggames.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.View;

import androidx.annotation.Nullable;

/**
 * WaveMicView - يعرض موجات صوتية متحركة حول صورة المايك
 * بديل لـ com.yalla.ludochat.view.WaveMicView
 *
 * يرسم 3 موجات دائرية متفاوتة الأحجام عندما يكون المتحدث نشطاً
 */
public class WaveMicView extends View {

    private Paint wavePaint;
    private float[] phases = {0f, 0.5f, 1f};
    private boolean isSpeaking = false;
    private long lastFrameTime = 0;
    private int waveColor = 0xFF4ADE80; // أخضر

    public WaveMicView(Context context) {
        super(context);
        init();
    }

    public WaveMicView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public WaveMicView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        wavePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        wavePaint.setColor(waveColor);
        wavePaint.setStyle(Paint.Style.STROKE);
        wavePaint.setStrokeWidth(4f);
    }

    public void setSpeaking(boolean speaking) {
        this.isSpeaking = speaking;
        if (speaking) {
            invalidate();
        }
    }

    public void setWaveColor(int color) {
        this.waveColor = color;
        wavePaint.setColor(color);
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (!isSpeaking) return;

        int cx = getWidth() / 2;
        int cy = getHeight() / 2;
        float maxRadius = Math.min(cx, cy);

        long now = System.currentTimeMillis();
        if (lastFrameTime == 0) lastFrameTime = now;
        float dt = (now - lastFrameTime) / 1000f;
        lastFrameTime = now;

        // تحديث الطور
        for (int i = 0; i < phases.length; i++) {
            phases[i] += dt * (0.5f + i * 0.2f);
            if (phases[i] > 1f) phases[i] -= 1f;
        }

        // رسم 3 موجات
        for (int i = 0; i < phases.length; i++) {
            float phase = phases[i];
            float radius = maxRadius * (0.6f + 0.4f * phase);
            int alpha = (int) (255 * (1f - phase));
            wavePaint.setAlpha(alpha);
            canvas.drawCircle(cx, cy, radius, wavePaint);
        }

        // استمرار التحريك
        postInvalidateDelayed(33);
    }
}
