import { useState, useEffect, useRef, useCallback } from "react";
import { ANIMALS, CATEGORIES, FEATURED_IDS } from "./animalData";
import MapView from "./MapView";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;

const imageCache = {};
async function fetchPexelsImage(animalName) {
  if (imageCache[animalName]) return imageCache[animalName];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(animalName + " animal")}&per_page=3&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    const url = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null;
    if (url) imageCache[animalName] = url;
    return url;
  } catch { return null; }
}

async function callGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages.map(m => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content })),
      max_tokens: 1200, temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const T = {
  bg: "#050b18", bgCard: "#0a1628", bgCardHover: "#0d1e36",
  primary: "#6c63ff", primaryLight: "#8b84ff", accent: "#00d4aa",
  accentWarm: "#ff6b6b", gold: "#ffd700", text: "#e2e8f0",
  textMuted: "#64748b", textSub: "#94a3b8",
  border: "rgba(108,99,255,0.15)", borderBright: "rgba(108,99,255,0.4)",
};

const CAT_COLORS = {
  dogs: "#ff6b6b", cats: "#ff9f7f", birds: "#6c63ff", fish: "#00d4aa",
  reptiles: "#4ecb71", "small-pets": "#ffd700", insects: "#c084fc",
  wild: "#fb923c", farm: "#84cc16", marine: "#22d3ee",
};

const TRENDING_IDS = [1, 17, 83, 37, 69, 88];

