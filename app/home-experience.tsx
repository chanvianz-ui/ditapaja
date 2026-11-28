"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type CSSProperties } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Check, Link2, MapPin, Nfc, QrCode, Smartphone, Star, RotateCcw, Wifi, MessageCircle, Coffee, CalendarDays } from "lucide-react";
import SiteHeader from "./components/site-header";
import ProductCarousel from "./components/product-carousel";
import { PRODUCT_LIST } from "./lib/product-catalog";

const products = PRODUCT_LIST;

function BrandMark() {
  return <span className="dt-v2-brand-mark" aria-hidden="true"><i/><i/><i/></span>;
}

function HeroTapDemo() {
  const [tapped, setTapped] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [clock, setClock] = useState("--:--");
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateClock = () => setClock(new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    updateClock();
    const timer = window.setInterval(updateClock, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const resetDemo = () => {
    setTapped(false);
    setShowReview(false);
    setRating(0);
    setReview("");
    setSubmitted(false);
    setDragOffset(0);
    dragStart.current = null;
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    setDragOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    setDragOffset(Math.max(0, Math.min(dx, 170)));
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragStart.current) return;
    const dx = event.clientX - dragStart.current.x;
    dragStart.current = null;
    setDragOffset(0);
    if (dx > 48) {
      setTapped(true);
      setShowReview(false);
      setSubmitted(false);
    }
  };

  return <div className={`home-hero-visual home-tap-demo ${tapped ? "is-tapped" : ""} ${submitted ? "is-submitted" : ""}`} aria-label="Simulasi pengalaman pelanggan menggunakan kartu NFC">
    <div className="home-demo-heading">
      <div><span className="home-section-index"><i/> LIVE INTERACTION</span><b>Coba sendiri pengalaman tap NFC</b></div>
      <span className="home-demo-disclaimer">DEMO · TANPA DATA TERKIRIM</span>
    </div>
    <div className="home-demo-stage">
      <div className="home-demo-card-wrap">
        <span className="home-demo-instruction">{tapped ? "KARTU TERBACA" : "GESER KARTU KE KANAN"}</span>
        <button type="button" className="home-demo-card" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={() => { dragStart.current = null; setDragOffset(0); }} style={dragOffset ? { transform: "translateX(" + dragOffset + "px) rotate(2deg) scale(.98)" } : undefined} onClick={(event) => { if (event.detail === 0 && !tapped) setTapped(true); }} aria-label="Geser kartu NFC ke kanan untuk memulai simulasi">
          <div className="home-demo-card-top"><BrandMark/><span>DITAPAJA</span><Nfc size={22}/></div>
          <div className="home-demo-card-title">YOUR<br/><em>review</em><br/>STARTS HERE.</div>
          <div className="home-demo-card-bottom"><span>ONE TAP TO REVIEW</span><span>NFC AND QR</span></div>
          <span className="home-demo-card-glint"/>
        </button>
        <span className="home-demo-card-caption">NFC REVIEW CARD · NOIR</span>
      </div>
      <div className="home-demo-transfer" aria-hidden="true"><span/><ArrowUpRight size={23}/><small>NFC</small></div>
      <div className="home-demo-phone-wrap">
        <span className="home-demo-instruction">{!tapped ? "SMARTPHONE" : showReview ? "CONTOH FORM REVIEW" : "TUJUAN TERBUKA"}</span>
        <div className="home-demo-phone">
          <div className="home-phone-island"/>
          <div className="home-phone-status"><span>{clock}</span><span>●●● ▰</span></div>
          {!tapped ? <div className="home-phone-idle">
            <div className="home-phone-nfc"><Nfc size={29}/></div>
            <b>Ready to tap</b>
            <p>Dekatkan kartu ke ponsel untuk membuka halaman tujuan.</p>
            <span><i/> NFC CONNECTION READY</span>
          </div> : showReview ? <div className="home-demo-review-screen">
            <div className="home-demo-review-top"><button type="button" onClick={() => setShowReview(false)} aria-label="Kembali ke peta">‹</button><b>Review experience</b><span>•••</span></div>
            <div className="home-demo-review-brand"><div className="home-demo-review-avatar">D</div><div><b>DiTapAja</b><small>Contoh tampilan halaman ulasan</small></div></div>
            <div className="home-demo-review-prompt"><strong>Bagaimana pengalamanmu?</strong><p>Pilih rating untuk melihat alur review yang lebih praktis.</p></div>
            <div className="home-google-rating-picker" role="group" aria-label="Pilih rating">
              {[1,2,3,4,5].map((value) => <button key={value} type="button" className={rating >= value ? "selected" : ""} onClick={() => setRating(value)} aria-label={value + " bintang"} aria-pressed={rating === value}>★</button>)}
            </div>
            <span className="home-google-rating-label">{rating ? ["", "Kurang baik", "Cukup", "Baik", "Sangat baik", "Luar biasa"][rating] : "Ketuk bintang untuk memberi rating"}</span>
            <label className="home-demo-review-label" htmlFor="home-demo-review">Ceritakan pengalamanmu <span>OPSIONAL</span></label>
            <textarea id="home-demo-review" className="home-google-review-input" value={review} onChange={(event) => setReview(event.target.value)} placeholder="Tulis ulasan singkat..." maxLength={180}/>
            {submitted ? <div className="home-google-submitted" role="status"><Check size={15}/> Simulasi selesai. Tidak ada ulasan yang dikirim.</div> : <button type="button" className="home-google-submit" disabled={!rating} onClick={() => setSubmitted(true)}>Kirim simulasi <ArrowUpRight size={12}/></button>}
            <small className="home-google-note">Pratinjau interaktif · bukan pengiriman review sungguhan</small>
          </div> : <div className="home-google-screen">
            <div className="home-maps-appbar"><span className="home-maps-menu">☰</span><div className="home-maps-search"><span>⌕</span><b>DiTapAja</b><span>×</span></div><span className="home-maps-account">D</span></div>
            <div className="home-maps-map" aria-label="Ilustrasi tampilan peta">
              <div className="home-maps-map-grid"/><div className="home-maps-map-road road-a"/><div className="home-maps-map-road road-b"/><div className="home-maps-map-road road-c"/><div className="home-maps-map-park"/><div className="home-maps-map-water"/>
              <span className="home-maps-map-label label-a">Jalan utama</span><span className="home-maps-map-label label-b">Area sekitar</span><span className="home-maps-pin"><i/></span><span className="home-maps-map-fab">＋</span>
            </div>
            <div className="home-maps-place-sheet">
              <div className="home-maps-sheet-handle"/>
              <div className="home-maps-place-title"><div><small>DESTINATION PREVIEW</small><strong>DiTapAja</strong><span>Tujuan dari tautan Google Maps</span></div><span className="home-maps-place-icon"><MapPin size={18}/></span></div>
              <div className="home-maps-place-actions">
                <span>Tujuan bisnis</span>
                <span>Halaman ulasan</span>
                <span>Browser ponsel</span>
              </div>
              <button className="home-maps-open" type="button" onClick={() => { setShowReview(true); setSubmitted(false); }}>Lihat alur review <ArrowUpRight size={13}/></button>
              <span className="home-maps-real-link">Contoh tampilan tujuan pelanggan</span>
              <small className="home-google-note">Ilustrasi peta · detail lokasi dibuka dari Google Maps asli</small>
            </div>
          </div>}
          <div className="home-phone-homebar"/>
        </div>
      </div>
    </div>
    <div className="home-demo-footer">
      <span>{!tapped ? "Geser kartu ke kanan untuk mulai" : submitted ? "Simulasi selesai" : showReview ? "Pilih rating dan coba form review" : "Kartu berhasil terbaca"}</span>
      <div className="home-demo-footer-actions">
        {tapped && !showReview && <button type="button" onClick={() => setShowReview(true)}>Coba alur review <ArrowUpRight size={12}/></button>}
        <button type="button" onClick={resetDemo}><RotateCcw size={13}/> Reset demo</button>
      </div>
    </div>
  </div>;
}
function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      number: "Tap",
      eyebrow: "THE FIRST CONTACT",
      title: "Tap or scan.",
      description: "Pelanggan cukup mendekatkan smartphone ke kartu NFC atau memindai QR Code yang tersedia. Tidak perlu aplikasi tambahan.",
      note: "NFC + QR CODE",
      visual: "tap",
      visualTitle: "One simple tap.",
      visualCopy: "Dekatkan ponsel. Kartu akan terbaca otomatis."
    },
    {
      number: "Open",
      eyebrow: "INSTANT REDIRECT",
      title: "Your page opens.",
      description: "Browser langsung membuka tautan tujuan yang sudah kamu atur. Pengalaman tetap cepat, familiar, dan mudah diikuti.",
      note: "DIRECT TO YOUR LINK",
      visual: "open",
      visualTitle: "Straight to the point.",
      visualCopy: "Tidak ada aplikasi yang harus diunduh."
    },
    {
      number: "Review",
      eyebrow: "THE MOMENT THAT MATTERS",
      title: "Leave a review.",
      description: "Pelanggan tiba di halaman review bisnismu dan bisa membagikan pengalaman mereka dengan lebih praktis.",
      note: "READY FOR FEEDBACK",
      visual: "review",
      visualTitle: "Make feedback easier.",
      visualCopy: "Satu langkah lebih dekat ke ulasan pelanggan."
    }
  ];
  const step = steps[activeStep];

  return (
    <section className="dt-how-section" id="cara-kerja">
      <div className="dt-how-heading">
        <div>
          <span className="dt-how-kicker">HOW IT WORKS</span>
          <h2>From a tap<br/>to a <em>review.</em></h2>
        </div>
        <p>Teknologi di baliknya sederhana. Pengalaman pelanggan juga harus begitu.</p>
      </div>

      <div className="dt-how-workspace">
        <div className="dt-how-steps" role="tablist" aria-label="Tahapan penggunaan DiTapAja">
          {steps.map((item, index) => (
            <button
              key={item.number}
              type="button"
              role="tab"
              id={"dt-how-tab-" + index}
              aria-selected={activeStep === index}
              aria-controls="dt-how-panel"
              tabIndex={activeStep === index ? 0 : -1}
              className={"dt-how-step" + (activeStep === index ? " is-active" : "")}
              onClick={() => setActiveStep(index)}
              onKeyDown={(event) => {
                const key = event.key;
                if (key !== "ArrowRight" && key !== "ArrowDown" && key !== "ArrowLeft" && key !== "ArrowUp" && key !== "Home" && key !== "End") return;
                event.preventDefault();
                const nextIndex = key === "Home"
                  ? 0
                  : key === "End"
                    ? steps.length - 1
                    : (index + (key === "ArrowRight" || key === "ArrowDown" ? 1 : -1) + steps.length) % steps.length;
                setActiveStep(nextIndex);
                document.getElementById("dt-how-tab-" + nextIndex)?.focus();
              }}
            >
              <span className="dt-how-step-number">{item.number}</span>
              <span className="dt-how-step-label">{item.title}</span>
              <span className="dt-how-step-indicator">{activeStep === index ? <Check size={15}/> : <ArrowUpRight size={14}/>}</span>
            </button>
          ))}
        </div>

        <div className="dt-how-panel" id="dt-how-panel" role="tabpanel" aria-labelledby={"dt-how-tab-" + activeStep}>
          <div className="dt-how-copy" key={step.number}>
            <span className="dt-how-eyebrow">{step.eyebrow}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <div className="dt-how-note"><span><i/>{step.note}</span><span>THE CUSTOMER JOURNEY</span></div>
          </div>

          <div className={"dt-how-visual dt-how-visual-" + step.visual} role="img" aria-label={step.visualTitle}>
            <div className="dt-how-visual-grid"/>
            <div className="dt-how-visual-orbit"/>
            <div className="dt-how-visual-core">
              {activeStep === 0 ? (
                <>
                  <div className="dt-how-mini-card"><span>DITAPAJA®</span><b>YOUR<br/><em>review</em><br/>STARTS HERE.</b><small>NFC · QR</small></div>
                  <div className="dt-how-mini-phone"><span/><Smartphone size={31}/><i/></div>
                  <div className="dt-how-signal"><i/><i/><i/></div>
                </>
              ) : activeStep === 1 ? (
                <>
                  <div className="dt-how-browser"><div className="dt-how-browser-bar"><i/><i/><i/><span>YOUR DESTINATION</span></div><div className="dt-how-browser-content"><span className="dt-how-browser-mark">D.</span><b>Business<br/><em>destination.</em></b><small>OPENED IN YOUR BROWSER</small><div className="dt-how-browser-line"/></div></div>
                  <div className="dt-how-link-orbit"><Link2 size={22}/></div>
                </>
              ) : (
                <>
                  <div className="dt-how-review-card"><span>YOUR EXPERIENCE</span><b>How was<br/>your visit?</b><div className="dt-how-stars">★★★★★</div><small>SHARE YOUR FEEDBACK</small><div className="dt-how-review-line"/></div>
                   
                </>
              )}
            </div>
            <div className="dt-how-visual-caption"><span><i/> {step.visualTitle}</span><small>{step.visualCopy}</small></div>
             
          </div>
        </div>
        <div className="dt-how-progress" aria-hidden="true"><span style={{width: ((activeStep + 1) / 3 * 100) + "%"}}/></div>
      </div>
      <div className="dt-how-footer"><span>DESIGNED TO FEEL EFFORTLESS.</span><span>NFC FIRST. QR ALWAYS READY.</span></div>
    </section>
  );
}


