package com.bengharbios.ggames.view;

import android.content.Context;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Movie;
import android.graphics.drawable.Drawable;
import android.os.SystemClock;
import android.util.AttributeSet;
import android.view.View;

import androidx.appcompat.widget.AppCompatImageView;

import com.bengharbios.ggames.R;

import java.io.InputStream;

/**
 * LudoSVGAView - عرض رسوم متحركة بصيغة SVGA/GIF
 * بديل مبسط لـ com.yalla.games.common.view.svga.LudoSVGAView
 *
 * يدعم:
 * - ملفات GIF (عبر Movie)
 * - صور ثابتة (PNG/WEBP) كبديل
 * - play_on_attach، clearsAfterStop، loopCount
 */
public class LudoSVGAView extends AppCompatImageView {

    private Movie movie;
    private long movieStart = 0;
    private boolean playOnAttach = false;
    private boolean clearsAfterStop = false;
    private int loopCount = 0;
    private int currentLoop = 0;
    private boolean isPlaying = false;

    public LudoSVGAView(Context context) {
        super(context);
    }

    public LudoSVGAView(Context context, AttributeSet attrs) {
        super(context, attrs);
        initAttrs(attrs);
    }

    public LudoSVGAView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        initAttrs(attrs);
    }

    private void initAttrs(AttributeSet attrs) {
        if (attrs == null) return;
        TypedArray a = getContext().obtainStyledAttributes(attrs, R.styleable.LudoSVGAView);
        playOnAttach = a.getBoolean(R.styleable.LudoSVGAView_play_on_attach, false);
        clearsAfterStop = a.getBoolean(R.styleable.LudoSVGAView_clearsAfterStop, false);
        loopCount = a.getInt(R.styleable.LudoSVGAView_loopCount, 0);
        // محاولة تحميل المصدر كـ GIF إذا كان في assets
        int sourceResId = a.getResourceId(R.styleable.LudoSVGAView_source, 0);
        if (sourceResId != 0) {
            loadFromResource(sourceResId);
        }
        a.recycle();
    }

    private void loadFromResource(int resId) {
        try {
            InputStream is = getResources().openRawResource(resId);
            byte[] bytes = new byte[is.available()];
            is.read(bytes);
            is.close();
            movie = Movie.decodeByteArray(bytes, 0, bytes.length);
            if (movie != null && movie.duration() > 0) {
                setLayerType(View.LAYER_TYPE_SOFTWARE, null);
            }
        } catch (Exception e) {
            movie = null;
        }
    }

    public void setSource(String assetName) {
        try {
            InputStream is = getResources().getAssets().open(assetName);
            byte[] bytes = new byte[is.available()];
            is.read(bytes);
            is.close();
            movie = Movie.decodeByteArray(bytes, 0, bytes.length);
            if (movie != null && movie.duration() > 0) {
                setLayerType(View.LAYER_TYPE_SOFTWARE, null);
                invalidate();
            }
        } catch (Exception e) {
            // تجاهل - سيتم استخدام الصورة الثابتة
        }
    }

    public void startAnimation() {
        isPlaying = true;
        invalidate();
    }

    public void stopAnimation() {
        isPlaying = false;
        if (clearsAfterStop) {
            setImageDrawable(null);
        }
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        if (playOnAttach && movie != null) {
            isPlaying = true;
            invalidate();
        }
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        isPlaying = false;
    }

    @Override
    protected void onDraw(Canvas canvas) {
        if (movie != null && movie.duration() > 0 && isPlaying) {
            long now = SystemClock.uptimeMillis();
            if (movieStart == 0) {
                movieStart = now;
            }
            int dur = movie.duration();
            int relTime = (int) ((now - movieStart) % dur);
            movie.setTime(relTime);
            movie.draw(canvas, 0, 0);

            // فحص إكمال الحلقة
            if (relTime >= dur - 50) {
                currentLoop++;
                if (loopCount > 0 && currentLoop >= loopCount) {
                    isPlaying = false;
                    if (clearsAfterStop) {
                        setImageDrawable(null);
                    }
                    invalidate();
                    return;
                }
            }
            invalidate();
        } else {
            // صورة ثابتة
            super.onDraw(canvas);
        }
    }
}
