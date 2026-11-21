export type NfcTemplate = "ocean" | "midnight" | "rose" | "forest";
export type NfcPageVisual = {
  theme?: NfcTemplate; font_family?: string; accent_color?: string; button_style?: "solid" | "outline";
  logo_url?: string | null; logo_size?: number; logo_position?: "left" | "center" | "right";
  business_name?: string; branch_name?: string; branch_address?: string;
  headline?: string; description?: string;
  whatsapp_url?: string; instagram_url?: string; website_url?: string;
  preview?: boolean;
};

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] || c));
export function renderNfcPageDocument(input: NfcPageVisual) {
  const theme = (["ocean","midnight","rose","forest"].includes(input.theme || "") ? input.theme : "ocean") as NfcTemplate;
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent_color || "") ? input.accent_color! : "#356fe5";
  const font = input.font_family === "Georgia" ? 'Georgia,serif' : input.font_family === "Arial" ? 'Arial,sans-serif' : input.font_family === "DM Sans" ? '"DM Sans",sans-serif' : 'Manrope,sans-serif';
  const logoSize = Math.min(128,Math.max(40,Number(input.logo_size)||72));
  const logoAlign = ["left","center","right"].includes(input.logo_position || "") ? input.logo_position : "center";
  const name = esc(input.business_name || "Bisnis Kami");
  const branch = esc(input.branch_name || "");
  const address = esc(input.branch_address || "");
  const headline = esc(input.headline || "Bagikan pengalaman kamu");
  const description = esc(input.description || "Terima kasih sudah berkunjung. Pengalaman kamu sangat berarti bagi kami.");
  const logo = input.logo_url
    ? '<div class="brand-logo-wrap"><img src="'+esc(input.logo_url)+'" alt="Logo '+name+'" style="width:'+logoSize+'px;height:'+logoSize+'px;object-fit:contain"></div>'
    : '<div class="brand-symbol" aria-hidden="true"><span>✳</span></div>';
  const links = ([["WhatsApp",input.whatsapp_url],["Instagram",input.instagram_url],["Website",input.website_url]] as [string,string|undefined][])
    .filter((x): x is [string,string] => !!x[1] && /^https:\/\//i.test(x[1]))
    .map(([label,url])=>'<a class="social-link" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+label+' <span>↗</span></a>').join("");
  const buttonStyle = input.button_style === "outline" ? "outline" : "solid";
  const themeCss = `
    :root{--accent:${accent};--font:${font}}
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;font-family:var(--font);-webkit-font-smoothing:antialiased}
    body{min-height:100svh;display:grid;place-items:center;padding:clamp(16px,4vw,42px);background:var(--page);color:var(--ink)}
    .experience{position:relative;width:min(100%,470px);overflow:hidden;background:var(--surface);color:var(--ink)}
    .brand-logo-wrap{display:flex;justify-content:${logoAlign};align-items:center;margin-bottom:25px}
    .brand-logo-wrap img{display:block;object-fit:contain}
    .brand-symbol{display:grid;place-items:center;width:58px;height:58px;margin:0 auto 22px;border-radius:19px;background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent);font-size:27px}
    .eyebrow{margin:0 0 12px;font-size:9px;font-weight:850;letter-spacing:2.2px;text-transform:uppercase;color:var(--muted)}
    .business{margin:0;font-size:clamp(25px,6vw,34px);line-height:1.12;letter-spacing:-1px;font-weight:800;overflow-wrap:anywhere}
    .branch{display:inline-flex;margin-top:13px;padding:7px 11px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--muted);font-size:10px;font-weight:700}
    .address{margin:9px 0 0;color:var(--muted);font-size:11px;line-height:1.6}
    .message{margin-top:27px}
    .message h1{margin:0 0 10px;font-size:clamp(23px,5.5vw,30px);line-height:1.17;letter-spacing:-.8px}
    .message p{margin:0;color:var(--muted);font-size:13px;line-height:1.8}
    .review-button{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:54px;margin-top:25px;padding:14px 17px;border:1px solid var(--accent);border-radius:14px;background:var(--accent);color:#fff;font:750 13px var(--font);cursor:pointer;transition:transform .18s,filter .18s}
    .review-button.outline{background:transparent;color:var(--accent)}
    .review-button:active{transform:scale(.99)}
    .google-g{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;color:#4285f4;font-weight:900;font-size:13px}
    .social-links{display:grid;gap:9px;margin-top:10px}
    .social-link{display:flex;justify-content:space-between;align-items:center;padding:13px 15px;border:1px solid var(--line);border-radius:12px;color:var(--ink);text-decoration:none;font-size:12px;font-weight:700}
    .social-link span{color:var(--muted)}
    .status{min-height:17px;margin:10px 0 0;color:var(--muted);font-size:10px;text-align:center}
    .footer{margin-top:25px;padding-top:15px;border-top:1px solid var(--line);color:var(--muted);font-size:9px;letter-spacing:.4px;text-align:center}
    .footer strong{color:var(--ink)}
    .preview-note{margin:0 0 12px;padding:8px 10px;border-radius:8px;background:var(--soft);color:var(--muted);font-size:10px;text-align:center}
    /* 01 / OCEAN — confident, bright and structured */
    .theme-ocean{--page:#eaf0fa;--surface:#fff;--ink:#15243b;--muted:#718096;--line:#e1e8f2;--soft:#f3f6fc;max-width:430px;padding:34px 30px 24px;border:1px solid #dfe7f3;border-radius:26px;box-shadow:0 28px 75px #1d35551c;text-align:center}
    .theme-ocean:before{content:"";position:absolute;inset:0 0 auto;height:7px;background:linear-gradient(90deg,var(--accent),#83b5ff)}
    .theme-ocean .brand-logo-wrap{justify-content:center}
    .theme-ocean .business{font-weight:850}
    .theme-ocean .message{padding-top:22px;border-top:1px solid var(--line)}
    /* 02 / MIDNIGHT — dark, premium, left-aligned */
    .theme-midnight{--page:#080d16;--surface:#111a29;--ink:#f4f6fb;--muted:#9aa9bf;--line:#29364a;--soft:#1a293d;max-width:450px;padding:36px 30px 25px;border:1px solid #2b3a50;border-radius:22px;box-shadow:0 35px 90px #0008;text-align:left}
    .theme-midnight:before{content:"";position:absolute;width:260px;height:260px;right:-120px;top:-130px;border-radius:50%;background:var(--accent);opacity:.18;filter:blur(55px)}
    .theme-midnight .brand-logo-wrap{justify-content:${logoAlign}}
    .theme-midnight .brand-symbol{margin:0 0 24px;background:color-mix(in srgb,var(--accent) 23%,#172338);border:1px solid color-mix(in srgb,var(--accent) 48%,transparent)}
    .theme-midnight .business{font-size:clamp(29px,7vw,39px);letter-spacing:-1.4px}
    .theme-midnight .message{margin-top:36px;padding-top:25px;border-top:1px solid var(--line)}
    .theme-midnight .review-button{border-radius:10px;box-shadow:0 10px 30px color-mix(in srgb,var(--accent) 25%,transparent)}
    .theme-midnight .social-link{background:#172335}
    /* 03 / ROSE — warm editorial / boutique */
    .theme-rose{--page:#f2e9df;--surface:#fffaf4;--ink:#392b2b;--muted:#89766e;--line:#eadbd0;--soft:#f7eee6;max-width:460px;padding:0 0 24px;border:1px solid #eadbd0;border-radius:5px;box-shadow:12px 14px 0 #d8c6b6;text-align:left}
    .theme-rose:before{content:"D / TAP AJA";display:block;padding:20px 28px;border-bottom:1px solid var(--line);color:var(--muted);font-size:9px;font-weight:900;letter-spacing:2px}
    .theme-rose .brand-logo-wrap,.theme-rose .brand-symbol,.theme-rose .eyebrow,.theme-rose .business,.theme-rose .branch,.theme-rose .address,.theme-rose .message,.theme-rose .review-button,.theme-rose .social-links,.theme-rose .status{margin-left:28px;margin-right:28px}
    .theme-rose .brand-logo-wrap{margin-top:28px}
    .theme-rose .brand-symbol{margin-top:28px;margin-bottom:20px;border-radius:50%;width:52px;height:52px}
    .theme-rose .eyebrow{font-size:8px;letter-spacing:2.5px}
    .theme-rose .business{font-family:Georgia,serif;font-size:clamp(30px,7vw,39px);font-weight:500;letter-spacing:-1px;line-height:1.08}
    .theme-rose .message{margin-top:30px;padding-top:24px;border-top:1px solid var(--line)}
    .theme-rose .message h1{font-family:Georgia,serif;font-size:29px;font-weight:500;letter-spacing:-.6px}
    .theme-rose .review-button{width:calc(100% - 56px);border-radius:3px;letter-spacing:.5px;text-transform:uppercase;font-size:10px}
    .theme-rose .social-links{grid-template-columns:1fr 1fr}
    .theme-rose .social-link{padding:12px;border-radius:3px}
    .theme-rose .footer{margin:25px 28px 0}
    /* 04 / FOREST — organic, calm and tactile */
    .theme-forest{--page:#e9eee7;--surface:#f8faf5;--ink:#1e3427;--muted:#718273;--line:#dce5d9;--soft:#edf3eb;max-width:450px;padding:30px;border:1px solid #dbe5d8;border-radius:34px 34px 12px 12px;box-shadow:0 25px 65px #1c3a2717;text-align:center}
    .theme-forest:before{content:"";position:absolute;left:0;top:0;bottom:0;width:7px;background:var(--accent)}
    .theme-forest .brand-symbol{border-radius:50%;width:66px;height:66px}
    .theme-forest .business{font-family:Georgia,serif;font-size:clamp(28px,6vw,36px);font-weight:500;letter-spacing:-.7px}
    .theme-forest .message{margin-top:26px;padding:20px 16px;background:var(--soft);border-radius:18px}
    .theme-forest .message h1{font-size:21px}
    .theme-forest .review-button{border-radius:99px}
    .theme-forest .social-link{border-radius:99px;background:var(--soft);border-color:transparent}
    @media(max-width:390px){body{padding:12px}.experience{padding-left:22px;padding-right:22px}.theme-rose{padding-left:0;padding-right:0}.theme-rose .brand-logo-wrap,.theme-rose .brand-symbol,.theme-rose .eyebrow,.theme-rose .business,.theme-rose .branch,.theme-rose .address,.theme-rose .message,.theme-rose .review-button,.theme-rose .social-links,.theme-rose .status{margin-left:22px;margin-right:22px}.theme-rose .review-button{width:calc(100% - 44px)}}
    @media(prefers-reduced-motion:reduce){.review-button{transition:none}}
  `;
  const cls = "theme-" + theme;
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${theme === "midnight" ? "#080d16" : "#f2f5f8"}"><title>Review ${name} | DiTapAja</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>${themeCss}</style></head><body><main class="experience ${cls}">${input.preview ? '<p class="preview-note">PREVIEW PEMILIK KARTU · Aktivitas tidak dicatat</p>' : ''}${logo}<p class="eyebrow">PENGALAMAN KAMU BERARTI</p><p class="business">${name}</p>${branch ? '<span class="branch">'+branch+'</span>' : ''}${address ? '<p class="address">'+address+'</p>' : ''}<section class="message"><h1>${headline}</h1><p>${description}</p></section><button class="review-button ${buttonStyle}" id="reviewButton" type="button"><span class="google-g">G</span> Berikan Ulasan di Google</button>${links ? '<nav class="social-links">'+links+'</nav>' : ''}<p class="status" id="status" role="status" aria-live="polite"></p><footer class="footer">Powered by <strong>DiTapAja</strong> · Tap. Review. Grow.</footer></main></body></html>`;
}
