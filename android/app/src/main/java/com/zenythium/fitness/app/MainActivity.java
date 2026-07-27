package com.zenythium.fitness.app;

import android.os.Bundle;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // logcat showed HwForceDarkManager (Huawei's WebView dark-mode
        // heuristic) re-evaluating "isAppInDarkMode" every single frame
        // during swipe animations, alongside GPU aux buffer errors — extra
        // per-frame overhead fighting with this app's own hand-built dark
        // theme (modern-dark.css), which never needs algorithmic redarkening.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(getBridge().getWebView().getSettings(), false);
        }
    }
}
