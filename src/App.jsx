import { useState, useEffect, useRef, useCallback } from "react";
import { ANIMALS, CATEGORIES, FEATURED_IDS } from "./animalData";

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;

const imageCache = {};

async function fetchPexelsImage(animalName) {
  if (imageCache[animalName]) return imageCache[animalName];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(animalName + " animal pet wildlife")}&per_page=1&orientation=landscape`,);
    const data = await res.json();
    const url = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null; return url;
  } catch {
    return null;
  }
}

async function callGroq(messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages.map(m => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: m.content,
      })),
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`API error ${res.status}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

const T = {
  bg: "#050b18",
  bgCard: "#0a1628",
  bgCardHover: "#0d1e36",
  primary: "#6c63ff",
  primaryLight: "#8b84ff",
  accent: "#00d4aa",
  accentWarm: "#ff6b6b",
  gold: "#ffd700",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textSub: "#94a3b8",
  border: "rgba(108,99,255,0.15)",
  borderBright: "rgba(108,99,255,0.4)",
  glass: "rgba(10,22,40,0.8)",
};

const CAT_COLORS = {
  dogs: "#ff6b6b", cats: "#ff9f7f", birds: "#6c63ff", fish: "#00d4aa",
  reptiles: "#4ecb71", "small-pets": "#ffd700", insects: "#c084fc",
  wild: "#fb923c", farm: "#84cc16", marine: "#22d3ee",
};

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
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #050b18; }
  ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #6c63ff, #00d4aa); border-radius: 3px; }
  ::selection { background: rgba(108,99,255,0.3); color: #fff; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(108,99,255,0.3)} 50%{box-shadow:0 0 50px rgba(108,99,255,0.7), 0 0 80px rgba(0,212,170,0.3)} }
  @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes borderGlow { 0%,100%{border-color:rgba(108,99,255,0.3)} 50%{border-color:rgba(0,212,170,0.6)} }
  @keyframes countUp { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
  .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-in { animation: fadeIn 0.4s ease both; }
  .card-3d { transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease; transform-style: preserve-3d; }
  .card-3d:hover { transform: translateY(-8px) rotateX(2deg); box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.3), 0 0 40px rgba(108,99,255,0.1); }
  .cat-btn { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; }
  .cat-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.1)); opacity: 0; transition: opacity 0.25s; }
  .cat-btn:hover::before { opacity: 1; }
  .cat-btn:hover { transform: translateY(-3px); }
  .cat-btn:active { transform: translateY(0); }
  .glow-text { background: linear-gradient(135deg, #fff 0%, #6c63ff 50%, #00d4aa 100%); background-size: 200% 200%; animation: gradientShift 4s ease infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .search-input:focus { outline: none; }
  .tag-pill { transition: all 0.2s; }
  .tag-pill:hover { transform: scale(1.05); }
  @media (max-width: 768px) {
    .hero-title { font-size: clamp(2.5rem, 10vw, 4rem) !important; }
    .hero-sub { font-size: 0.85rem !important; }
    .stat-grid { gap: 20px !important; }
    .cat-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)) !important; }
    .animal-grid { grid-template-columns: 1fr !important; }
    .modal-inner { border-radius: 20px 20px 0 0 !important; }
    .care-grid { grid-template-columns: 1fr !important; }
    .chat-panel { width: calc(100vw - 20px) !important; right: 10px !important; }
  }
  @media (max-width: 480px) {
    .hero-search { padding: 14px 16px 14px 48px !important; font-size: 14px !important; }
    .section-pad { padding-left: 16px !important; padding-right: 16px !important; }
  }
