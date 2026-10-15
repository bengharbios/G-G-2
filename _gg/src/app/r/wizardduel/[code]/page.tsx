// /r/wizardduel/[code]?from=HOST_USER_ID&pkg=com.bengharbios.ggames
//
// Smart deep-link redirect route (mirrors the Tobol deep-link).
//
// When this URL is opened:
// 1) In the G-G Android app (with intent-filter in AndroidManifest):
//    Android intercepts the link automatically (App Links autoVerify)
//    and opens the app's MainActivity. The app's WebView loads
//    /join/wizardduel/[code] which renders the spectator view.
//
// 2) In any other browser (Chrome, Telegram in-app browser, etc.):
//    The page tries to launch the app via an intent:// URL.
//    - If app is installed → Android opens it
//    - If app is NOT installed → falls back to /join/wizardduel/[code]
//      (the spectator view, which works as a web app)
//
// The 'from' query param is the inviter's user ID (for tracking).
// The 'pkg' query param is the Android package name (for intent:// URL).

interface PageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ from?: string; pkg?: string; direct?: string }>;
}

export default async function WizardDuelDeepLinkPage({ params, searchParams }: PageProps) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toUpperCase();
  const { from, pkg, direct } = await searchParams;

  const packageName = pkg || 'com.bengharbios.ggames';
  const fallbackUrl = `/join/wizardduel/${code}${direct ? '?direct=1' : ''}`;
  const fromParam = from ? `&from=${encodeURIComponent(from)}` : '';

  // Build an intent:// URL — when clicked from a browser, Android tries to
  // open the specified package. If the app is installed, it opens the app's
  // MainActivity which loads the /join/wizardduel/[code] route. If not installed,
  // it falls back to the fallback URL (web version of the spectator view).
  const intentUrl = `intent://join/wizardduel/${code}?direct=1${fromParam}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(`https://ggame3.vercel.app${fallbackUrl}`)};end`;

  // HTML page that tries the intent:// URL via JavaScript, and shows
  // a fallback "Open in browser" button if the app is not installed.
  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>انضم لمشاهدة مبارزة السحرة</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: linear-gradient(180deg, #1a0833 0%, #0a0418 100%);
    color: #feef91;
    font-family: 'Cairo', 'Tahoma', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    text-align: center;
  }
  .logo {
    width: 80px; height: 80px;
    margin: 0 auto 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, #a855f7, #6d28d9);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px;
    box-shadow: 0 8px 24px rgba(168,85,247,.4);
  }
  h1 {
    color: #feef91;
    font-size: 22px;
    font-weight: 900;
    margin-bottom: 8px;
    paint-order: stroke fill;
    -webkit-text-stroke: 1px #aa6e1f;
    text-shadow: 0 2px 6px rgba(0,0,0,.7);
  }
  .subtitle {
    color: #c4a3e8;
    font-size: 13px;
    margin-bottom: 24px;
    line-height: 1.5;
  }
  .code-box {
    background: rgba(168,85,247,.08);
    border: 1px solid rgba(168,85,247,.3);
    border-radius: 12px;
    padding: 12px 20px;
    margin-bottom: 24px;
  }
  .code-label { color: #c4a3e8; font-size: 11px; font-weight: 700; }
  .code-value {
    color: #feef91;
    font-family: ui-monospace, monospace;
    font-size: 22px;
    font-weight: 900;
    letter-spacing: 3px;
    margin-top: 4px;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    text-decoration: none;
    border: none;
    transition: transform .15s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary {
    background: linear-gradient(135deg, #a855f7, #6d28d9);
    color: #fff;
    box-shadow: 0 6px 18px rgba(168,85,247,.35);
    margin-bottom: 12px;
  }
  .btn-secondary {
    background: rgba(168,85,247,.1);
    border: 1px solid rgba(168,85,247,.35);
    color: #feef91;
  }
  .btn-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 280px;
  }
  .note {
    color: #6b7280;
    font-size: 10px;
    margin-top: 24px;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="logo">🔮</div>
  <h1>مبارزة السحرة</h1>
  <p class="subtitle">دعاك صديقك لمشاهدة المبارزة — انضم الآن</p>

  <div class="code-box">
    <div class="code-label">كود المشاهدة</div>
    <div class="code-value">${code}</div>
  </div>

  <div class="btn-row">
    <a href="${intentUrl}" class="btn btn-primary">
      <span>📱</span> افتح في تطبيق G-G
    </a>
    <a href="${fallbackUrl}" class="btn btn-secondary">
      <span>🌐</span> مشاهدة في المتصفح
    </a>
  </div>

  <p class="note">
    إن كان تطبيق G-G مثبتاً على هاتفك، اضغط "افتح في تطبيق G-G" للدخول مباشرة.
    وإلا، يمكنك المشاهدة في المتصفح بدون تثبيت.
  </p>

  <script>
    // Try to open the app via intent:// URL automatically.
    // If the app is installed, Android opens it and the user leaves this page.
    // If not installed, Android stays here and the user clicks the secondary button.
    (function() {
      try {
        // Small delay so the page renders before redirect attempt
        setTimeout(function() {
          window.location.href = '${intentUrl}';
        }, 300);
      } catch (e) {
        // Silent — user can click the button manually
      }
    })();
  </script>
</body>
</html>`;

  // The fallback `redirect()` is intentionally NOT used because this route
  // returns an HTML interstitial page that performs its own intent:// launch.
  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}