type UseCaseKey = "review" | "menu" | "whatsapp" | "booking";

function UseCaseExplorer() {
  const [active, setActive] = useState<UseCaseKey>("review");
  const cases = {
    review: { label: "GOOGLE REVIEW", title: "Lebih mudah meminta ulasan.", description: "Arahkan pelanggan langsung ke halaman review bisnismu setelah mereka menikmati layanan.", step: "Pelanggan tap kartu → halaman review terbuka → pelanggan menulis ulasan.", previewTitle: "Bagaimana pengalamanmu?", previewBody: "Bagikan pengalamanmu bersama kami.", action: "Beri ulasan", icon: Star },
    menu: { label: "MENU DIGITAL", title: "Menu selalu mudah ditemukan.", description: "Letakkan kartu di meja atau kasir agar pelanggan bisa membuka menu digital dari ponsel mereka.", step: "Pelanggan scan QR atau tap kartu → menu digital terbuka.", previewTitle: "Explore our menu.", previewBody: "Lihat pilihan menu dan informasi terbaru.", action: "Lihat menu", icon: Coffee },
    whatsapp: { label: "WHATSAPP", title: "Percakapan dimulai lebih cepat.", description: "Hubungkan kartu ke WhatsApp bisnis agar pelanggan bisa langsung bertanya atau menghubungi tim.", step: "Pelanggan tap kartu → WhatsApp bisnis terbuka.", previewTitle: "Ada yang bisa kami bantu?", previewBody: "Mulai percakapan dengan tim bisnis.", action: "Chat sekarang", icon: MessageCircle },
    booking: { label: "BOOKING & RESERVASI", title: "Akses pemesanan tanpa mencari-cari.", description: "Arahkan pelanggan ke halaman reservasi atau formulir booking yang sudah digunakan bisnismu.", step: "Pelanggan tap kartu → halaman booking terbuka.", previewTitle: "Make a reservation.", previewBody: "Pilih jadwal dan kirim permintaan reservasi.", action: "Buat reservasi", icon: CalendarDays }
  };
  const item = cases[active];
  const PreviewIcon = item.icon;

  return (
    <section className="dt-usecase-section" id="use-case">
      <div className="dt-usecase-heading">
        <div><span className="dt-usecase-kicker">ONE CARD. YOUR DESTINATION.</span><h2>Satu kartu.<br/><em>Banyak kemungkinan.</em></h2></div>
        <p>Gunakan kartu NFC untuk mengarahkan pelanggan ke tautan yang paling dibutuhkan bisnismu. Pilih contoh penggunaan di bawah ini.</p>
      </div>
      <div className="dt-usecase-layout">
        <div className="dt-usecase-options" role="tablist" aria-label="Contoh penggunaan kartu NFC">
          {(Object.keys(cases) as UseCaseKey[]).map((key) => {
            const option = cases[key];
            const Icon = option.icon;
            return <button key={key} type="button" role="tab" id={"dt-usecase-tab-" + key} aria-selected={active === key} aria-controls="dt-usecase-panel" className={"dt-usecase-option" + (active === key ? " is-active" : "")} onClick={() => setActive(key)}>
              <span className="dt-usecase-option-icon"><Icon size={18}/></span><span><small>{option.label}</small><strong>{option.title}</strong></span><ArrowUpRight size={16}/>
            </button>;
          })}
        </div>
        <div className="dt-usecase-preview" id="dt-usecase-panel" role="tabpanel" aria-labelledby={"dt-usecase-tab-" + active}>
          <div className="dt-usecase-preview-top"><span><i/> LIVE USE-CASE PREVIEW</span><span>EXAMPLE {String((Object.keys(cases) as UseCaseKey[]).indexOf(active) + 1).padStart(2, "0")} / 04</span></div>
          <div className="dt-usecase-preview-content">
            <div className="dt-usecase-phone"><div className="dt-usecase-phone-top"><span>9:41</span><span>●●● ▰</span></div><div className="dt-usecase-phone-screen">
              <span className="dt-usecase-preview-icon"><PreviewIcon size={22}/></span><small>DITAPAJA · DESTINATION PREVIEW</small><strong>{item.previewTitle}</strong><p>{item.previewBody}</p><span className="dt-usecase-preview-button">{item.action}<ArrowUpRight size={13}/></span><span className="dt-usecase-preview-url">Contoh tampilan tujuan</span>
            </div><span className="dt-usecase-phone-home"/></div>
            <div className="dt-usecase-explainer"><span className="dt-usecase-label">CUSTOMER JOURNEY</span><h3>{item.title}</h3><p>{item.description}</p><div className="dt-usecase-flow"><Nfc size={16}/><span>{item.step}</span></div><a href="/koleksi" className="dt-usecase-cta">Pilih kartu NFC <ArrowUpRight size={16}/></a></div>
          </div>
          <p className="dt-usecase-disclaimer">Ilustrasi alur penggunaan. Tujuan akhir mengikuti tautan yang diatur pemilik kartu.</p>
        </div>
      </div>
    </section>
  );
}


