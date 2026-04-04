import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TODAY = new Date().toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});

function getMsg(score) {
  if (score < 3)  return { text: "They really said 💀",          color: "#ff4444" };
  if (score < 5)  return { text: "Kuch toh sharam karo 😬", color: "#ff4444" };
  if (score < 7)  return { text: "Improvement? Maybe? 👀",        color: "#f59e0b" };
  return              { text: "Okay not bad ngl 👏",              color: "#10b981" };
}

const DAY_LABELS = ["M","T","W","T","F","S","S"];

export default function Landing() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
   const now = new Date();
  const todayStr = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
  .toISOString().split("T")[0];
      const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      const [
  { data: todayWaste },
  { data: skipData },
  { data: weekWaste },
  { data: reviewData },
  { data: flagData },
  { data: trendData },
] = await Promise.all([
  supabase.from("waste_logs").select("wasted_kg, money_wasted, dish_name").gte("created_at", `${todayStr}T00:00:00+05:30`),
  supabase.from("reviews").select("id").eq("skipped", true).gte("created_at", `${todayStr}T00:00:00+05:30`),
  supabase.from("waste_logs").select("wasted_kg, money_wasted").gte("created_at", weekAgoISO),
  supabase.from("reviews").select("rating").gte("created_at", weekAgoISO),
  supabase.from("flags").select("dish_name, days_flagged, status").in("status", ["open","acknowledged","escalated"]).gte("days_flagged", 5).order("days_flagged", { ascending: false }).limit(3),
  supabase.from("waste_logs").select("wasted_kg, created_at").gte("created_at", weekAgoISO).order("created_at", { ascending: true }),
]);

      const wasteToday  = todayWaste?.reduce((s, w) => s + (w.wasted_kg    || 0), 0).toFixed(1) || "0.0";
      const moneyToday  = todayWaste?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || "0";
      const worstDish   = todayWaste?.length ? todayWaste.reduce((a, b) => (a.wasted_kg > b.wasted_kg ? a : b)).dish_name : "N/A";
      const skippedToday = skipData?.length || 0;
      const weekWasteTotal = weekWaste?.reduce((s, w) => s + (w.wasted_kg    || 0), 0).toFixed(1) || "0.0";
      const weekMoneyTotal = weekWaste?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || "0";
      const avgRating = reviewData?.length ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1) : "0.0";
      const score = parseFloat(avgRating) * 2 || 0;

      const dayTotals = Array(7).fill(0);
      trendData?.forEach(w => {
        const day = new Date(w.created_at).getDay();
        const idx = day === 0 ? 6 : day - 1;
        dayTotals[idx] += w.wasted_kg || 0;
      });

      setStats({ wasteToday, moneyToday, worstDish, skippedToday, weekWasteTotal, weekMoneyTotal, avgRating, score, flags: flagData || [], bars: dayTotals.map(v => parseFloat(v.toFixed(1))) });
      setReady(true);
    };
    fetchStats();
  }, []);

  if (!ready) return (
    <div style={styles.loadingWrap}>
      <div style={{ fontSize: 13, color: "#94a3b8", letterSpacing: 3 }}>LOADING DATA...</div>
    </div>
  );

  const { score } = stats;
  const scoreColor = score < 5 ? "#ff4444" : score < 7 ? "#f59e0b" : "#10b981";
  const msg = getMsg(score);
  const maxBar = Math.max(...stats.bars, 1);

  return (
    <div style={styles.root}>

      {/* ── HERO ── */}
      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroBadge}>🧾 Hostel Mess Accountability</div>
        <h1 style={styles.heroH1}>
          Welcome to <span style={styles.heroSpan}>WasteWise</span>
        </h1>
        <p style={styles.heroSub}>
          Track food waste. Flag bad dishes. Escalate ignored issues.<br />
          Real-time accountability for every meal.
        </p>
        {/* quick stats strip */}
        <div style={styles.statsStrip}>
          {[
            { label: "Waste Today",   value: `${stats.wasteToday} kg`, color: "#ff4444" },
            { label: "Money Wasted",  value: `₹${stats.moneyToday}`,   color: "#f59e0b" },
            { label: "Mess Score",    value: `${score.toFixed(1)}/10`,  color: scoreColor },
            { label: "Skipped Today", value: stats.skippedToday,        color: "#94a3b8" },
          ].map((s, i) => (
            <div key={s.label} style={{
              ...styles.stripItem,
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{ ...styles.stripValue, color: s.color }}>{s.value}</div>
              <div style={styles.stripLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECEIPT SECTION ── */}
      <div style={styles.receiptWrap}>

        {/* header */}
        <div style={styles.receiptHeader}>
          
          
          <div style={styles.receiptSub}>RAJIV GANDHI HOSTEL — BLOCK C &nbsp;·&nbsp; 📅 {TODAY}</div>
        </div>

        {/* 2 col grid */}
        <div style={styles.grid2}>
          <div style={{ ...styles.card, ...styles.cardDanger }}>
            <div style={styles.cardLabel}>◆ TODAY'S DAMAGE</div>
            {[
              ["Waste Today",          `${stats.wasteToday} kg 🗑️`,  "#ff4444"],
              ["Money Wasted",         `₹${stats.moneyToday}`,        "#f59e0b"],
              ["Students Skipped",     `${stats.skippedToday} 😶`,    "#94a3b8"],
              ["Worst Dish",           `${stats.worstDish} 💀`,       "#ff4444"],
            ].map(([l, r, c]) => (
              <div key={l} style={styles.row}>
                <span style={styles.rowLabel}>{l}</span>
                <span style={{ ...styles.rowValue, color: c }}>{r}</span>
              </div>
            ))}
          </div>

          <div style={{ ...styles.card, ...styles.cardAmber }}>
            <div style={styles.cardLabel}>◆ THIS WEEK</div>
            {[
              ["Total Waste",      `${stats.weekWasteTotal} kg`, "#ff4444"],
              ["Money Wasted",     `₹${stats.weekMoneyTotal}`,   "#f59e0b"],
              ["Avg Rating",       `${stats.avgRating} / 5 ⭐`,  parseFloat(stats.avgRating) < 3 ? "#ff4444" : "#f59e0b"],
              ["Menu Unchanged",   "6 DAYS 😐",                  "#f59e0b"],
            ].map(([l, r, c]) => (
              <div key={l} style={styles.row}>
                <span style={styles.rowLabel}>{l}</span>
                <span style={{ ...styles.rowValue, color: c }}>{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MESS HEALTH SCORE */}
        <div style={{ ...styles.card, textAlign: "center", padding: "32px 24px" }}>
          <div style={styles.cardLabel}>◆ MESS HEALTH SCORE</div>
          <div style={{ ...styles.scoreNum, color: scoreColor,
            filter: `drop-shadow(0 0 24px ${scoreColor}55)` }}>
            {score.toFixed(1)}
          </div>
          <div style={styles.scoreOut}>OUT OF 10</div>
          <div style={styles.progressTrack}>
            <div style={{
              ...styles.progressFill,
              width: `${score * 10}%`,
              background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
              boxShadow: `0 0 12px ${scoreColor}88`,
            }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: msg.color, letterSpacing: 0.5 }}>
            {msg.text}
          </div>
        </div>

        {/* CURRENTLY IGNORED */}
        {stats.flags.length > 0 && (
          <div style={{ ...styles.card, ...styles.cardDanger }}>
            <div style={styles.cardLabel}>◆ CURRENTLY IGNORED 🙈</div>
            {stats.flags.map((f, i) => (
              <div key={i} style={styles.flagRow}>
                <span style={{ color: "#cbd5e1", fontSize: 13 }}>• {f.dish_name} flagged for {f.days_flagged} days</span>
                <span style={styles.ignoredBadge}>{f.days_flagged}d ignored</span>
              </div>
            ))}
          </div>
        )}

        {/* WASTE TREND */}
        <div style={styles.card}>
          <div style={styles.cardLabel}>◆ WASTE TREND (MON–SUN)</div>
          <div style={styles.chartWrap}>
            {stats.bars.map((val, i) => {
              const pct = (val / maxBar) * 100;
              const col = val === maxBar && val > 0 ? "#ff4444" : val > 3 ? "#f59e0b" : "#10b981";
              return (
                <div key={i} style={styles.barCol}>
                  <div style={styles.barVal}>{val > 0 ? val : ""}</div>
                  <div style={styles.barTrack}>
                    <div style={{
                      ...styles.barFill,
                      height: val > 0 ? `${Math.max(pct, 8)}%` : "4px",
                      background: val > 0 ? `linear-gradient(180deg, ${col}, ${col}66)` : "#1e293b",
                      boxShadow: val > 0 ? `0 0 8px ${col}55` : "none",
                    }} />
                  </div>
                  <div style={styles.barDay}>{DAY_LABELS[i]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.receiptFooter}>
          <div style={styles.footerDash}>— — — — — — — — — — — — — — — — —</div>
          <div style={{ fontSize: 12, color: "#475569", letterSpacing: 1, margin: "8px 0" }}>
            💡 TIP: EAT WHAT YOU TAKE
          </div>
          <div style={{ fontSize: 11, color: "#334155", letterSpacing: 1, lineHeight: 2 }}>
            NO FOOD WASTAGE. NO EXCUSES.<br />
            
          </div>
          <div style={styles.footerDash}>— — — — — — — — — — — — — — — — —</div>
        </div>


      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0b0f1a",
    fontFamily: "'Outfit', sans-serif",
  },
  loadingWrap: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh",
  },

  // HERO
  hero: {
    position: "relative", overflow: "hidden",
    padding: "100px 24px 64px",
    textAlign: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "linear-gradient(180deg, rgba(245,158,11,0.05) 0%, transparent 100%)",
  },
  heroGlow: {
    position: "absolute", top: -120, left: "50%",
    transform: "translateX(-50%)",
    width: 700, height: 500,
    background: "radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 65%)",
    pointerEvents: "none",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.25)",
    color: "#f59e0b", fontSize: 12, fontWeight: 600,
    padding: "5px 16px", borderRadius: 20,
    letterSpacing: "0.5px", marginBottom: 20,
  },
  heroH1: {
    fontSize: "clamp(32px, 6vw, 56px)",
    fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1,
    marginBottom: 16, color: "#f0f4ff",
  },
  heroSpan: {
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    fontSize: 16, color: "#94a3b8", lineHeight: 1.7,
    maxWidth: 480, margin: "0 auto 28px",
  },


  statsStrip: {
    display: "flex", justifyContent: "center",
    maxWidth: 560, margin: "48px auto 0",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, overflow: "hidden",
  },
  stripItem: {
    flex: 1, padding: "18px 12px", textAlign: "center",
  },
  stripValue: {
    fontSize: 22, fontWeight: 800, lineHeight: 1, marginBottom: 5,
  },
  stripLabel: {
    fontSize: 10, color: "#475569",
    letterSpacing: "0.5px", textTransform: "uppercase",
  },

  // RECEIPT
  receiptWrap: {
    maxWidth: 720, margin: "0 auto",
    padding: "48px 24px 80px",
  },
  receiptHeader: {
    textAlign: "center", marginBottom: 32,
  },
  receiptTitle: {
    fontSize: 26, fontWeight: 800,
    letterSpacing: 6, color: "#f0f4ff",
    fontFamily: "'Space Mono', monospace",
  },
  receiptSub: {
    fontSize: 12, color: "#475569",
    letterSpacing: 1, marginTop: 6,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 16, marginBottom: 16,
  },

  card: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "20px",
    marginBottom: 0,
  },
  cardDanger: {
    background: "linear-gradient(135deg, rgba(255,68,68,0.06), rgba(255,68,68,0.02))",
    border: "1px solid rgba(255,68,68,0.18)",
  },
  cardAmber: {
    background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))",
    border: "1px solid rgba(245,158,11,0.18)",
  },
  cardLabel: {
    fontSize: 11, fontWeight: 700,
    letterSpacing: 2, color: "#f59e0b",
    marginBottom: 14, textTransform: "uppercase",
  },

  row: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: 12, paddingBottom: 9, marginBottom: 9,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  rowLabel: { color: "#64748b", fontWeight: 500 },
  rowValue: { fontWeight: 700 },

  scoreNum: {
    fontSize: 88, fontWeight: 800,
    lineHeight: 1, letterSpacing: -4,
    marginBottom: 4, transition: "color 0.5s",
  },
  scoreOut: {
    fontSize: 11, color: "#475569",
    letterSpacing: 3, marginBottom: 16,
  },
  progressTrack: {
    height: 6, background: "#111827",
    borderRadius: 99, margin: "0 auto 16px",
    maxWidth: 320, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 99,
    transition: "width 1.2s ease",
  },

  flagRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10, gap: 12,
  },
  ignoredBadge: {
    background: "rgba(255,68,68,0.1)",
    border: "1px solid rgba(255,68,68,0.25)",
    color: "#ff4444", fontSize: 10,
    fontWeight: 700, padding: "3px 10px",
    borderRadius: 20, whiteSpace: "nowrap",
  },

  chartWrap: {
    display: "flex", alignItems: "flex-end",
    gap: 8, height: 90, marginTop: 8,
  },
  barCol: {
    flex: 1, display: "flex",
    flexDirection: "column", alignItems: "center", gap: 4,
  },
  barVal: { fontSize: 9, color: "#475569", height: 12 },
  barTrack: {
    width: "100%", height: 56,
    background: "#0f172a", borderRadius: 6,
    display: "flex", alignItems: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%", borderRadius: 6,
    transition: "height 0.8s ease",
  },
  barDay: { fontSize: 10, color: "#475569", fontWeight: 600 },

  receiptFooter: {
    textAlign: "center", margin: "24px 0",
  },
  footerDash: {
    fontSize: 11, color: "#1e293b",
    letterSpacing: 2, margin: "8px 0",
  },

  ctaBtn: {
    width: "100%", padding: "16px 20px",
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    border: "none", borderRadius: 10, color: "#fff",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14, fontWeight: 700,
    letterSpacing: 2, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
    transition: "all 0.2s ease",
  },
};