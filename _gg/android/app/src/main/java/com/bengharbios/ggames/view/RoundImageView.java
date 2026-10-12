package com.bengharbios.ggames.view;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.util.AttributeSet;
import androidx.appcompat.widget.AppCompatImageView;

import com.bengharbios.ggames.R;

/**
 * RoundImageView - صورة بزوايا مدورة أو دائرية
 * بديل لـ com.yalla.ludochat.view.RoundImageView
 */
public class RoundImageView extends AppCompatImageView {

    private float cornerRadius = 0f;
    private boolean isCircle = false;
    private Paint paint;
    private Path path;
    private RectF rectF;

    public RoundImageView(Context context) {
        super(context);
        init(null);
    }

    public RoundImageView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(attrs);
    }

    public RoundImageView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(attrs);
    }

    private void init(AttributeSet attrs) {
        paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setFilterBitmap(true);
        path = new Path();
        rectF = new RectF();

        if (attrs != null) {
            TypedArray a = getContext().obtainStyledAttributes(attrs, R.styleable.RoundImageView);
            cornerRadius = a.getDimension(R.styleable.RoundImageView_cornerRadius, 0f);
            isCircle = a.getBoolean(R.styleable.RoundImageView_isCircle, false);
            a.recycle();
        }
        setScaleType(ScaleType.CENTER_CROP);
    }

    public void setCornerRadius(float radius) {
        this.cornerRadius = radius;
        invalidate();
    }

    public void setIsCircle(boolean circle) {
        this.isCircle = circle;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        int w = getWidth();
        int h = getHeight();
        if (w <= 0 || h <= 0) return;

        rectF.set(0, 0, w, h);
        path.reset();

        if (isCircle) {
            float radius = Math.min(w, h) / 2f;
            path.addCircle(w / 2f, h / 2f, radius, Path.Direction.CW);
        } else if (cornerRadius > 0) {
            path.addRoundRect(rectF, cornerRadius, cornerRadius, Path.Direction.CW);
        } else {
            path.addRect(rectF, Path.Direction.CW);
        }

        // قص المنطقة قبل الرسم
        canvas.clipPath(path);
        super.onDraw(canvas);
    }
}