function HomeMotionController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".dt-home-rebuild");
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("section, .dt-home-object-stage, .dt-collection-stage, .dt-behind-panel, .dt-closing-main"));
    const updateProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      root.style.setProperty("--home-scroll-progress", maxScroll > 0 ? String(window.scrollY / maxScroll * 100) + "%" : "0%");
    };
    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduced) return;
      const bounds = root.getBoundingClientRect();
      root.style.setProperty("--home-pointer-x", String(event.clientX - bounds.left) + "px");
      root.style.setProperty("--home-pointer-y", String(event.clientY - bounds.top) + "px");
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    root.addEventListener("pointermove", updatePointer, { passive: true });
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.classList.add("is-in-view"));
      return () => {
        window.removeEventListener("scroll", updateProgress);
        root.removeEventListener("pointermove", updatePointer);
      };
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -48px 0px" });
    targets.forEach((element) => {
      element.classList.add("dt-reveal");
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
      root.removeEventListener("pointermove", updatePointer);
    };
  }, []);

  return null;
}

function HeroProductObject() {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [connection, setConnection] = useState<"idle" | "nfc" | "qr">("idle");
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"activity" | "cards">("activity");
  const [tapCount, setTapCount] = useState(0);
  const handleMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -13, y: x * 16 });
  };
  const simulateNfc = () => {
    setConnection("nfc");
    setFlipped(false);
    setTapCount((count) => count + 1);
  };
  const simulateQr = () => {
    setConnection("qr");
    setFlipped(true);
  };
  return (
    <div className={"dt-home-object-stage" + (connection !== "idle" ? " is-connected" : "") + (connection === "nfc" ? " is-nfc-active" : connection === "qr" ? " is-qr-active" : "")} aria-label="Kartu NFC DiTapAja dan pratinjau dashboard interaktif">
      <div className="dt-home-stage-grid" aria-hidden="true"/>
      <div className="dt-home-object-shadow"/>
      <div className="dt-home-orbit dt-home-orbit-one"/><div className="dt-home-orbit dt-home-orbit-two"/>
      <div className="dt-home-signal"><span/><span/><span/><i><Wifi size={17}/></i></div>
      <div className="dt-home-stage-label"><i/> PRODUCT EXPERIENCE <span>01 / 03</span></div>
      <div className="dt-home-float-panel dt-home-float-analytics">
        <span className="dt-home-float-eyebrow"><i/> LIVE DASHBOARD PREVIEW</span>
        <strong>Insight <em>at a glance.</em></strong>
        <div className="dt-home-mini-chart" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
        <span className="dt-home-float-foot"><BarChart3 size={13}/> Aktivitas kartu dalam satu tempat</span>
      </div>
      <div className="dt-home-float-panel dt-home-float-scan">
        <span className="dt-home-float-icon">{connection === "qr" ? <QrCode size={16}/> : <Nfc size={16}/>}</span>
        <span><strong>{connection === "nfc" ? "NFC connected" : connection === "qr" ? "QR detected" : "Ready to connect"}</strong><small>{connection === "nfc" ? "Tap berhasil disimulasikan" : connection === "qr" ? "QR berhasil dipindai" : "Pilih cara untuk mencoba"}</small></span>
        <i/>
      </div>
      <div className="dt-home-card-halo" aria-hidden="true"/>
      <button type="button" className={"dt-home-object-card" + (flipped ? " is-flipped" : "")}
        onClick={() => setFlipped((value) => !value)}
        onPointerMove={handleMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        style={{ "--card-tilt-x": tilt.x + "deg", "--card-tilt-y": tilt.y + "deg" } as CSSProperties}
        aria-pressed={flipped}
        aria-label={flipped ? "Tampilkan sisi depan kartu" : "Balik kartu untuk melihat fitur NFC dan QR"}>
        <span className="dt-home-object-face dt-home-object-front">
          <span className="dt-home-object-brand"><BrandMark/> DITAPAJA <small>REVIEW CARD</small></span>
          <strong>YOUR<br/><em>review</em><br/>STARTS HERE.</strong>
          <span className="dt-home-object-bottom">NFC REVIEW CARD <span>QR READY</span></span>
        </span>
        <span className="dt-home-object-face dt-home-object-back">
          <span className="dt-home-object-brand"><BrandMark/> DITAPAJA · CONNECT</span>
          <span className="dt-home-object-qr"><QrCode size={74}/></span>
          <strong>ONE TAP.<br/><em>ONE SCAN.</em></strong>
          <span className="dt-home-object-bottom">NFC CHIP INSIDE <span>SCAN TO CONNECT</span></span>
        </span>
        <span className="dt-home-object-card-hint">{flipped ? "TAP TO VIEW FRONT" : "TAP TO FLIP"}</span>
      </button>
      <div className="dt-home-connection-path" aria-hidden="true"><span/><i/><span/></div>
      <div className="dt-home-object-controls" aria-label="Simulasi pengalaman kartu">
        <button type="button" className={connection === "nfc" ? "is-active" : ""} aria-pressed={connection === "nfc"} onClick={simulateNfc}><Nfc size={14}/> Simulasikan NFC</button>
        <button type="button" className={connection === "qr" ? "is-active" : ""} aria-pressed={connection === "qr"} onClick={simulateQr}><QrCode size={14}/> Scan QR</button>
        <button type="button" className={dashboardOpen ? "is-active" : ""} aria-expanded={dashboardOpen} onClick={() => setDashboardOpen((value) => !value)}><BarChart3 size={14}/> Dashboard</button>
      </div>
      {connection !== "idle" && <div className="dt-home-connection-toast" role="status"><span><Check size={13}/></span><div><strong>{connection === "nfc" ? "Tap berhasil!" : "QR berhasil dipindai!"}</strong><small>{connection === "nfc" ? "Ponsel siap membuka halaman tujuan." : "Kode QR membawa pelanggan ke tautan tujuan."}</small></div><button type="button" onClick={() => setConnection("idle")} aria-label="Tutup notifikasi">×</button></div>}
      {dashboardOpen && <div className="dt-home-dashboard-pop">
        <div className="dt-home-dashboard-top"><span>YOUR WORKSPACE</span><button type="button" onClick={() => setDashboardOpen(false)} aria-label="Tutup dashboard preview">×</button></div>
        <strong>Semua kartu, satu dashboard.</strong>
        <div className="dt-home-dashboard-tabs" role="tablist" aria-label="Dashboard preview"><button type="button" role="tab" aria-selected={dashboardTab === "activity"} className={dashboardTab === "activity" ? "is-active" : ""} onClick={() => setDashboardTab("activity")}>Aktivitas</button><button type="button" role="tab" aria-selected={dashboardTab === "cards"} className={dashboardTab === "cards" ? "is-active" : ""} onClick={() => setDashboardTab("cards")}>Kartu</button></div>
        {dashboardTab === "activity" ? <div className="dt-home-dashboard-data"><span><small>SIMULASI TAP</small><b>{tapCount}</b></span><span><small>STATUS</small><b>Aktif</b></span></div> : <div className="dt-home-dashboard-card-row"><Nfc size={16}/><span><b>Review Card</b><small>NFC + QR · Active</small></span><i/></div>}
        <small className="dt-home-dashboard-note">Pratinjau interaktif · data simulasi</small>
      </div>}
      <span className="dt-home-object-caption">A PHYSICAL TOUCHPOINT FOR YOUR BUSINESS · INTERACTIVE 3D</span>
    </div>
  );
}

