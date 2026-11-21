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
  const theme = (["ocean", "midnight", "rose", "forest"].includes(input.theme || "") ? input.theme : "ocean") as NfcTemplate;
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent_color || "") ? input.accent_color! : "#356fe5";
  const font = input.font_family === "Georgia" ? 'Georgia,serif' : input.font_family === "Arial" ? 'Arial,sans-serif' : input.font_family === "DM Sans" ? '"DM Sans",sans-serif' : 'Manrope,sans-serif';
  const logoSize = Math.min(128, Math.max(40, Number(input.logo_size) || 72));
  const logoAlign = ["left", "center", "right"].includes(input.logo_position || "") ? input.logo_position : "center";
  const name = esc(input.business_name || "Bisnis Kami");
  const branch = esc(input.branch_name || "");
  const address = esc(input.branch_address || "");
  const headline = esc(input.headline || "Bagikan pengalaman kamu");
  const description = esc(input.description || "Terima kasih sudah berkunjung. Pengalaman kamu sangat berarti bagi kami.");
  const logo = input.logo_url
    ? '<div class="brand-mark"><img src="' + esc(input.logo_url) + '" alt="Logo ' + name + '" style="width:' + logoSize + 'px;height:' + logoSize + 'px"></div>'
    : '<div class="brand-mark brand-mark-fallback" aria-hidden="true">✳</div>';
  const links = ([["WhatsApp", input.whatsapp_url], ["Instagram", input.instagram_url], ["Website", input.website_url]] as [string, string | undefined][])
    .filter((x): x is [string, string] => !!x[1] && /^https:\/\//i.test(x[1]))
    .map(([label, url]) => '<a class="social-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><span>' + label + '</span><b aria-hidden="true">↗</b></a>').join("");
  const branchMarkup = branch ? '<span class="branch">' + branch + '</span>' : "";
  const addressMarkup = address ? '<p class="address">' + address + '</p>' : "";
  const brandMarkup = '<div class="brand-block"><div class="brand-mark-row">' + logo + '</div><div class="brand-copy"><p class="eyebrow">PENGALAMAN KAMU BERARTI</p><h2 class="business">' + name + '</h2>' + branchMarkup + addressMarkup + '</div></div>';
  const messageMarkup = '<section class="message"><p class="message-kicker">CERITAKAN PENGALAMANMU</p><h1>' + headline + '</h1><p class="description">' + description + '</p></section>';
  const actionMarkup = '<div class="actions"><button class="review-button ' + (input.button_style === "outline" ? "outline" : "solid") + '" id="reviewButton" type="button"><span class="google-g">G</span><span>Berikan Ulasan di Google</span><b aria-hidden="true">↗</b></button>' + (links ? '<nav class="social-links" aria-label="Tautan bisnis">' + links + '</nav>' : '') + '</div>';
  const layouts: Record<NfcTemplate, string> = {
    ocean: brandMarkup + messageMarkup + actionMarkup,
    midnight: '<div class="midnight-top"><span class="edition">YOUR EXPERIENCE MATTERS</span><span class="edition-dot"></span></div>' + brandMarkup + messageMarkup + actionMarkup,
    rose: '<div class="rose-masthead"><span>CATATAN PENGALAMAN</span><span>NO. 01</span></div>' + brandMarkup + messageMarkup + actionMarkup,
    forest: '<div class="forest-heading"><span class="forest-leaf">✳</span><span>THANK YOU FOR VISITING</span></div>' + brandMarkup + '<div class="forest-message">' + messageMarkup + '</div>' + actionMarkup
  };
  const css = `
    :root{--accent:${accent};--font:${font}}
    *{box-sizing:border-box}
    html{min-height:100%;background:#edf1f7}
    body{min-height:100vh;margin:0;padding:clamp(20px,5vw,56px) clamp(14px,4vw,38px);display:flex;align-items:center;justify-content:center;background:#edf1f7;color:#172943;font-family:var(--font);-webkit-font-smoothing:antialiased}
    body.page-ocean{background:radial-gradient(ellipse at 15% 12%,#dce9fb 0,transparent 38%),linear-gradient(145deg,#edf2fa,#e7edf5)}
    body.page-midnight{background:radial-gradient(ellipse at 82% 12%,#1b3150 0,transparent 36%),radial-gradient(ellipse at 12% 90%,#15243a 0,transparent 42%),#080e18}
    body.page-rose{background:radial-gradient(ellipse at 12% 15%,#f5dfd1 0,transparent 35%),linear-gradient(145deg,#f3e9df,#e9ddd2)}
    body.page-forest{background:radial-gradient(ellipse at 85% 12%,#d9e5d6 0,transparent 38%),linear-gradient(145deg,#edf1e9,#e1e9df)}
    .experience{position:relative;width:100%;max-width:430px;min-width:0;overflow:hidden;background:var(--surface);color:var(--ink);isolation:isolate}
    .experience:after{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;background:linear-gradient(145deg,#ffffff0b,transparent 42%)}
    .brand-block{display:grid;grid-template-columns:1fr;gap:18px;min-width:0}
    .brand-mark-row{display:flex;justify-content:${logoAlign};align-items:center;min-width:0}
    .brand-mark{width:auto;max-width:100%;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
    .brand-mark img{display:block;max-width:100%;object-fit:contain}
    .brand-mark-fallback{width:54px;height:54px;border-radius:17px;background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent);font-size:25px}
    .brand-copy{min-width:0}
    .eyebrow,.message-kicker{margin:0 0 10px;color:var(--muted);font-size:9px;font-weight:800;letter-spacing:1.8px;line-height:1.5}
    .business{margin:0;font-size:clamp(25px,7vw,36px);font-weight:800;line-height:1.12;letter-spacing:-1.1px;overflow-wrap:anywhere}
    .branch{display:inline-flex;max-width:100%;margin-top:12px;padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:var(--soft);color:var(--muted);font-size:10px;font-weight:700;line-height:1.35;overflow-wrap:anywhere}
    .address{margin:9px 0 0;color:var(--muted);font-size:11px;line-height:1.65;overflow-wrap:anywhere}
    .message{min-width:0}
    .message h1{margin:0 0 10px;font-size:clamp(23px,6vw,31px);font-weight:800;line-height:1.16;letter-spacing:-.8px;overflow-wrap:anywhere}
    .description{margin:0;color:var(--muted);font-size:13px;line-height:1.8;overflow-wrap:anywhere}
    .actions{display:grid;gap:11px;min-width:0}
    .review-button{width:100%;min-width:0;min-height:54px;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 15px;border:1px solid var(--accent);border-radius:13px;background:var(--accent);color:#fff;font:750 12px var(--font);cursor:pointer}
    .review-button>span:nth-child(2){min-width:0;overflow-wrap:anywhere}
    .review-button> b{margin-left:auto;font-size:15px}
    .review-button.outline{background:transparent;color:var(--accent)}
    .google-g{display:grid;place-items:center;flex:0 0 22px;width:22px;height:22px;border-radius:50%;background:#fff;color:#4285f4;font-size:13px;font-weight:900}
    .social-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px;min-width:0}
    .social-link{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;border:1px solid var(--line);border-radius:10px;color:var(--ink);text-decoration:none;font-size:11px;font-weight:700}
    .social-link span{min-width:0;overflow-wrap:anywhere}.social-link b{color:var(--muted)}
    .status{min-height:16px;margin:10px 0 0;color:var(--muted);font-size:10px;line-height:1.5;text-align:center}
    .footer{margin-top:23px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:9px;letter-spacing:.35px;text-align:center}
    .footer strong{color:var(--ink)}
    .preview-note{width:100%;margin:0 0 16px;padding:8px 10px;border-radius:8px;background:var(--soft);color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.3px;text-align:center}
    /* Ocean: centered service card with clear vertical rhythm */
    .theme-ocean{--page:#eaf0fa;--surface:#fff;--ink:#172943;--muted:#718096;--line:#e2e9f2;--soft:#f3f6fb;max-width:430px;padding:32px 28px 22px;border:1px solid #dfe7f3;border-radius:24px;box-shadow:0 24px 65px #1d35551a;text-align:center}
    .theme-ocean:before{content:"";position:absolute;inset:0 0 auto;height:6px;background:linear-gradient(90deg,var(--accent),#8bbcff)}
    .theme-ocean{box-shadow:0 28px 80px #203b5c20,0 3px 10px #203b5c0b}
    .theme-ocean .brand-mark-fallback{box-shadow:0 8px 20px color-mix(in srgb,var(--accent) 18%,transparent)}
    .theme-ocean .brand-mark-row{justify-content:center}
    .theme-ocean .message{margin-top:25px;padding-top:22px;border-top:1px solid var(--line)}
    .theme-ocean .actions{margin-top:22px}
    /* Midnight: asymmetric editorial alignment, always anchored to one left edge */
    .theme-midnight{--page:#090e17;--surface:#111a29;--ink:#f4f6fb;--muted:#9aa9bf;--line:#2a384c;--soft:#1a293d;max-width:450px;padding:27px 28px 23px;border:1px solid #2a3a50;border-radius:19px;box-shadow:0 30px 80px #0008;text-align:center}
    .theme-midnight:before{content:"";position:absolute;right:-95px;top:-115px;width:240px;height:240px;border-radius:50%;background:var(--accent);opacity:.2;filter:blur(55px);pointer-events:none}
    .theme-midnight{box-shadow:0 35px 100px #0009,0 0 0 1px #ffffff08}
    .theme-midnight .midnight-top{padding-bottom:13px;border-bottom:1px solid #ffffff16}
    .theme-midnight .business{max-width:100%;text-wrap:balance}
    .theme-midnight .message h1{max-width:340px;margin-left:auto;margin-right:auto;text-wrap:balance}
    .theme-midnight .description{max-width:330px;margin-left:auto;margin-right:auto}
    .theme-midnight .midnight-top{position:relative;display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:34px;color:#a9b7ca;font-size:8px;font-weight:800;letter-spacing:2px}
    .edition-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
    .theme-midnight .brand-block{gap:15px;justify-items:center;text-align:center}\n    .theme-midnight .brand-mark-row{justify-content:center}\n    .theme-midnight .brand-copy{text-align:center}\n    .theme-midnight .branch{margin-left:auto;margin-right:auto}
    .theme-midnight .brand-mark-fallback{margin:0;border:1px solid color-mix(in srgb,var(--accent) 45%,transparent);background:color-mix(in srgb,var(--accent) 20%,#172338)}
    .theme-midnight .business{font-size:clamp(30px,7vw,40px);letter-spacing:-1.5px}
    .theme-midnight .message{margin-top:33px;padding-top:23px;border-top:1px solid var(--line)}
    .theme-midnight .actions{margin-top:22px}
    .theme-midnight .review-button{position:relative;border-radius:9px;padding-left:42px;padding-right:42px}\n    .theme-midnight .review-button .google-g{position:absolute;left:14px}\n    .theme-midnight .review-button>b{position:absolute;right:14px;margin:0}
    .theme-midnight .social-link{background:#172335;border-radius:8px}
    /* Rose: editorial masthead and narrow text column */
    .theme-rose{--page:#f2e9df;--surface:#fffaf4;--ink:#392b2b;--muted:#89766e;--line:#eadbd0;--soft:#f7eee6;max-width:450px;padding:0 27px 22px;border:1px solid #eadbd0;border-radius:4px;box-shadow:10px 12px 0 #d8c6b6;text-align:center}
    .theme-rose .rose-masthead{display:flex;justify-content:center;gap:18px;margin:0 -27px 26px;padding:17px 27px;border-bottom:1px solid var(--line);color:var(--muted);font-size:8px;font-weight:900;letter-spacing:1.5px;background:linear-gradient(90deg,#f8eee6,#fffaf4 50%,#f8eee6)}
    .theme-rose .brand-block{gap:13px;justify-items:center;text-align:center}\n    .theme-rose .brand-mark-row{justify-content:center}\n    .theme-rose .brand-copy{text-align:center}\n    .theme-rose .branch{margin-left:auto;margin-right:auto}
    .theme-rose .business{font-family:Georgia,serif;font-size:clamp(31px,7vw,41px);font-weight:500;letter-spacing:-1.2px;line-height:1.05}
    .theme-rose .eyebrow{font-size:8px;letter-spacing:2px}
    .theme-rose .message{margin-top:27px;padding-top:22px;border-top:1px solid var(--line)}
    .theme-rose{box-shadow:10px 12px 0 #d8c6b6,0 28px 70px #5a40301c}
    .theme-rose .business,.theme-rose .message h1{text-wrap:balance}
    .theme-rose .description{max-width:330px;margin-left:auto;margin-right:auto}
    .theme-rose .message-kicker{letter-spacing:2.2px}
    .theme-rose .message h1{font-family:Georgia,serif;font-size:clamp(27px,6vw,34px);font-weight:500;letter-spacing:-.7px}
    .theme-rose .actions{margin-top:22px}
    .theme-rose .review-button{position:relative;padding-left:42px;padding-right:42px;border-radius:3px;text-transform:uppercase;letter-spacing:.45px;font-size:10px}
    .theme-rose .social-links{grid-template-columns:repeat(2,minmax(0,1fr))}
    .theme-rose .review-button .google-g{position:absolute;left:13px}\n    .theme-rose .review-button>b{position:absolute;right:13px;margin:0}\n    .theme-rose .social-link{border-radius:3px}
    /* Forest: quiet natural layout with a contained message panel */
    .theme-forest{--page:#e9eee7;--surface:#f9fbf6;--ink:#203729;--muted:#718273;--line:#dce5d9;--soft:#edf3eb;max-width:440px;padding:27px 25px 22px;border:1px solid #dbe5d8;border-radius:29px 29px 12px 12px;box-shadow:0 22px 60px #1c3a2717;text-align:center}
    .theme-forest .forest-heading{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:24px;padding-bottom:15px;border-bottom:1px solid var(--line);color:var(--muted);font-size:8px;font-weight:850;letter-spacing:1.7px}
    .forest-leaf{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:var(--soft);color:var(--accent);font-size:14px}
    .theme-forest .brand-mark-row{justify-content:center}
    .theme-forest .brand-mark-fallback{width:62px;height:62px;border-radius:50%}
    .theme-forest .business{font-family:Georgia,serif;font-size:clamp(28px,6vw,37px);font-weight:500;letter-spacing:-.8px}
    .theme-forest .forest-message{margin-top:25px;padding:20px 17px;border:1px solid var(--line);border-radius:17px;background:var(--soft)}
    .theme-forest .message-kicker{margin-bottom:8px}
    .theme-forest .message h1{font-size:clamp(21px,5vw,26px)}
    .theme-forest .actions{margin-top:18px}
    .theme-forest .review-button{border-radius:99px}
    .theme-forest .social-link{border-radius:99px;background:var(--soft);border-color:transparent}
    @media(max-width:420px){body{padding:12px}.experience{max-width:100%}.theme-ocean{padding:28px 20px 20px}.theme-midnight{padding:23px 20px 20px}.theme-rose{padding-left:20px;padding-right:20px}.theme-rose .rose-masthead{margin-left:-20px;margin-right:-20px;padding-left:20px;padding-right:20px}.theme-forest{padding:23px 19px 19px}.social-links{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){.review-button{transition:none}}
  `;
  const content = (input.preview ? '<p class="preview-note">PREVIEW PEMILIK KARTU · Aktivitas tidak dicatat</p>' : '') + layouts[theme];
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="' + (theme === "midnight" ? "#090e17" : "#f2f5f8") + '"><title>Review ' + name + ' | DiTapAja</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>' + css + '</style></head><body class="page-' + theme + '"><main class="experience theme-' + theme + '">' + content + '<p class="status" id="status" role="status" aria-live="polite"></p><footer class="footer">Powered by <strong>DiTapAja</strong> · Tap. Review. Grow.</footer></main></body></html>';
}