function formatMsg(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#6c63ff">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:#00d4aa">$1</em>')
    .replace(/\n/g, '<br/>');
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #050b18; color: #e2e8f0; font-family: 'DM Sans', sans-serif; min-height: 100vh; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #050b18; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #6c63ff, #00d4aa); border-radius: 4px; }
  ::selection { background: rgba(108,99,255,0.3); color: #fff; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.9} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes floatY { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
  @keyframes floatX { 0%,100%{transform:translateX(0px) rotate(0deg)} 50%{transform:translateX(10px) rotate(5deg)} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(108,99,255,0.4)} 50%{box-shadow:0 0 60px rgba(108,99,255,0.8), 0 0 100px rgba(0,212,170,0.3)} }
  @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes borderGlow { 0%,100%{border-color:rgba(108,99,255,0.3)} 50%{border-color:rgba(0,212,170,0.7)} }
  @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes slideInUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes scaleIn { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes neonPulse { 0%,100%{text-shadow:0 0 10px rgba(108,99,255,0.5)} 50%{text-shadow:0 0 30px rgba(108,99,255,1), 0 0 60px rgba(0,212,170,0.5)} }
  @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  @keyframes heartbeat { 0%,100%{transform:scale(1)} 25%{transform:scale(1.3)} 50%{transform:scale(1)} 75%{transform:scale(1.15)} }

  .fade-up { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-in { animation: fadeIn 0.4s ease both; }

  .card-3d {
    transition: transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease;
    transform-style: preserve-3d;
    will-change: transform;
  }
  .card-3d:hover {
    transform: translateY(-10px) rotateX(3deg) scale(1.01);
    box-shadow: 0 30px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(108,99,255,0.4), 0 0 50px rgba(108,99,255,0.15);
  }

  .cat-btn { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
  .cat-btn:hover { transform: translateY(-4px) scale(1.03); }
  .cat-btn:active { transform: scale(0.97); }

  .nav-link { transition: color 0.2s; cursor: pointer; }
  .nav-link:hover { color: #6c63ff !important; }

  .fav-btn { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
  .fav-btn:hover { transform: scale(1.15); }
  .fav-btn.active { animation: heartbeat 0.4s ease; }

  .search-glow:focus-within { box-shadow: 0 0 0 3px rgba(108,99,255,0.25), 0 20px 60px rgba(108,99,255,0.15); }

  .tag-pill { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); cursor: default; }
  .tag-pill:hover { transform: translateY(-2px) scale(1.05); }

  .care-card { transition: all 0.2s ease; }
  .care-card:hover { background: rgba(255,255,255,0.05) !important; transform: translateY(-2px); }

  .chat-msg { animation: fadeUp 0.3s ease; }

  .scroll-hide::-webkit-scrollbar { display: none; }
  .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .glow-text {
    background: linear-gradient(135deg, #fff 0%, #6c63ff 40%, #00d4aa 70%, #fff 100%);
    background-size: 300% 300%;
    animation: gradientShift 5s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .trending-badge {
    background: linear-gradient(135deg, #ff6b6b, #ffd700);
    color: #000;
    font-size: 9px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 50px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    animation: shimmer 2s ease infinite;
  }

  @media (max-width: 768px) {
    .hero-title { font-size: clamp(3rem, 14vw, 5rem) !important; letter-spacing: -2px !important; }
    .animal-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 12px !important; }
    .cat-grid { grid-template-columns: repeat(auto-fill, minmax(85px, 1fr)) !important; gap: 10px !important; }
    .section-pad { padding-left: 16px !important; padding-right: 16px !important; }
    .stat-row { gap: 20px !important; }
    .chat-panel { width: calc(100vw - 20px) !important; right: 10px !important; bottom: 80px !important; }
    .drawer { width: 100vw !important; border-radius: 24px 24px 0 0 !important; height: 92vh !important; top: auto !important; bottom: 0 !important; animation: slideInUp 0.4s cubic-bezier(0.16,1,0.3,1) !important; }
    .care-grid { grid-template-columns: 1fr !important; }
    .navbar-links { display: none !important; }
    .hero-search { font-size: 14px !important; }
  }
  @media (max-width: 480px) {
    .animal-grid { grid-template-columns: 1fr 1fr !important; }
    .stat-row { flex-wrap: wrap !important; justify-content: center !important; gap: 16px !important; }
  }
`;

// ── Floating Emojis ───────────────────────────────────────────────────────────
function FloatingEmojis() {
  const emojis = ["🐕", "🦁", "🦜", "🐠", "🦎", "🐹", "🦋", "🦊", "🐄", "🐬", "🦅", "🐆", "🦑", "🦔", "🐧"];
  const data = emojis.map((e, i) => ({
    e, size: 16 + (i * 7 % 20), left: (i / emojis.length) * 100 + (i * 3 % 5),
    top: (i * 17 % 100), opacity: 0.06 + (i * 0.005),
    dur1: 6 + (i * 1.3 % 8), delay1: (i * 0.7 % 4),
    dur2: 8 + (i * 0.9 % 6), delay2: (i * 0.5 % 3),
  }));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {data.map(({ e, size, left, top, opacity, dur1, delay1, dur2, delay2 }, i) => (
        <div key={i} style={{
          position: "absolute", fontSize: size,
          left: `${left}%`, top: `${top}%`, opacity,
          animation: `floatY ${dur1}s ease-in-out ${delay1}s infinite, floatX ${dur2}s ease-in-out ${delay2}s infinite`,
          filter: "blur(0.5px)",
        }}>{e}</div>
      ))}
    </div>
  );
}

// ── Mesh Gradient Background ──────────────────────────────────────────────────
function MeshBg() {
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none" }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="20%" cy="20%" r="50%">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g2" cx="80%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g3" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g1)" />
      <rect width="100%" height="100%" fill="url(#g2)" />
      <rect width="100%" height="100%" fill="url(#g3)" />
    </svg>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ favCount, onFavClick }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setShowMap(true);
    window.addEventListener('openMap', handler);
    return () => window.removeEventListener('openMap', handler);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      padding: "0 24px", height: 64,
      background: scrolled ? "rgba(5,11,24,0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(108,99,255,0.12)" : "none",
      transition: "all 0.3s ease",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 24, animation: "floatY 3s ease-in-out infinite" }}>🐾</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, background: "linear-gradient(135deg, #fff, #6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pawpedia</span>
      </div>
      <div className="navbar-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Animals", "Categories", "About"].map(l => (
          <span key={l} className="nav-link" style={{ fontSize: 14, color: T.textSub, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{l}</span>
        ))}
      </div>
      <button onClick={() => window.dispatchEvent(new Event('openMap'))} style={{
        background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)",
        borderRadius: 50, padding: "8px 16px", color: "#8b84ff",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
        fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, marginRight: 10,
      }}>🗺️ World Map</button>
      <button onClick={onFavClick} style={{
        background: favCount > 0 ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${favCount > 0 ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 50, padding: "8px 16px", color: favCount > 0 ? "#ff6b6b" : T.textSub,
        cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13,
        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, transition: "all 0.2s",
      }}>
        {favCount > 0 ? "❤️" : "🤍"} {favCount > 0 ? `${favCount} Saved` : "Favorites"}
      </button>

    </nav>
  );
}

// ── Marquee ticker ────────────────────────────────────────────────────────────
function AnimalTicker() {
  const items = ANIMALS.slice(0, 20).map(a => `${a.emoji} ${a.name}`);
  const text = items.join("  ·  ") + "  ·  " + items.join("  ·  ");
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(108,99,255,0.1)", borderBottom: "1px solid rgba(108,99,255,0.1)", padding: "10px 0", background: "rgba(108,99,255,0.03)" }}>
      <div style={{ whiteSpace: "nowrap", animation: "marquee 30s linear infinite", display: "inline-block" }}>
        <span style={{ fontSize: 13, color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>{text}</span>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ search, setSearch }) {
  const [typed, setTyped] = useState("");
  const placeholders = ["Search Golden Retriever…", "Search Snow Leopard…", "Search Axolotl…", "Search Macaw…", "Search Capybara…"];
  const idxRef = useRef(0);

  useEffect(() => {
    if (search) return;
    let i = 0, forward = true;
    const interval = setInterval(() => {
      const full = placeholders[idxRef.current];
      if (forward) { i++; setTyped(full.slice(0, i)); if (i >= full.length) forward = false; }
      else { i--; setTyped(full.slice(0, i)); if (i <= 0) { idxRef.current = (idxRef.current + 1) % placeholders.length; forward = true; } }
    }, forward ? 80 : 45);
    return () => clearInterval(interval);
  }, [search]);

  return (
    <header style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "120px 20px 80px", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse 100% 80% at 50% -5%, #0d1a3a 0%, #050b18 70%)",
    }}>
      <MeshBg />
      <FloatingEmojis />

      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(108,99,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.05) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, black 0%, transparent 85%)",
      }} />

      {/* Rotating ring */}
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        border: "1px solid rgba(108,99,255,0.06)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        animation: "rotateSlow 40s linear infinite", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        border: "1px solid rgba(0,212,170,0.05)",
        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        animation: "rotateSlow 25s linear infinite reverse", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 860, width: "100%" }}>
        {/* Badge */}
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)",
          borderRadius: 50, padding: "6px 18px", marginBottom: 32,
          animation: "fadeUp 0.6s ease both, borderGlow 3s ease infinite",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4aa", display: "inline-block", animation: "shimmer 1.5s ease infinite" }} />
          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>AI-POWERED ANIMAL ENCYCLOPEDIA</span>
        </div>

        {/* Title */}
        <h1 className="hero-title fade-up" style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(4rem, 13vw, 8.5rem)", lineHeight: 0.9,
          letterSpacing: "-4px", marginBottom: 24, animationDelay: "0.1s",
        }}>
          <span className="glow-text">PAW</span>
          <br />
          <span style={{ color: T.text, WebkitTextFillColor: T.text, background: "none", letterSpacing: "-4px" }}>PEDIA</span>
        </h1>

        {/* Subtitle */}
        <p className="fade-up" style={{
          fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)", color: T.textMuted,
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 52,
          fontFamily: "'JetBrains Mono', monospace", animationDelay: "0.2s",
        }}>
          Explore · Learn · Discover the Animal Kingdom
        </p>

        {/* Search */}
        <div className="fade-up search-glow" style={{
          position: "relative", maxWidth: 620, width: "100%", margin: "0 auto 56px",
          animationDelay: "0.3s", borderRadius: 50,
          transition: "box-shadow 0.3s ease",
        }}>
          <div style={{
            position: "absolute", inset: -1.5, borderRadius: 50,
            background: "linear-gradient(135deg, rgba(108,99,255,0.6), rgba(0,212,170,0.6))",
            filter: "blur(10px)", opacity: 0.7, zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", background: "rgba(10,22,40,0.97)", borderRadius: 50, border: "1.5px solid rgba(108,99,255,0.35)" }}>
            <span style={{ padding: "0 18px", fontSize: 18, opacity: 0.5, flexShrink: 0 }}>🔍</span>
            <input
              className="hero-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={typed || "Search animals…"}
              style={{
                flex: 1, background: "none", border: "none", padding: "18px 0",
                color: T.text, fontSize: 16, fontFamily: "'DM Sans', sans-serif", outline: "none",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ padding: "0 20px", background: "none", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>✕</button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-row fade-up" style={{ display: "flex", gap: 48, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.4s" }}>
          {[{ num: "105+", label: "Animals", icon: "🐾" }, { num: "10", label: "Categories", icon: "📚" }, { num: "AI", label: "Powered", icon: "✨" }, { num: "∞", label: "Curiosity", icon: "🔭" }].map(({ num, label, icon }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 800, background: "linear-gradient(135deg, #fff 30%, #6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: 10, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.35, animation: "floatY 2.5s ease-in-out infinite" }}>
        <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.textMuted, letterSpacing: "0.15em" }}>EXPLORE</span>
        <div style={{ width: 1, height: 44, background: "linear-gradient(180deg, #6c63ff, transparent)" }} />
      </div>
    </header>
  );
}

// ── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ children, sub, accent = "#6c63ff" }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.5rem)", color: T.text, lineHeight: 1.1, marginBottom: sub ? 10 : 0 }}>{children}</h2>
      {sub && <p style={{ color: T.textMuted, fontSize: 14, marginTop: 6 }}>{sub}</p>}
      <div style={{ width: 48, height: 3, marginTop: 14, background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: 2 }} />
    </div>
  );
}

// ── Category Browser ──────────────────────────────────────────────────────────
function CategoryBrowser({ active, setActive }) {
  return (
    <section className="section-pad" style={{ padding: "80px 40px 60px", maxWidth: 1300, margin: "0 auto" }}>
      <SectionTitle sub="Filter by what fascinates you">Browse by Category</SectionTitle>
      <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 14 }}>
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.id;
          const col = CAT_COLORS[cat.id] || T.primary;
          return (
            <button key={cat.id} onClick={() => setActive(cat.id)} className="cat-btn" style={{
              background: isActive ? `linear-gradient(160deg, ${col}20, ${col}08)` : "rgba(255,255,255,0.02)",
              border: isActive ? `1.5px solid ${col}80` : "1.5px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "20px 8px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              color: isActive ? col : T.textMuted, backdropFilter: "blur(10px)",
              boxShadow: isActive ? `0 8px 32px ${col}20, inset 0 0 20px ${col}06` : "none",
              position: "relative", overflow: "hidden",
            }}>
              {isActive && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${col}10, transparent)` }} />}
              <span style={{ fontSize: 32, display: "block", filter: isActive ? `drop-shadow(0 0 10px ${col})` : "none", transition: "filter 0.3s", position: "relative", zIndex: 1 }}>{cat.icon}</span>
              <span style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textAlign: "center", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.06em", position: "relative", zIndex: 1 }}>{cat.label}</span>
              {isActive && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "50%", height: 2, background: `linear-gradient(90deg, transparent, ${col}, transparent)`, borderRadius: 2 }} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Animal Card ───────────────────────────────────────────────────────────────
function AnimalCard({ animal, onClick, onFavorite, isFavorite }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const catColor = CAT_COLORS[animal.category] || T.primary;
  const catInfo = CATEGORIES.find((c) => c.id === animal.category);
  const isTrending = TRENDING_IDS.includes(animal.id);

  useEffect(() => {
    setImgLoading(true);
    fetchPexelsImage(animal.name).then((url) => { setImgSrc(url); setImgLoading(false); });
  }, [animal.name]);

  return (
    <article onClick={onClick} className="card-3d" style={{
      background: `linear-gradient(160deg, ${T.bgCard} 0%, #070f1f 100%)`,
      border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22,
      overflow: "hidden", cursor: "pointer", position: "relative",
    }}>
      {/* Image area */}
      <div style={{ position: "relative", height: 195, overflow: "hidden", background: "#080f20" }}>
        {imgLoading ? (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(90deg, ${T.bgCard}, #0d1e36, ${T.bgCard})`, backgroundSize: "200% 100%", animation: "shimmer 1.8s ease infinite" }} />
        ) : imgSrc ? (
          <>
            <img src={imgSrc} alt={animal.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)" }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 45%, #070f1f 100%)` }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${catColor}08, transparent 60%)` }} />
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, background: `linear-gradient(135deg, ${catColor}18, ${catColor}05)` }}>
            {animal.emoji}
          </div>
        )}

        {/* Top row */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ background: `${catColor}cc`, backdropFilter: "blur(10px)", color: "#fff", padding: "4px 11px", borderRadius: 50, fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>
              {catInfo?.icon} {catInfo?.label?.toUpperCase()}
            </span>
            {isTrending && <span className="trending-badge" style={{ width: "fit-content" }}>🔥 TRENDING</span>}
          </div>
          <button
            className={`fav-btn${isFavorite ? " active" : ""}`}
            onClick={(e) => { e.stopPropagation(); onFavorite(animal); }}
            style={{
              background: isFavorite ? "rgba(255,107,107,0.2)" : "rgba(5,11,24,0.75)",
              backdropFilter: "blur(10px)",
              border: `1px solid ${isFavorite ? "#ff6b6b" : "rgba(255,255,255,0.12)"}`,
              borderRadius: "50%", width: 36, height: 36, fontSize: 15,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: isFavorite ? "#ff6b6b" : "#64748b",
            }}
          >{isFavorite ? "♥" : "♡"}</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 4, lineHeight: 1.2 }}>{animal.name}</h3>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{animal.tagline}</p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {[["🌡️", animal.temp], ["⏳", animal.lifespan], ["📏", animal.size]].map(([icon, val]) => (
            <span key={val} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 9px", fontSize: 10, color: T.textSub, display: "flex", alignItems: "center", gap: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              {icon} {val}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {animal.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag-pill" style={{ background: `${catColor}12`, color: catColor, border: `1px solid ${catColor}28`, padding: "2px 9px", borderRadius: 50, fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Bottom glow line */}
      <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${catColor}40, transparent)`, opacity: 0.6 }} />
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: T.bgCard, border: "1px solid rgba(255,255,255,0.04)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ height: 195, background: `linear-gradient(90deg, ${T.bgCard}, #0d1e36, ${T.bgCard})`, backgroundSize: "200% 100%", animation: "shimmer 1.8s ease infinite" }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ height: 18, width: "55%", background: "#0d1e36", borderRadius: 8, marginBottom: 10, animation: "shimmer 1.8s ease infinite" }} />
        <div style={{ height: 12, width: "85%", background: "#0a1628", borderRadius: 6, marginBottom: 5, animation: "shimmer 1.8s ease infinite 0.1s" }} />
        <div style={{ height: 12, width: "65%", background: "#0a1628", borderRadius: 6, marginBottom: 14, animation: "shimmer 1.8s ease infinite 0.2s" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {[55, 65, 50].map((w, i) => <div key={i} style={{ height: 22, width: w, background: "#0d1e36", borderRadius: 8, animation: `shimmer 1.8s ease ${i * 0.1}s infinite` }} />)}
        </div>
      </div>
    </div>
  );
}

// ── Featured Section ──────────────────────────────────────────────────────────
function FeaturedSection({ onSelect, onFavorite, favorites }) {
  const featured = ANIMALS.filter((a) => FEATURED_IDS.includes(a.id));
  return (
    <section className="section-pad" style={{ padding: "0 40px 80px", maxWidth: 1300, margin: "0 auto" }}>
      <SectionTitle sub="Hand-picked extraordinary creatures" accent="#00d4aa">Featured Animals</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {featured.map((a, i) => (
          <div key={a.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <AnimalCard animal={a} onClick={() => onSelect(a)} onFavorite={onFavorite} isFavorite={!!favorites.find(f => f.id === a.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Favorites Modal ───────────────────────────────────────────────────────────
function FavoritesPanel({ favorites, onSelect, onFavorite, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, backdropFilter: "blur(12px)", animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        background: T.bgCard, border: "1px solid rgba(108,99,255,0.2)", borderRadius: 26,
        width: "min(900px, 92vw)", maxHeight: "80vh", overflow: "auto",
        padding: 32, animation: "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <SectionTitle accent="#ff6b6b">❤️ Saved Animals</SectionTitle>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 40, height: 40, color: T.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>🤍</div>
            <p style={{ color: T.textMuted }}>No favorites yet! Click ♡ on any animal card.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {favorites.map((a) => (
              <AnimalCard key={a.id} animal={a} onClick={() => { onSelect(a); onClose(); }} onFavorite={onFavorite} isFavorite={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Animal Grid ───────────────────────────────────────────────────────────────
function AnimalGrid({ animals, onSelect, category, onFavorite, favorites }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, [category, animals.length]);

  const catLabel = category === "all" ? "All Animals" : CATEGORIES.find((c) => c.id === category)?.label || "Animals";
  const catColor = CAT_COLORS[category] || T.primary;

  return (
    <section className="section-pad" style={{ padding: "0 40px 100px", maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
        <SectionTitle accent={catColor}>{catLabel}</SectionTitle>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
          <span style={{ background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.2)", color: T.primaryLight, padding: "7px 18px", borderRadius: 50, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{animals.length} results</span>
        </div>
      </div>

      {animals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px 20px", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <p style={{ color: T.textMuted, fontSize: 16 }}>No animals found.</p>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>Try a different search or category.</p>
        </div>
      ) : (
        <div className="animal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {!ready
            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : animals.map((a, i) => (
              <div key={a.id} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}>
                <AnimalCard animal={a} onClick={() => onSelect(a)} onFavorite={onFavorite} isFavorite={!!favorites.find(f => f.id === a.id)} />
              </div>
            ))
          }
        </div>
      )}
    </section>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailModal({ animal, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const catColor = CAT_COLORS[animal.category] || T.primary;

  useEffect(() => { fetchPexelsImage(animal.name).then(setImgSrc); }, [animal.name]);

  const fetchDetails = useCallback(async () => {
    setLoading(true); setError(null); setContent(null);
    try {
      const prompt = `For "${animal.name}" (${animal.category}), return ONLY valid JSON:\n{"personality":"...","diet":"...","water":"...","temperature":"...","exercise":"...","grooming":"...","health":"...","social":"...","habitat":"...","india_tip":"...","fun_fact":"..."}`;
      const resp = await callGroq([
        { role: "system", content: "You are an expert animal encyclopedia. Respond ONLY with valid JSON. No markdown." },
        { role: "user", content: prompt }
      ]);
      const match = resp.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON");
      setContent(JSON.parse(match[0]));
    } catch { setError("Couldn't load details. Please retry."); }
    finally { setLoading(false); }
  }, [animal]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const careItems = content ? [
    ["🍽️", "Diet", content.diet], ["💧", "Water", content.water],
    ["🌡️", "Temperature", content.temperature], ["🏃", "Exercise", content.exercise],
    ["✂️", "Grooming", content.grooming], ["🏥", "Health", content.health],
    ["🤝", "Social", content.social], ["🏠", "Habitat", content.habitat],
  ] : [];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, backdropFilter: "blur(14px)", animation: "fadeIn 0.2s ease", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} className="drawer" style={{
        width: "min(580px, 100vw)", height: "100vh", overflow: "auto",
        background: `linear-gradient(170deg, #080f1e, ${T.bg})`,
        borderLeft: `1px solid ${catColor}20`,
        boxShadow: `-60px 0 120px rgba(0,0,0,0.7), inset 1px 0 0 ${catColor}15`,
        animation: "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Hero */}
        <div style={{ position: "relative", height: 320, flexShrink: 0, overflow: "hidden" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={animal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, background: `linear-gradient(135deg, ${catColor}20, transparent)` }}>{animal.emoji}</div>
          )}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, #080f1e 0%, rgba(8,15,30,0.2) 60%, transparent 100%)` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${catColor}05, transparent)` }} />

          {/* Controls */}
          <button onClick={onClose} style={{
            position: "absolute", top: 18, right: 18,
            background: "rgba(5,11,24,0.85)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%",
            width: 44, height: 44, color: T.text, fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}>✕</button>

          {/* Category badge */}
          <div style={{ position: "absolute", top: 18, left: 18 }}>
            <span style={{ background: `${catColor}22`, backdropFilter: "blur(12px)", border: `1px solid ${catColor}40`, color: catColor, padding: "6px 14px", borderRadius: 50, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
              {CATEGORIES.find(c => c.id === animal.category)?.icon} {CATEGORIES.find(c => c.id === animal.category)?.label?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px 48px" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 34, color: T.text, marginBottom: 6, lineHeight: 1.1 }}>{animal.name}</h2>
          <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 20, fontStyle: "italic", lineHeight: 1.6 }}>{animal.tagline}</p>

          {/* Quick stats row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            {[["🌡️", animal.temp], ["⏳", animal.lifespan], ["📏", animal.size], ["🌍", animal.origin]].map(([ic, v]) => (
              <span key={v} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 50, fontSize: 12, color: T.textSub, fontFamily: "'JetBrains Mono', monospace" }}>{ic} {v}</span>
            ))}
          </div>

          {/* Gradient divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${catColor}60, transparent)`, marginBottom: 24 }} />

          {loading && (
            <div style={{ textAlign: "center", padding: 64 }}>
              <div style={{ width: 44, height: 44, border: `2px solid ${catColor}25`, borderTopColor: catColor, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.08em" }}>LOADING ANIMAL DATA…</p>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: 16, padding: 24, textAlign: "center" }}>
              <p style={{ color: "#ff6b6b", marginBottom: 14, fontSize: 14 }}>{error}</p>
              <button onClick={fetchDetails} style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}aa)`, color: "#000", border: "none", borderRadius: 50, padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Retry</button>
            </div>
          )}

          {content && (
            <>
              {/* Personality */}
              <div style={{ background: `linear-gradient(135deg, ${catColor}10, transparent)`, border: `1px solid ${catColor}22`, borderRadius: 18, padding: 22, marginBottom: 22 }}>
                <div style={{ color: catColor, fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>🧠 Personality & Temperament</div>
                <p style={{ color: T.textSub, lineHeight: 1.8, fontSize: 14 }}>{content.personality}</p>
              </div>

              {/* Care guide label */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: T.text, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.06em" }}>Complete Care Guide</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              </div>

              <div className="care-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                {careItems.map(([icon, label, text]) => (
                  <div key={label} className="care-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
                    <div style={{ fontSize: 11, color: catColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{icon} {label}</div>
                    <p style={{ fontSize: 12.5, color: T.textSub, lineHeight: 1.65 }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* India tip */}
              <div style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.07), transparent)", border: "1px solid rgba(255,215,0,0.18)", borderRadius: 16, padding: 18, marginBottom: 14 }}>
                <div style={{ color: T.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>🇮🇳 India Care Tip</div>
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{content.india_tip}</p>
              </div>

              {/* Fun fact */}
              <div style={{ background: `linear-gradient(135deg, ${catColor}07, transparent)`, border: `1px solid ${catColor}18`, borderRadius: 16, padding: 18 }}>
                <div style={{ color: catColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>✨ Fun Fact</div>
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.7 }}>{content.fun_fact}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────
function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "👋 Hey! I'm **Paw AI** — your animal expert. Ask me anything about any animal, care tips, India-specific advice, or cool facts! 🐾" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput(""); setError(null);
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await callGroq([
        { role: "system", content: "You are Paw AI, a friendly expert animal encyclopedia assistant. Give accurate, engaging answers. Mention India-specific tips when relevant. Keep under 200 words unless asked more." },
        ...newMessages.filter((_, i) => i !== 0).map(m => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content }))
      ]);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch { setError("Couldn't connect. Check your API key."); }
    finally { setLoading(false); }
  };

  return (
    <div className="chat-panel" style={{
      position: "fixed", bottom: 90, right: 24,
      width: "min(400px, calc(100vw - 48px))", height: 550,
      background: T.bgCard, border: "1px solid rgba(108,99,255,0.2)",
      borderRadius: 26, zIndex: 999, display: "flex", flexDirection: "column",
      overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,99,255,0.08)",
      animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, rgba(108,99,255,0.08), rgba(0,212,170,0.04))", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "pulseGlow 3s ease infinite" }}>🐾</div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10, borderRadius: "50%", background: "#00d4aa", border: `2px solid ${T.bgCard}`, animation: "shimmer 2s ease infinite" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: T.text, fontSize: 15 }}>Paw AI</div>
          <div style={{ fontSize: 11, color: T.accent, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>● Animal Expert · Always Ready</div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "50%", width: 32, height: 32, color: T.textMuted, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
          onMouseEnter={e => e.target.style.color = T.text}
          onMouseLeave={e => e.target.style.color = T.textMuted}
        >✕</button>
      </div>

      {/* Messages */}
      <div className="scroll-hide" style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} className="chat-msg" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>🐾</div>
            )}
            <div style={{
              maxWidth: "78%", padding: "10px 15px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              background: m.role === "user" ? "linear-gradient(135deg, #6c63ff, #4a42dd)" : "rgba(255,255,255,0.04)",
              border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.07)",
              color: m.role === "user" ? "#fff" : T.textSub, fontSize: 13, lineHeight: 1.65,
            }} dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🐾</div>
            <div style={{ display: "flex", gap: 5, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "4px 18px 18px 18px", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: T.primary, animation: `floatY 0.9s ease ${i * 0.18}s infinite` }} />)}
            </div>
          </div>
        )}
        {error && <p style={{ color: "#ff6b6b", fontSize: 11, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, flexShrink: 0 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about any animal…"
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "10px 18px", color: T.text, fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s" }}
          onFocus={(e) => e.target.style.borderColor = "rgba(108,99,255,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          background: input.trim() && !loading ? "linear-gradient(135deg, #6c63ff, #4a42dd)" : "rgba(255,255,255,0.05)",
          border: "none", borderRadius: "50%", width: 44, height: 44,
          color: input.trim() && !loading ? "#fff" : T.textMuted,
          fontSize: 16, cursor: input.trim() && !loading ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0,
          boxShadow: input.trim() && !loading ? "0 4px 20px rgba(108,99,255,0.4)" : "none",
        }}>➤</button>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 40px", background: "linear-gradient(180deg, transparent, rgba(108,99,255,0.03))" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 40, animation: "floatY 3s ease-in-out infinite" }}>🐾</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, background: "linear-gradient(135deg, #fff, #6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pawpedia</span>
        </div>
        <p style={{ color: T.textMuted, fontSize: 14, textAlign: "center", maxWidth: 400, lineHeight: 1.7 }}>
          Built with ❤️ by <span style={{ color: T.primary, fontWeight: 700 }}>Shubham</span>
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {["105+ Animals", "10 Categories", "AI Powered", "Free Forever"].map(t => (
            <span key={t} style={{ background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.15)", color: T.textMuted, padding: "5px 14px", borderRadius: 50, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.1)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>© {new Date().getFullYear()} Shubham · Pawpedia · All Rights Reserved</p>
      </div>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [favorites, setFavorites] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [showFavorites, setShowFavorites] = useState(false);

  const toggleFavorite = (animal) => setFavorites(prev =>
    prev.find(a => a.id === animal.id) ? prev.filter(a => a.id !== animal.id) : [...prev, animal]
  );

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const filteredAnimals = ANIMALS.filter((a) => {
    const matchCat = category === "all" || a.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
      || a.tagline.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const handleCategoryChange = (catId) => {
    setCategory(catId);
    document.getElementById("grid-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <Navbar favCount={favorites.length} onFavClick={() => setShowFavorites(true)} />


      <Hero search={search} setSearch={setSearch} />
      <AnimalTicker />
      {!search && <FeaturedSection onSelect={setSelectedAnimal} onFavorite={toggleFavorite} favorites={favorites} />}
      <CategoryBrowser active={category} setActive={handleCategoryChange} />
      <div id="grid-section">
        <AnimalGrid animals={filteredAnimals} onSelect={setSelectedAnimal} category={category} onFavorite={toggleFavorite} favorites={favorites} />
      </div>

      <Footer />


      {/* Chat button */}
      <button onClick={() => setChatOpen(!chatOpen)} style={{
        position: "fixed", bottom: 24, right: 24, width: 62, height: 62,
        background: chatOpen ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #6c63ff, #00d4aa)",
        border: "none", borderRadius: "50%", fontSize: 26, cursor: "pointer",
        zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: chatOpen ? "none" : "0 8px 40px rgba(108,99,255,0.5)",
        animation: chatOpen ? "none" : "pulseGlow 3s ease infinite",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.12) rotate(8deg)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}
      >
        <span style={{ transition: "transform 0.3s", transform: chatOpen ? "rotate(45deg)" : "rotate(0deg)", display: "block" }}>
          {chatOpen ? "✕" : "🐾"}
        </span>
      </button>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      {selectedAnimal && <DetailModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />}
      {showFavorites && <FavoritesPanel favorites={favorites} onSelect={setSelectedAnimal} onFavorite={toggleFavorite} onClose={() => setShowFavorites(false)} />}
      {showMap && <MapView onSelectAnimal={(a) => { setSelectedAnimal(a); setShowMap(false); }} onClose={() => setShowMap(false)} />}
    </div>
  );
}