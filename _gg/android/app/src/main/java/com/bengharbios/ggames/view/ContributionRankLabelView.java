package com.bengharbios.ggames.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.util.AttributeSet;
import androidx.appcompat.widget.AppCompatImageView;

/**
 * ContributionRankLabelView - شارة المساهمة (مرتبة المستخدم في الغرفة)
 * بديل لـ com.yalla.ludochat.view.ContributionRankLabelView
 */
public class ContributionRankLabelView extends AppCompatImageView {

    private int rank = 0;
    private Paint bgPaint;
    private Paint textPaint;

    public ContributionRankLabelView(Context context) {
        super(context);
        init();
    }

    public ContributionRankLabelView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ContributionRankLabelView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        textPaint.setColor(0xFFFFFFFF);
        textPaint.setTextSize(20f);
        textPaint.setTextAlign(Paint.Align.CENTER);
    }

    public void setRank(int rank) {
        this.rank = rank;
        invalidate();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        int w = getWidth();
        int h = getHeight();
        if (w <= 0 || h <= 0) return;

        // خلفية متدرجة حسب المرتبة
        if (rank == 1) bgPaint.setColor(0xFFFFD700); // ذهبي
        else if (rank == 2) bgPaint.setColor(0xFFC0C0C0); // فضي
        else if (rank == 3) bgPaint.setColor(0xFFCD7F32); // برونزي
        else bgPaint.setColor(0xFF8B5CF6); // بنفسجي

        RectF rect = new RectF(0, 0, w, h);
        canvas.drawRoundRect(rect, h / 2f, h / 2f, bgPaint);

        Paint.FontMetrics fm = textPaint.getFontMetrics();
        float textY = h / 2f - (fm.ascent + fm.descent) / 2;
        canvas.drawText(String.valueOf(rank), w / 2f, textY, textPaint);
    }
}