`;

function Hero({ search, setSearch }) {
  const [typed, setTyped] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const placeholders = ["Search Golden Retriever…", "Search Snow Leopard…", "Search Axolotl…", "Search Macaw…", "Search Capybara…"];

  useEffect(() => {
    if (search) return;
    let i = 0;
    let forward = true;
    let current = 0;
    const interval = setInterval(() => {
      const full = placeholders[current];
      if (forward) {
        i++;
        setTyped(full.slice(0, i));
        if (i >= full.length) { forward = false; }
      } else {
        i--;
        setTyped(full.slice(0, i));
        if (i <= 0) {
          current = (current + 1) % placeholders.length;
          forward = true;
          setPlaceholderIdx(current);
        }
      }
    }, forward ? 80 : 40);
    return () => clearInterval(interval);
  }, [search]);

  return (
    <header style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "100px 20px 80px", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse 100% 70% at 50% 0%, #0d1a3a 0%, #050b18 65%)",
    }}>
      {[
        { size: 500, color: "rgba(108,99,255,0.08)", x: "-15%", y: "-20%", dur: 8 },
        { size: 400, color: "rgba(0,212,170,0.06)", x: "70%", y: "10%", dur: 11 },
        { size: 600, color: "rgba(108,99,255,0.05)", x: "20%", y: "60%", dur: 14 },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%", background: o.color,
          filter: "blur(80px)", width: o.size, height: o.size,
          left: o.x, top: o.y, pointerEvents: "none",
          animation: `floatY ${o.dur}s ease-in-out infinite`,
          animationDelay: `${i * 2}s`,
        }} />
      ))}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 80%)",
      }} />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 800, width: "100%" }}>
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.3)",
          borderRadius: 50, padding: "6px 18px", marginBottom: 28,
          animation: "fadeUp 0.6s ease both, borderGlow 3s ease infinite",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4aa", display: "inline-block", animation: "shimmer 1.5s ease infinite" }} />
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>AI-POWERED ENCYCLOPEDIA</span>
        </div>
        <h1 className="hero-title" style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "clamp(3.5rem, 11vw, 7.5rem)", lineHeight: 0.95,
          letterSpacing: "-3px", marginBottom: 20, animation: "fadeUp 0.7s 0.1s ease both",
        }}>
          <span className="glow-text">PAW</span>
          <br />
          <span style={{ color: T.text, WebkitTextFillColor: T.text, background: "none" }}>PEDIA</span>
        </h1>
        <p className="hero-sub" style={{
          fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", color: T.textSub,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 48,
          fontFamily: "'JetBrains Mono', monospace", animation: "fadeUp 0.7s 0.2s ease both",
        }}>
          Explore · Learn · Discover the Animal Kingdom
        </p>
        <div className="fade-up" style={{ position: "relative", maxWidth: 600, width: "100%", margin: "0 auto 52px", animationDelay: "0.3s" }}>
          <div style={{
            position: "absolute", inset: -1, borderRadius: 50,
            background: "linear-gradient(135deg, rgba(108,99,255,0.5), rgba(0,212,170,0.5))",
            filter: "blur(8px)", opacity: 0.6, zIndex: 0,
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", fontSize: 18, zIndex: 2 }}>🔍</span>
            <input
              className="hero-search search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={typed || "Search animals…"}
              style={{
                width: "100%", padding: "18px 24px 18px 56px",
                background: "rgba(10,22,40,0.95)", border: "1.5px solid rgba(108,99,255,0.3)",
                borderRadius: 50, color: T.text, fontSize: 16, outline: "none",
                backdropFilter: "blur(20px)", fontFamily: "'DM Sans', sans-serif",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "rgba(108,99,255,0.7)"; e.target.style.boxShadow = "0 0 0 4px rgba(108,99,255,0.12)"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(108,99,255,0.3)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>
        <div className="stat-grid fade-up" style={{ display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.4s" }}>
          {[{ num: "105+", label: "Animals", icon: "🐾" }, { num: "10", label: "Categories", icon: "📚" }, { num: "AI", label: "Powered", icon: "✨" }, { num: "∞", label: "Curiosity", icon: "🔭" }].map(({ num, label, icon }) => (
            <div key={label} style={{ textAlign: "center", animation: "countUp 0.6s ease both" }}>
              <div style={{ fontSize: 12, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #fff, #6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
              <div style={{ fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.4, animation: "floatY 2s ease-in-out infinite" }}>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: T.textMuted, letterSpacing: "0.1em" }}>SCROLL</span>
        <div style={{ width: 1, height: 40, background: "linear-gradient(180deg, #6c63ff, transparent)" }} />
      </div>
    </header>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", color: T.text, lineHeight: 1.1, marginBottom: sub ? 10 : 0 }}>{children}</h2>
      {sub && <p style={{ color: T.textMuted, fontSize: 14 }}>{sub}</p>}
      <div style={{ width: 40, height: 3, marginTop: 14, background: "linear-gradient(90deg, #6c63ff, #00d4aa)", borderRadius: 2 }} />
    </div>
  );
}

function CategoryBrowser({ active, setActive }) {
  return (
    <section className="section-pad" style={{ padding: "80px 40px 60px", maxWidth: 1300, margin: "0 auto" }}>
      <SectionTitle sub="Filter by what you love">Browse by Category</SectionTitle>
      <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 14 }}>
        {CATEGORIES.map((cat, i) => {
          const isActive = active === cat.id;
          const col = CAT_COLORS[cat.id] || T.primary;
          return (
            <button key={cat.id} onClick={() => setActive(cat.id)} className="cat-btn" style={{
              background: isActive ? `linear-gradient(135deg, ${col}22, ${col}11)` : "rgba(255,255,255,0.02)",
              border: isActive ? `1.5px solid ${col}` : "1.5px solid rgba(255,255,255,0.06)",
              borderRadius: 18, padding: "20px 10px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              color: isActive ? col : T.textMuted, backdropFilter: "blur(10px)",
              boxShadow: isActive ? `0 0 20px ${col}25, inset 0 0 20px ${col}08` : "none",
            }}>
              <span style={{ fontSize: 30, display: "block", filter: isActive ? "drop-shadow(0 0 8px currentColor)" : "none", transition: "filter 0.3s" }}>{cat.icon}</span>
              <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textAlign: "center", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat.label}</span>
              {isActive && <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 2, background: col, borderRadius: "2px 2px 0 0" }} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AnimalCard({ animal, onClick, onFavorite, isFavorite }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const catColor = CAT_COLORS[animal.category] || T.primary;
  const catInfo = CATEGORIES.find((c) => c.id === animal.category);

  useEffect(() => {
    setImgLoading(true);
    fetchPexelsImage(animal.name).then((url) => { setImgSrc(url); setImgLoading(false); });
  }, [animal.name]);

  return (
    <article onClick={onClick} className="card-3d" style={{
      background: `linear-gradient(160deg, ${T.bgCard}, ${T.bg})`,
      border: "1px solid rgba(255,255,255,0.06)", borderRadius: 22,
      overflow: "hidden", cursor: "pointer", position: "relative",
    }}>
      <div style={{ position: "relative", height: 200, overflow: "hidden", background: "#080f20" }}>
        {imgLoading ? (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(90deg, ${T.bgCard}, ${T.bgCardHover}, ${T.bgCard})`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        ) : imgSrc ? (
          <>
            <img src={imgSrc} alt={animal.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)" }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 50%, ${T.bgCard} 100%)` }} />
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, background: `linear-gradient(135deg, ${catColor}15, ${catColor}05)` }}>{animal.emoji}</div>
        )}
        <span style={{ position: "absolute", top: 14, right: 14, background: `${catColor}dd`, backdropFilter: "blur(8px)", color: "#fff", padding: "4px 12px", borderRadius: 50, fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{catInfo?.icon} {catInfo?.label?.toUpperCase()}</span>
        <button onClick={(e) => { e.stopPropagation(); onFavorite(animal); }} style={{
          position: "absolute", top: 14, left: 14, background: "rgba(5,11,24,0.7)", backdropFilter: "blur(8px)",
          border: `1px solid ${isFavorite ? "#ff6b6b" : "rgba(255,255,255,0.1)"}`, borderRadius: "50%",
          width: 36, height: 36, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s", color: isFavorite ? "#ff6b6b" : "#64748b",
        }}>{isFavorite ? "♥" : "♡"}</button>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: T.text, marginBottom: 5, lineHeight: 1.2 }}>{animal.name}</h3>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>{animal.tagline}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {[["🌡️", animal.temp], ["⏳", animal.lifespan], ["📏", animal.size]].map(([icon, val]) => (
            <span key={val} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: T.textSub, display: "flex", alignItems: "center", gap: 4, fontFamily: "'JetBrains Mono', monospace" }}>{icon} {val}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {animal.tags.map((t) => (
            <span key={t} className="tag-pill" style={{ background: `${catColor}14`, color: catColor, border: `1px solid ${catColor}30`, padding: "3px 10px", borderRadius: 50, fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: T.bgCard, border: "1px solid rgba(255,255,255,0.04)", borderRadius: 22, overflow: "hidden" }}>
      <div style={{ height: 200, background: `linear-gradient(90deg, ${T.bgCard}, ${T.bgCardHover}, ${T.bgCard})`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      <div style={{ padding: 20 }}>
        {[["60%", 18], ["80%", 12], ["40%", 10]].map(([w, h], i) => (
          <div key={i} style={{ height: h, width: w, background: T.bgCardHover, borderRadius: 8, marginBottom: 12, animation: "shimmer 1.5s infinite", animationDelay: `${i * 0.1}s` }} />
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          {[60, 70, 55].map((w, i) => <div key={i} style={{ height: 22, width: w, background: T.bgCardHover, borderRadius: 50, animation: "shimmer 1.5s infinite", animationDelay: `${i * 0.1}s` }} />)}
        </div>
      </div>
    </div>
  );
}

function FeaturedSection({ onSelect, onFavorite, favorites }) {
  const featured = ANIMALS.filter((a) => FEATURED_IDS.includes(a.id));
  return (
    <section className="section-pad" style={{ padding: "0 40px 80px", maxWidth: 1300, margin: "0 auto" }}>
      <SectionTitle sub="Hand-picked for you">Featured Animals</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 22 }}>
        {featured.map((a, i) => (
          <div key={a.id} className="fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <AnimalCard animal={a} onClick={() => onSelect(a)} onFavorite={onFavorite} isFavorite={favorites.find(f => f.id === a.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}

function AnimalGrid({ animals, onSelect, category, onFavorite, favorites }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(false); const t = setTimeout(() => setReady(true), 500); return () => clearTimeout(t); }, [category, animals.length]);
  const catLabel = category === "all" ? "All Animals" : CATEGORIES.find((c) => c.id === category)?.label || "Animals";
  return (
    <section className="section-pad" style={{ padding: "0 40px 100px", maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 40 }}>
        <SectionTitle>{catLabel}</SectionTitle>
        <span style={{ background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", color: T.primaryLight, padding: "8px 20px", borderRadius: 50, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", alignSelf: "flex-start", marginTop: 4 }}>{animals.length} results</span>
      </div>
      {animals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "100px 20px", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <p style={{ color: T.textMuted, fontSize: 16 }}>No animals found.</p>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 6 }}>Try a different search term or category.</p>
        </div>
      ) : (
        <div className="animal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 22 }}>
          {!ready ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : animals.map((a, i) => (
            <div key={a.id} className="fade-up" style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s` }}>
              <AnimalCard animal={a} onClick={() => onSelect(a)} onFavorite={onFavorite} isFavorite={favorites.find(f => f.id === a.id)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailModal({ animal, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => { fetchPexelsImage(animal.name).then(setImgSrc); }, [animal.name]);

  const fetchDetails = useCallback(async () => {
    setLoading(true); setError(null); setContent(null);
    try {
      const prompt = `For "${animal.name}" (${animal.category}), return ONLY valid JSON, no markdown:\n{"personality":"...","diet":"...","water":"...","temperature":"...","exercise":"...","grooming":"...","health":"...","social":"...","habitat":"...","india_tip":"...","fun_fact":"..."}`;
      const resp = await callGroq([
        { role: "system", content: "Expert animal encyclopedia. Respond ONLY with valid JSON. No markdown, no code blocks." },
        { role: "user", content: prompt }
      ]);
      const jsonMatch = resp.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON");
      setContent(JSON.parse(jsonMatch[0]));
    } catch { setError("Couldn't load details. Please retry."); }
    finally { setLoading(false); }
  }, [animal]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const catColor = CAT_COLORS[animal.category] || T.primary;
  const careItems = content ? [
    ["🍽️", "Diet", content.diet], ["💧", "Water", content.water],
    ["🌡️", "Temperature", content.temperature], ["🏃", "Exercise", content.exercise],
    ["✂️", "Grooming", content.grooming], ["🏥", "Health", content.health],
    ["🤝", "Social", content.social], ["🏠", "Habitat", content.habitat],
  ] : [];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(12px)", animation: "fadeIn 0.2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} className="modal-inner" style={{
        background: `linear-gradient(160deg, ${T.bgCard}, ${T.bg})`, border: `1px solid ${catColor}30`,
        borderRadius: 26, maxWidth: 780, width: "100%", maxHeight: "90vh", overflow: "auto",
        animation: "fadeUp 0.35s cubic-bezier(0.16,1,0.3,1)", boxShadow: `0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px ${catColor}20`,
      }}>
        <div style={{ position: "relative", height: 300, overflow: "hidden", borderRadius: "26px 26px 0 0" }}>
          {imgSrc ? <img src={imgSrc} alt={animal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100, background: `linear-gradient(135deg, ${catColor}20, transparent)` }}>{animal.emoji}</div>}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${T.bg} 0%, transparent 55%)` }} />
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "rgba(5,11,24,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", width: 42, height: 42, color: T.text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}>✕</button>
        </div>
        <div style={{ padding: "0 30px 30px" }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: T.text, marginBottom: 6 }}>{animal.name}</h2>
          <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 18 }}>{animal.tagline}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
            {[["🌡️", animal.temp], ["⏳", animal.lifespan], ["📏", animal.size], ["🌍", animal.origin]].map(([ic, v]) => (
              <span key={v} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "6px 14px", borderRadius: 50, fontSize: 12, color: T.textSub, fontFamily: "'JetBrains Mono', monospace" }}>{ic} {v}</span>
            ))}
          </div>
          {loading && <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 44, height: 44, border: `3px solid ${catColor}30`, borderTopColor: catColor, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
            <p style={{ color: T.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>Loading animal data…</p>
          </div>}
          {error && <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <p style={{ color: "#ff6b6b", marginBottom: 14, fontSize: 14 }}>{error}</p>
            <button onClick={fetchDetails} style={{ background: catColor, color: T.bg, border: "none", borderRadius: 50, padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>Retry</button>
          </div>}
          {content && (
            <>
              <div style={{ background: `linear-gradient(135deg, ${catColor}12, transparent)`, border: `1px solid ${catColor}25`, borderRadius: 18, padding: 22, marginBottom: 24 }}>
                <div style={{ color: catColor, fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 10, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>🧠 Personality</div>
                <p style={{ color: T.textSub, lineHeight: 1.75, fontSize: 14 }}>{content.personality}</p>
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: T.text, marginBottom: 18, fontSize: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Complete Care Guide</div>
              <div className="care-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginBottom: 20 }}>
                {careItems.map(([icon, label, text]) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 18 }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${catColor}40`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    <div style={{ fontSize: 12, color: catColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>{icon} {label}</div>
                    <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>{text}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ color: T.gold, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>🇮🇳 India Care Tip</div>
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>{content.india_tip}</p>
              </div>
              <div style={{ background: `${catColor}08`, border: `1px solid ${catColor}20`, borderRadius: 14, padding: 18 }}>
                <div style={{ color: catColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>✨ Fun Fact</div>
                <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.65 }}>{content.fun_fact}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: "👋 Hey! I'm **Paw AI** — your animal expert. Ask me anything about any animal, care tips, India-specific advice, or just cool facts! 🐾" }]);
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
      const apiMsgs = [
        { role: "system", content: "You are Paw AI, a friendly expert animal encyclopedia assistant. Give accurate, engaging answers. Mention India-specific tips when relevant. Keep under 200 words unless asked more." },
        ...newMessages.filter((_, i) => i !== 0).map(m => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content }))
      ];
      const reply = await callGroq(apiMsgs);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch { setError("Couldn't connect. Check your Groq API key."); }
    finally { setLoading(false); }
  };

  return (
    <div className="chat-panel" style={{ position: "fixed", bottom: 90, right: 24, width: "min(400px, calc(100vw - 48px))", height: 540, background: T.bgCard, border: "1px solid rgba(108,99,255,0.25)", borderRadius: 24, zIndex: 999, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,99,255,0.1)", animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,170,0.05))" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, animation: "pulseGlow 2.5s ease infinite" }}>🐾</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: T.text, fontSize: 15 }}>Paw AI</div>
          <div style={{ fontSize: 11, color: T.accent, fontFamily: "'JetBrains Mono', monospace" }}>● Animal Expert · Online</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", padding: 4 }}
          onMouseEnter={(e) => e.target.style.color = T.text}
          onMouseLeave={(e) => e.target.style.color = T.textMuted}
        >✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "85%", padding: "10px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px", background: m.role === "user" ? "linear-gradient(135deg, #6c63ff, #4a42dd)" : "rgba(255,255,255,0.05)", border: m.role === "user" ? "none" : "1px solid rgba(255,255,255,0.07)", color: m.role === "user" ? "#fff" : T.textSub, fontSize: 13, lineHeight: 1.65 }} dangerouslySetInnerHTML={{ __html: formatMsg(m.content) }} />
          </div>
        ))}
        {loading && <div style={{ display: "flex", gap: 6, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "4px 18px 18px 18px", width: "fit-content" }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: T.primary, animation: `floatY 1s ease ${i * 0.2}s infinite` }} />)}
        </div>}
        {error && <p style={{ color: "#ff6b6b", fontSize: 12, textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "12px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask about any animal…"
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 50, padding: "10px 18px", color: T.text, fontSize: 13, outline: "none", fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" }}
          onFocus={(e) => e.target.style.borderColor = "rgba(108,99,255,0.4)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button onClick={send} disabled={loading || !input.trim()} style={{ background: input.trim() && !loading ? "linear-gradient(135deg, #6c63ff, #4a42dd)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: "50%", width: 44, height: 44, color: input.trim() && !loading ? "#fff" : T.textMuted, fontSize: 16, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}>➤</button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 40px", background: "linear-gradient(180deg, transparent, rgba(108,99,255,0.04))" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 36 }}>🐾</span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, background: "linear-gradient(135deg, #fff, #6c63ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Pawpedia</span>
        </div>
        <p style={{ color: T.textMuted, fontSize: 13, textAlign: "center", maxWidth: 400, lineHeight: 1.7 }}>
          Built with ❤️ by <span style={{ color: T.primary, fontWeight: 700 }}>Shubham</span>
        </p>
        <p style={{ color: "rgba(255,255,255,0.12)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>© {new Date().getFullYear()} Shubham · Pawpedia</p>
      </div>
    </footer>
  );
}

export default function App() {
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

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
      <Hero search={search} setSearch={setSearch} />
      {!search && <FeaturedSection onSelect={setSelectedAnimal} onFavorite={toggleFavorite} favorites={favorites} />}
      <CategoryBrowser active={category} setActive={handleCategoryChange} />
      <div id="grid-section">
        <AnimalGrid animals={filteredAnimals} onSelect={setSelectedAnimal} category={category} onFavorite={toggleFavorite} favorites={favorites} />
      </div>
      <Footer />
      <button onClick={() => setChatOpen(!chatOpen)} style={{
        position: "fixed", bottom: 24, right: 24, width: 62, height: 62,
        background: chatOpen ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #6c63ff, #00d4aa)",
        border: "none", borderRadius: "50%", fontSize: 26, cursor: "pointer",
        zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: chatOpen ? "none" : "0 8px 32px rgba(108,99,255,0.5)",
        animation: chatOpen ? "none" : "pulseGlow 2.5s ease infinite",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1) rotate(10deg)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1) rotate(0deg)"}
      >
        <span style={{ transition: "transform 0.3s", transform: chatOpen ? "rotate(45deg)" : "rotate(0)" }}>{chatOpen ? "✕" : "🐾"}</span>
      </button>
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
      {selectedAnimal && <DetailModal animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />}
    </div>
  );
}