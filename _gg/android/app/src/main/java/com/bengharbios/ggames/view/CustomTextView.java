package com.bengharbios.ggames.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.text.TextPaint;
import android.util.AttributeSet;
import androidx.appcompat.widget.AppCompatTextView;

/**
 * CustomTextView - نص مع دعم الظل وتأثيرات إضافية
 * بديل لـ com.yalla.games.common.view.CustomTextView
 */
public class CustomTextView extends AppCompatTextView {

    private int strokeColor = Color.TRANSPARENT;
    private float strokeWidth = 0f;
    private boolean drawShadow = false;
    private Paint strokePaint;

    public CustomTextView(Context context) {
        super(context);
        init();
    }

    public CustomTextView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public CustomTextView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        strokePaint.setStyle(Paint.Style.STROKE);
        setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null);
    }

    public void setStrokeColor(int color) {
        this.strokeColor = color;
        invalidate();
    }

    public void setStrokeWidth(float width) {
        this.strokeWidth = width;
        strokePaint.setStrokeWidth(width);
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        // رسم الظل أولاً
        if (drawShadow) {
            TextPaint paint = getPaint();
            paint.setShadowLayer(2f, 1f, 1f, Color.BLACK);
        }

        // رسم الحدود الخارجية (stroke)
        if (strokeWidth > 0 && strokeColor != Color.TRANSPARENT) {
            strokePaint.setColor(strokeColor);
            strokePaint.setTextSize(getTextSize());
            strokePaint.setTypeface(getTypeface());
            strokePaint.setFlags(getPaintFlags());
            String text = getText().toString();
            Rect bounds = new Rect();
            strokePaint.getTextBounds(text, 0, text.length(), bounds);
            int x = (getWidth() - bounds.width()) / 2 - bounds.left;
            int y = (getHeight() + bounds.height()) / 2 - bounds.bottom;
            canvas.drawText(text, x, y, strokePaint);
        }

        super.onDraw(canvas);
    }
}
