package com.bengharbios.ggames;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import java.lang.reflect.Method;

public class MainActivity extends BridgeActivity {

    private AudioFocusRequest audioFocusRequest = null;
    private AudioManager.OnAudioFocusChangeListener audioFocusListener = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        // Set volume control to media stream (not call stream)
        setVolumeControlStream(AudioManager.STREAM_MUSIC);

        // Force speaker mode BEFORE anything else
        audioManager.setMode(AudioManager.MODE_NORMAL);
        audioManager.setSpeakerphoneOn(true);

        // Request audio focus for media playback
        // This prevents Android from routing audio to earpiece during WebRTC
        audioFocusListener = new AudioManager.OnAudioFocusChangeListener() {
            @Override
            public void onAudioFocusChange(int focusChange) {
                if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                    AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                    am.setMode(AudioManager.MODE_NORMAL);
                    am.setSpeakerphoneOn(true);
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(playbackAttributes)
                    .setWillPauseWhenDucked(false)
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener(audioFocusListener)
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(
                    audioFocusListener,
                    AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
    }

    /**
     * Set WebView audio attributes to route through speaker (not earpiece).
     * Uses reflection because setAudioAttributes() was added in API 35,
     * but we target minSdk 24.
     */
    private void setWebViewAudioAttributes(WebView webView) {
        try {
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .setUsage(AudioAttributes.USAGE_MEDIA)  // Speaker output
                    .build();
            Method method = WebView.class.getMethod("setAudioAttributes", AudioAttributes.class);
            method.invoke(webView, attrs);
        } catch (NoSuchMethodException e) {
            // API < 35 — rely on AudioManager.setSpeakerphoneOn() instead
        } catch (Exception e) {
            // Ignore reflection errors
        }
    }

    @Override
    public void onStart() {
        super.onStart();

        // WebView is fully initialized here (after Bridge setup)
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                // Critical: Allow autoplay without user gesture
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

                // Route WebView audio to speaker via reflection
                setWebViewAudioAttributes(webView);
            }
        } catch (Exception e) {
            // WebView not ready yet, will retry in onResume
        }

        // Re-apply speaker mode
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMode(AudioManager.MODE_NORMAL);
        audioManager.setSpeakerphoneOn(true);
    }

    @Override
    public void onResume() {
        super.onResume();

        // Android resets audio routing when app goes to background
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        audioManager.setMode(AudioManager.MODE_NORMAL);
        audioManager.setSpeakerphoneOn(true);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                setWebViewAudioAttributes(webView);
            }
        } catch (Exception e) {
            // Ignore
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.requestAudioFocus(audioFocusRequest);
        }
    }

    @Override
    public void onDestroy() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
        } else if (audioFocusListener != null) {
            audioManager.abandonAudioFocus(audioFocusListener);
        }
        super.onDestroy();
    }
}
