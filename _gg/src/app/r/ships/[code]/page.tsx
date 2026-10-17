interface PageProps { params: Promise<{ code: string }>; searchParams: Promise<{ from?: string; pkg?: string; direct?: string }>; }

export default async function ShipsDeepLinkPage({ params, searchParams }: PageProps) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toUpperCase();
  const { from, pkg, direct } = await searchParams;
  const packageName = pkg || 'com.bengharbios.ggames';
  const fallbackUrl = `/join/ships/${code}${direct ? '?direct=1' : ''}`;
  const fromParam = from ? `&from=${encodeURIComponent(from)}` : '';
  const intentUrl = `intent://join/ships/${code}?direct=1${fromParam}#Intent;scheme=https;package=${packageName};S.browser_fallback_url=${encodeURIComponent(`https://ggame3.vercel.app${fallbackUrl}`)};end`;
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>انضم لمشاهدة لعبة سفن</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:linear-gradient(180deg,#0a1d18 0%,#04140e 100%);color:#feef91;font-family:system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center}.logo{width:80px;height:80px;margin:0 auto 16px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#4338ca);display:flex;align-items:center;justify-content:center;font-size:40px}.btn{display:inline-block;padding:14px 24px;border-radius:12px;font-size:15px;font-weight:800;text-decoration:none;border:none;cursor:pointer;margin-top:10px}</style></head><body><div class="logo">🚢</div><h1>سفن</h1><p style="color:#9fc4b4;margin:8px 0 24px">كود الغرفة: <span style="font-family:monospace;color:#fff;letter-spacing:3px">${code}</span></p><a href="${intentUrl}" class="btn" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:#fff">فتح في التطبيق</a><a href="${fallbackUrl}" class="btn" style="background:linear-gradient(135deg,#fbbf24,#aa6e1f);color:#000">مشاهدة في المتصفح</a></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
