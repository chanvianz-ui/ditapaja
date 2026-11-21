export type NfcTemplate = "ocean" | "midnight" | "rose" | "forest";

export type NfcPageVisual = {
  theme?: NfcTemplate;
  font_family?: string;
  accent_color?: string;
  button_style?: "solid" | "outline";
  logo_url?: string | null;
  logo_size?: number;
  logo_position?: "left" | "center" | "right";
  business_name?: string;
  branch_name?: string;
  branch_address?: string;
  headline?: string;
  description?: string;
  whatsapp_url?: string;
  instagram_url?: string;
  website_url?: string;
  preview?: boolean;
};

const esc = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character] || character));

const validTheme = (value: string | undefined): value is NfcTemplate =>
  value === "ocean" || value === "midnight" || value === "rose" || value === "forest";

export function renderNfcPageDocument(input: NfcPageVisual) {
  const theme: NfcTemplate = validTheme(input.theme) ? input.theme : "ocean";
  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent_color || "")
    ? input.accent_color!
    : "#bd8057";
  const font = input.font_family === "Georgia"
    ? "Georgia,serif"
    : input.font_family === "Arial"
      ? "Arial,sans-serif"
      : input.font_family === "DM Sans"
        ? '"DM Sans",sans-serif'
        : '"Manrope",sans-serif';
  const logoSize = Math.min(128, Math.max(40, Number(input.logo_size) || 72));
  const logoAlign = ["left", "center", "right"].includes(input.logo_position || "")
    ? input.logo_position!
    : "center";
  const logoJustify = logoAlign === "left" ? "flex-start" : logoAlign === "right" ? "flex-end" : "center";
  const name = esc(input.business_name || "Bisnis Kami");
  const branch = esc(input.branch_name || "");
  const address = esc(input.branch_address || "");
  const headline = esc(input.headline || "Bagikan pengalaman kamu");
  const description = esc(input.description || "Terima kasih sudah berkunjung. Pengalaman kamu sangat berarti bagi kami.");

  const logo = input.logo_url
    ? '<img class="brand-image" src="' + esc(input.logo_url) + '" alt="Logo ' + name + '" style="width:' + logoSize + 'px;height:' + logoSize + 'px">'
    : '<span class="brand-symbol" aria-hidden="true">✳</span>';

  const brand = '<div class="brand" style="--logo-align:' + logoAlign + ';--logo-justify:' + logoJustify + '">' + logo +
    '<div class="brand-copy"><p class="eyebrow">PENGALAMAN KAMU BERARTI</p><h2 class="business">' + name + '</h2>' +
    (branch ? '<span class="branch">' + branch + '</span>' : "") +
    (address ? '<p class="address">' + address + '</p>' : "") +
    '</div></div>';

  const message = '<section class="message"><p class="message-kicker">CERITAKAN PENGALAMANMU</p><h1>' +
    headline + '</h1><p class="description">' + description + '</p></section>';

  const socialLinks = ([
    ["WhatsApp", input.whatsapp_url],
    ["Instagram", input.instagram_url],
    ["Website", input.website_url],
  ] as [string, string | undefined][])
    .filter((item): item is [string, string] => Boolean(item[1]) && /^https:\/\//i.test(item[1]))
    .map(([label, url]) => '<a class="social-link" href="' + esc(url) +
      '" target="_blank" rel="noopener noreferrer"><span>' + label +
      '</span><b aria-hidden="true">↗</b></a>').join("");

  const actions = '<div class="actions"><button class="review-button ' +
    (input.button_style === "outline" ? "outline" : "solid") +
    '" id="reviewButton" type="button"><span class="google-g" aria-hidden="true">G</span>' +
    '<span>Berikan Ulasan di Google</span><b aria-hidden="true">↗</b></button>' +
    (socialLinks ? '<nav class="social-links" aria-label="Tautan bisnis">' + socialLinks + '</nav>' : "") +
    '</div>';

  const layouts: Record<NfcTemplate, string> = {
    // Atelier — editorial hierarchy, restrained framing and generous typography.
    ocean:
      '<div class="atelier-index"><span>ATELIER / EXPERIENCE</span><span>01 — REVIEW</span></div>' +
      '<div class="atelier-hero">' + brand + '</div>' +
      '<div class="atelier-copy">' + message + '</div>' +
      '<div class="atelier-actions">' + actions + '</div>',

    // Obsidian — centered, architectural and layered.
    midnight:
      '<div class="obsidian-orbit" aria-hidden="true"></div>' +
      '<div class="obsidian-top"><span class="signal"></span><span>THE EXPERIENCE / YOUR VOICE</span></div>' +
      '<div class="obsidian-brand">' + brand + '</div>' +
      '<div class="obsidian-rule"><span>02</span><i></i><span>YOUR REVIEW MATTERS</span></div>' +
      '<div class="obsidian-message">' + message + '</div>' +
      '<div class="obsidian-actions">' + actions + '</div>',

    // Playform — bold blocks, typographic poster and asymmetric composition.
    rose:
      '<div class="playform-top"><span>PLAYFORM®</span><span>MAKE IT COUNT&nbsp; ↗</span></div>' +
      '<div class="playform-title"><span class="poster-word">GOOD</span><span class="poster-word poster-outline">VIBES.</span></div>' +
      '<div class="playform-brand">' + brand + '</div>' +
      '<div class="playform-bottom"><div class="playform-copy">' + message + '</div>' +
      '<div class="playform-actions">' + actions + '</div></div>',

    // Solace — organic forms, soft geometry and an intimate content panel.
    forest:
      '<div class="solace-shape solace-shape-a" aria-hidden="true"></div>' +
      '<div class="solace-shape solace-shape-b" aria-hidden="true"></div>' +
      '<div class="solace-kicker"><span>✳</span><span>A MOMENT TO SHARE</span></div>' +
      '<div class="solace-brand">' + brand + '</div>' +
      '<div class="solace-panel">' + message + '</div>' +
      '<div class="solace-actions">' + actions + '</div>',
  };

  const css = `
    :root{color-scheme:dark;--accent:${accent};--font:${font};--bg:#090a0c;--surface:#121417;--surface-2:#191c20;--ink:#f0eee8;--muted:#999b9c;--line:rgba(238,236,230,.13);--soft:#202328}
    *{box-sizing:border-box}
    html{min-height:100%;background:var(--bg)}
    body{min-height:100vh;margin:0;padding:clamp(16px,4vw,52px);display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 0%,rgba(189,128,87,.12),transparent 48%),#090a0c;color:var(--ink);font-family:var(--font);-webkit-font-smoothing:antialiased}
    .experience{position:relative;isolation:isolate;width:100%;max-width:470px;min-width:0;overflow:hidden;background:var(--surface);color:var(--ink);font-family:var(--font)}
    .experience:after{position:absolute;inset:0;z-index:-1;content:"";pointer-events:none;background:linear-gradient(145deg,rgba(255,255,255,.035),transparent 38%)}
    .brand{display:flex;flex-direction:column;align-items:var(--logo-justify);gap:16px;min-width:0}
    .brand-image,.brand-symbol{display:grid;flex:0 0 auto;max-width:100%;object-fit:contain}
    .brand-symbol{width:58px;height:58px;place-items:center;border:1px solid color-mix(in srgb,var(--accent) 48%,transparent);border-radius:17px;background:color-mix(in srgb,var(--accent) 14%,var(--surface));color:var(--accent);font-size:26px}
    .brand-copy{width:100%;min-width:0;text-align:var(--logo-align)}
    .eyebrow,.message-kicker{margin:0 0 10px;color:var(--accent);font-size:8px;font-weight:850;letter-spacing:2px;line-height:1.5}
    .business{margin:0;color:var(--ink);font-size:clamp(25px,7vw,39px);font-weight:800;line-height:1.05;letter-spacing:-1.5px;overflow-wrap:anywhere;text-wrap:balance}
    .branch{display:inline-flex;max-width:100%;margin-top:12px;padding:7px 10px;border:1px solid var(--line);border-radius:99px;background:var(--soft);color:var(--muted);font-size:9px;font-weight:700;line-height:1.35;overflow-wrap:anywhere}
    .address{margin:9px 0 0;color:var(--muted);font-size:10px;line-height:1.6;overflow-wrap:anywhere}
    .message{min-width:0}
    .message h1{margin:0 0 11px;color:var(--ink);font-size:clamp(24px,6vw,34px);font-weight:800;line-height:1.08;letter-spacing:-1.2px;overflow-wrap:anywhere;text-wrap:balance}
    .description{max-width:390px;margin:0;color:var(--muted);font-size:12px;line-height:1.8;overflow-wrap:anywhere}
    .actions{display:grid;gap:10px;min-width:0}
    .review-button{position:relative;width:100%;min-width:0;min-height:55px;display:flex;align-items:center;justify-content:center;gap:10px;padding:13px 43px;border:1px solid var(--accent);border-radius:10px;background:var(--accent);color:#100d0a;font:800 11px var(--font);cursor:pointer;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease}
    .review-button>span:nth-child(2){min-width:0;overflow-wrap:anywhere}
    .review-button> b{position:absolute;right:15px;font-size:15px}
    .review-button.outline{background:transparent;color:var(--accent)}
    .google-g{position:absolute;left:14px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#fff;color:#4285f4;font:900 13px Arial,sans-serif}
    .social-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;min-width:0}
    .social-link{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;border:1px solid var(--line);border-radius:9px;background:rgba(255,255,255,.025);color:var(--ink);text-decoration:none;font-size:10px;font-weight:750;transition:transform .18s ease,border-color .18s ease,background .18s ease}
    .social-link span{min-width:0;overflow-wrap:anywhere}.social-link b{color:var(--accent)}
    .status{min-height:16px;margin:12px 0 0;color:var(--muted);font-size:10px;line-height:1.5;text-align:center}
    .footer{margin-top:22px;padding-top:13px;border-top:1px solid var(--line);color:#777b7d;font-size:8px;letter-spacing:.4px;text-align:center}
    .footer strong{color:#c4c0b8}
    .preview-note{position:relative;z-index:2;width:100%;margin:0 0 14px;padding:8px 10px;border:1px solid var(--line);border-radius:7px;background:var(--soft);color:var(--muted);font-size:8px;font-weight:750;letter-spacing:.5px;text-align:center}
    .review-button:hover{filter:brightness(1.08);transform:translateY(-2px);box-shadow:0 10px 28px color-mix(in srgb,var(--accent) 23%,transparent)}
    .social-link:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--accent) 55%,var(--line));background:rgba(255,255,255,.055)}
    .review-button:focus-visible,.social-link:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 65%,white);outline-offset:3px}
    .review-button:disabled{cursor:wait;opacity:.65;transform:none}
    /* ATELIER / editorial */
    .theme-ocean{max-width:450px;padding:26px 27px 22px;border:1px solid #34302c;border-radius:3px;background:linear-gradient(160deg,#171719,#101113 62%,#141313);box-shadow:0 35px 100px #0009}
    .atelier-index{display:flex;justify-content:space-between;gap:12px;margin-bottom:38px;padding-bottom:13px;border-bottom:1px solid var(--line);color:#888782;font:800 8px Arial,sans-serif;letter-spacing:1.8px}
    .atelier-hero{padding:0 0 30px}
    .theme-ocean .brand{align-items:flex-start;gap:18px}
    .theme-ocean .brand-copy{text-align:left}
    .theme-ocean .brand-symbol{border-radius:2px}
    .theme-ocean .business{font-family:Georgia,serif;font-weight:500;font-size:clamp(32px,8vw,45px);letter-spacing:-1.4px}
    .theme-ocean .atelier-copy{padding:25px 0 26px;border-top:1px solid var(--line)}
    .theme-ocean .message h1{max-width:360px;font-family:Georgia,serif;font-size:clamp(29px,7vw,39px);font-weight:500;letter-spacing:-.8px;line-height:1.08}
    .theme-ocean .atelier-actions{padding-top:21px;border-top:1px solid var(--line)}
    .theme-ocean .review-button{border-radius:2px;text-transform:uppercase;letter-spacing:.55px}
    .theme-ocean .social-link{border-radius:2px}
    /* OBSIDIAN / architectural dark premium */
    .theme-midnight{max-width:450px;padding:27px 25px 22px;border:1px solid #34373b;border-radius:18px;background:radial-gradient(ellipse at 50% 0%,#282522 0,transparent 42%),#111316;box-shadow:0 35px 110px #000b}
    .obsidian-orbit{position:absolute;z-index:-1;top:-160px;right:-130px;width:310px;height:310px;border:1px solid rgba(189,128,87,.25);border-radius:50%;box-shadow:0 0 0 24px rgba(189,128,87,.035),0 0 0 50px rgba(189,128,87,.025)}
    .obsidian-top{display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:32px;color:#aaa49c;font:800 8px Arial,sans-serif;letter-spacing:2px}
    .signal{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--accent)}
    .obsidian-brand .brand{align-items:center;text-align:center}
    .obsidian-brand .brand-copy{text-align:center}
    .obsidian-brand .brand-symbol{width:68px;height:68px;border-radius:50%}
    .obsidian-brand .business{font-size:clamp(30px,7vw,40px);letter-spacing:-1.8px}
    .obsidian-brand .branch{margin-inline:auto}
    .obsidian-rule{display:flex;align-items:center;gap:12px;margin:28px 0 24px;color:#85827d;font:800 8px Arial,sans-serif;letter-spacing:1.5px}
    .obsidian-rule i{height:1px;flex:1;background:var(--line)}
    .obsidian-rule span:first-child{color:var(--accent)}
    .obsidian-message{text-align:center}
    .obsidian-message .message h1{max-width:350px;margin-inline:auto;font-size:clamp(27px,6vw,35px)}
    .obsidian-message .description{margin-inline:auto}
    .obsidian-actions{margin-top:24px}
    .theme-midnight .review-button{border-radius:99px}
    .theme-midnight .social-link{border-radius:99px}
    /* PLAYFORM / graphic brutalism */
    .theme-rose{max-width:470px;padding:22px;background:#e9e5dc;color:#111214;border:0;border-radius:0;box-shadow:14px 14px 0 rgba(189,128,87,.5)}
    .playform-top{display:flex;justify-content:space-between;gap:10px;padding-bottom:14px;border-bottom:2px solid #111214;color:#111214;font:900 8px Arial,sans-serif;letter-spacing:1.5px}
    .playform-title{display:grid;margin:20px 0 23px;color:#111214;font:950 clamp(64px,17vw,100px)/.76 Arial,sans-serif;letter-spacing:-.09em}
    .poster-word{display:block}.poster-outline{-webkit-text-stroke:2px #111214;color:transparent}
    .playform-brand{padding:16px;border:2px solid #111214;background:#f5f1e8}
    .theme-rose .brand{flex-direction:row;align-items:center;gap:14px}
    .theme-rose .brand-image,.theme-rose .brand-symbol{width:54px!important;height:54px!important;max-width:54px;flex:0 0 54px;border:2px solid #111214;border-radius:0;background:#d7c9b8;color:#111214}
    .theme-rose .brand-copy{text-align:left}
    .theme-rose .eyebrow{color:#6c5140}
    .theme-rose .business{color:#111214;font:900 clamp(20px,5vw,29px)/.98 Arial,sans-serif;letter-spacing:-1.4px}
    .theme-rose .branch{border:1px solid #111214;border-radius:0;background:transparent;color:#38332e}
    .theme-rose .address{color:#625d56}
    .playform-bottom{display:grid;grid-template-columns:1fr;gap:20px;margin-top:22px}
    .theme-rose .message-kicker{color:#6c5140}
    .theme-rose .message h1{color:#111214;font:900 clamp(26px,7vw,37px)/.98 Arial,sans-serif;letter-spacing:-1.7px}
    .theme-rose .description{color:#514d47}
    .theme-rose .review-button{border:2px solid #111214;border-radius:0;background:#111214;color:#f5f1e8;box-shadow:4px 4px 0 var(--accent);text-transform:uppercase;letter-spacing:.3px}
    .theme-rose .review-button.outline{background:transparent;color:#111214}
    .theme-rose .social-link{border:2px solid #111214;border-radius:0;background:transparent;color:#111214}
    .theme-rose .social-link b{color:#111214}
    .theme-rose .footer{border-color:#aaa49a;color:#5e5a54}
    .theme-rose .footer strong{color:#111214}
    /* SOLACE / organic spatial */
    .theme-forest{max-width:450px;padding:27px 24px 22px;border:1px solid #343b34;border-radius:34px 34px 12px 12px;background:linear-gradient(155deg,#171d19,#101512 70%);box-shadow:0 35px 100px #0009}
    .solace-shape{position:absolute;z-index:-1;pointer-events:none;border-radius:50%;filter:blur(1px)}
    .solace-shape-a{top:-110px;right:-110px;width:280px;height:280px;border:1px solid rgba(189,128,87,.32);box-shadow:inset 0 0 55px rgba(189,128,87,.08),0 0 0 22px rgba(189,128,87,.025)}
    .solace-shape-b{bottom:120px;left:-170px;width:260px;height:260px;background:radial-gradient(circle,rgba(91,118,91,.16),transparent 70%)}
    .solace-kicker{display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:28px;color:#a0a99c;font:800 8px Arial,sans-serif;letter-spacing:1.8px}
    .solace-kicker span:first-child{display:grid;place-items:center;width:24px;height:24px;border:1px solid #4a5a48;border-radius:50%;color:#c1a07e}
    .solace-brand .brand{align-items:center;text-align:center}
    .solace-brand .brand-copy{text-align:center}
    .solace-brand .brand-symbol{width:64px;height:64px;border-radius:50%;background:#253126;border-color:#56664f;color:#d2ad85}
    .solace-brand .business{font-family:Georgia,serif;font-weight:500;font-size:clamp(30px,7vw,39px);letter-spacing:-.8px}
    .solace-brand .branch{margin-inline:auto}
    .solace-panel{position:relative;margin-top:28px;padding:22px 18px;border:1px solid #3a443a;border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));box-shadow:inset 0 1px rgba(255,255,255,.06)}
    .solace-panel .message{text-align:center}
    .solace-panel .message h1{font-family:Georgia,serif;font-weight:500;font-size:clamp(25px,6vw,33px);letter-spacing:-.5px}
    .solace-panel .description{margin-inline:auto}
    .solace-actions{margin-top:17px}
    .theme-forest .review-button{border-radius:99px}
    .theme-forest .social-link{border-radius:99px;background:rgba(255,255,255,.035)}
    @media(max-width:430px){
      body{padding:12px}
      .experience{max-width:100%}
      .theme-ocean{padding:22px 19px 18px}
      .atelier-index{margin-bottom:28px}
      .theme-midnight{padding:23px 19px 18px}
      .theme-rose{padding:17px}
      .playform-title{font-size:clamp(59px,17vw,78px)}
      .theme-forest{padding:23px 18px 18px}
      .social-links{grid-template-columns:1fr}
    }
    @media(prefers-reduced-motion:reduce){.review-button,.social-link{transition:none}.review-button:hover,.social-link:hover{transform:none}}
  `;

  const content = (input.preview
    ? '<p class="preview-note">PREVIEW PEMILIK KARTU · AKTIVITAS TIDAK DICATAT</p>'
    : "") + layouts[theme];

  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="theme-color" content="#090a0c"><title>Review ' + name + ' | DiTapAja</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">' +
    '<style>' + css + '</style></head><body class="page-' + theme + '">' +
    '<main class="experience theme-' + theme + '">' + content +
    '<p class="status" id="status" role="status" aria-live="polite"></p>' +
    '<footer class="footer">Powered by <strong>DiTapAja</strong> · Tap. Review. Grow.</footer>' +
    '</main></body></html>';
}