export default function Home() {
  return <main className="dt-next-home dt-editorial-home dt-home-rebuild" id="top">
    <div className="dt-home-scroll-progress" aria-hidden="true"/>
    <HomeMotionController/>
    <SiteHeader/>

    <section className="ed-hero">
      <div className="ed-hero-grid">
        <div className="ed-hero-copy">
          <span className="home-kicker"><i/> NFC REVIEW CARD · DASHBOARD GRATIS</span>
          <h1>Good reviews.<br/><em>Made easier.</em></h1>
          <p className="ed-hero-lead">Bantu pelanggan menemukan halaman review bisnismu tanpa langkah yang berbelit. Satu tap atau scan, lalu mereka bisa langsung memberi ulasan.</p>
          <div className="ed-hero-actions">
            <a href="#koleksi" className="ed-button">Pilih kartu <ArrowUpRight size={17}/></a>
            <a href="#cara-kerja" className="ed-text-link">Lihat cara kerja <ArrowDownRight size={16}/></a>
          </div>
          <div className="home-hero-proof">
            <span><Nfc size={15}/> NFC + QR Code</span>
            <span><Check size={15}/> Tanpa aplikasi</span>
            <span><Check size={15}/> Tanpa biaya bulanan</span>
          </div>
        </div>

        <HeroProductObject/>
      </div>
    </section>

    <section className="nx-collection ed-collection" id="koleksi">
      <div className="ed-section-heading">
        <div><span className="home-section-index">THE COLLECTION</span><h2>Find your<br/>business <em>style.</em></h2></div>
        <p>Pilih tampilan yang paling cocok untuk bisnismu. Setiap kartu sudah dilengkapi NFC, QR Code, dan dashboard gratis.</p>
      </div>
      <ProductCarousel products={products}/>
    </section>

    <section className="dt-home-experience" id="pengalaman-nfc">
      <div className="dt-home-section-heading">
        <span>SEE HOW IT FEELS</span>
        <h2>One tap.<br/><em>A simpler journey.</em></h2>
        <p>Coba simulasi interaktif untuk melihat bagaimana kartu NFC membawa pelanggan ke halaman tujuan.</p>
      </div>
      <HeroTapDemo/>
    </section>

    <HowItWorks/>\n\n    <UseCaseExplorer/>

    <section className="home-dashboard-story dt-behind" id="behind-the-card">
      <div className="dt-behind-copy">
        <span className="home-section-index">BEHIND THE CARD</span>
        <h2>More than<br/><em>a card.</em></h2>
        <p className="dt-behind-intro">Satu dashboard sederhana untuk mengelola kartu, mengatur tujuan, dan melihat aktivitas pelanggan.</p>
        <div className="dt-behind-quick-points"><span><Check size={14}/> Kelola kartu</span><span><Check size={14}/> Atur link tujuan</span><span><Check size={14}/> Pantau aktivitas</span></div>
        <a className="ed-button" href="/login">Buka dashboard <ArrowUpRight size={17}/></a>
      </div>
      <div className="dt-behind-visual">
        <div className="dt-behind-panel">
          <div className="dt-behind-panel-top"><div className="dt-behind-brand"><BrandMark/><span>DITAPAJA <i>STUDIO</i></span></div><span className="dt-behind-preview-tag">DASHBOARD PREVIEW</span></div>
          <div className="dt-behind-panel-heading"><div><small>YOUR WORKSPACE</small><b>Overview<span>.</span></b></div><span className="dt-behind-period">LAST 30 DAYS</span></div>
          <div className="dt-behind-metrics"><div><span>CARD MANAGEMENT</span><b>Kelola kartu</b><small>Atur kartu dalam satu tempat</small></div><div><span>DESTINATION LINKS</span><b>Atur tujuan</b><small>Perbarui tautan kapan saja</small></div></div>
          <div className="dt-behind-card-line"><Nfc size={16}/><b>Noir — Main counter</b><span>ACTIVE</span></div>
          <p className="dt-behind-data-note">Illustrative dashboard data</p>
        </div>
      </div>
    </section>

    <section className="home-closing dt-closing">
      <div className="dt-closing-top"><span>START WITH ONE TAP</span><span>DITAPAJA®</span></div>
      <div className="dt-closing-main">
        <div><p className="dt-closing-eyebrow">MAKE IT EASY TO BE REMEMBERED.</p><h2>Turn every<br/><em>tap into trust.</em></h2></div>
        <div className="dt-closing-action"><p>Mulai dengan satu kartu NFC. Beri pelanggan cara yang lebih cepat untuk menemukan dan mengulas bisnismu.</p><a className="ed-button" href="/koleksi">Temukan kartu kamu <ArrowUpRight size={17}/></a></div>
      </div>
      <div className="dt-closing-bottom"><span>ONE TAP CLOSER TO A GOOD REVIEW.</span><span>NFC AND QR READY</span></div>
    </section>

    <footer className="dt-footer dt-footer-redesign">
      <div className="dt-footer-main">
        <div className="dt-footer-brand-col">
          <a href="/" className="dt-footer-brand"><BrandMark/><span>DiTap<span>Aja</span></span></a>
          <p>Alat sederhana untuk membantu pelanggan menemukan halaman review bisnismu. Satu tap, satu pengalaman yang lebih mudah.</p>
          <span className="dt-footer-built">MADE FOR BETTER CUSTOMER EXPERIENCES.</span>
        </div>
        <div className="dt-footer-links">
          <div><small>JELAJAHI</small><a href="/koleksi">Koleksi kartu</a><a href="/cara-kerja">Cara kerja</a><a href="/faq">Pertanyaan umum</a></div>
          <div><small>AKUN & BANTUAN</small><a href="/login">Dashboard pengguna</a><a href="/activate">Aktivasi kartu</a><a href="/kontak">Hubungi kami</a></div>
        </div>
        <a className="dt-footer-contact" href="https://wa.me/6281321778081" target="_blank" rel="noopener noreferrer">
          <span className="dt-footer-contact-icon"><MessageCircle size={19}/></span>
          <span><small>BUTUH BANTUAN?</small><strong>Let’s talk.</strong><em>Chat langsung melalui WhatsApp</em></span>
          <ArrowUpRight size={18}/>
        </a>
      </div>
      <div className="dt-footer-bottom"><span>DiTapAja. Dibuat untuk pengalaman pelanggan yang lebih baik.</span><a href="#top">Kembali ke atas</a><span>ONE TAP CLOSER TO A GOOD REVIEW.</span></div>
    </footer>
  </main>;
}
