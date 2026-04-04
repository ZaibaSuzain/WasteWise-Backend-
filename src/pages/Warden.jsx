import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Warden() {
  const navigate = useNavigate();
  const [pwd, setPwd]           = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError]       = useState("");
  const [flags, setFlags]       = useState([]);
  const [escalated, setEscalated] = useState([]);
  const [stats, setStats]       = useState({ avgRating: 0, totalWaste: 0, totalMoney: 0, menuAge: 6, resolved: 0 });
  const [loading, setLoading]   = useState(false);

  const login = () => {
    if (pwd === "warden123") { setLoggedIn(true); setError(""); }
    else setError("wrong password. try again.");
  };

  const loadData = async () => {
    setLoading(true);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();
const [
  { data: flagData },
  { data: escalationData },
  { data: reviewData },
  { data: wasteData },
] = await Promise.all([
  supabase.from("flags").select("*").order("days_flagged", { ascending: false }),
  supabase.from("escalations").select("*, flags(dish_name, days_flagged, last_action)").order("days_ignored", { ascending: false }),
  supabase.from("reviews").select("rating").gte("created_at", weekAgoISO),
  supabase.from("waste_logs").select("wasted_kg, money_wasted").gte("created_at", weekAgoISO),
]);


    const avgRating  = reviewData?.length ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1) : 0;
    const totalWaste = wasteData?.reduce((s, w) => s + (w.wasted_kg || 0), 0).toFixed(1) || 0;
    const totalMoney = wasteData?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || 0;
    const totalFlags    = flagData?.length || 0;
    const resolvedFlags = flagData?.filter(f => f.status === "resolved").length || 0;
    const resolvedPct   = totalFlags ? Math.round((resolvedFlags / totalFlags) * 100) : 0;

    setFlags(flagData || []);
    setEscalated(escalationData || []);
    setStats({ avgRating, totalWaste, totalMoney, menuAge: 6, resolved: resolvedPct });
    setLoading(false);
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);

  const setFlagStatus = async (id, newStatus) => {
    const { error } = await supabase.from("flags").update({ status: newStatus, last_action: newStatus }).eq("id", id);
    if (!error) setFlags(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
  };

  /* ── LOGIN ── */
  if (!loggedIn) return (
    <div style={s.page}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={s.loginIcon}>👔</div>
        <div style={s.loginTitle}>oh so YOU'RE<br />the warden</div>
        <div style={s.attentionBadge}>⚠️ 3 THINGS NEED YOUR ATTENTION RN</div>
      </div>
      <div style={s.divider} />

      <label style={s.label}>PASSWORD</label>
      <input 
        type="password" 
        value={pwd} 
        onKeyDown={e => e.key === "Enter" && login()}
        onChange={e => setPwd(e.target.value)}
        placeholder="enter password"
        autoComplete="off"
        autoFocus={false}
        style={s.input}
      />
      {error && <div style={s.errorMsg}>{error}</div>}
      <button onClick={login} style={s.primaryBtn}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
      >LOGIN →</button>
    </div>
  );

  /* ── LOADING ── */
  if (loading) return (
    <div style={{ ...s.page, textAlign: "center", paddingTop: 80 }}>
      <div style={{ fontSize: 12, color: "#475569", letterSpacing: 3 }}>LOADING CASE FILE...</div>
    </div>
  );

  /* ── DASHBOARD ── */
  const score = parseFloat(stats.avgRating) * 2 || 3.8;
  const scoreColor = score < 4 ? "#ff4444" : score < 7 ? "#f59e0b" : "#10b981";

  return (
    <div style={s.page}>
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <div style={s.pageTitle}>THE FULL CASE FILE</div>
      </div>
      <div style={s.divider} />

      {/* SCORE */}
      <div style={{ ...s.card, textAlign: "center", padding: "28px 24px", marginBottom: 16 }}>
        <div style={s.sectionLabel}>◆ MESS HEALTH SCORE</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: scoreColor, lineHeight: 1,
          filter: `drop-shadow(0 0 20px ${scoreColor}55)` }}>
          {score.toFixed(1)}
        </div>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: 3, marginBottom: 12 }}>OUT OF 10</div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${score * 10}%`, background: scoreColor,
            boxShadow: `0 0 12px ${scoreColor}88` }} />
        </div>
      </div>

      {/* THIS WEEK STATS */}
      <div style={s.sectionLabel}>◆ THIS WEEK</div>
      <div style={s.statGrid}>
        {[
          { label: "AVG RATING",  val: `${stats.avgRating} / 5`, color: "#ff4444" },
          { label: "TOTAL WASTE", val: `${stats.totalWaste} kg`, color: "#f0f4ff", sub: `₹${stats.totalMoney}` },
          { label: "MENU AGE",    val: `${stats.menuAge} DAYS`,  color: "#f59e0b" },
          { label: "RESOLVED",    val: `${stats.resolved}%`,     color: stats.resolved > 60 ? "#10b981" : "#f59e0b" },
        ].map(({ label, val, color, sub }) => (
          <div key={label} style={s.statCell}>
            <div style={s.statLabel}>{label}</div>
            <div style={{ ...s.statValue, color }}>{val}</div>
            {sub && <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>
      <div style={s.divider} />

      {/* ACCOUNTABILITY WALL */}
      <div style={s.sectionLabel}>◆ ACCOUNTABILITY WALL</div>
      {flags.length === 0 ? (
        <div style={s.emptyState}>no flagged dishes. mess is thriving. 👏</div>
      ) : flags.map((f) => (
        <div key={f.id} style={{ ...s.card, ...(f.days_flagged >= 5 ? s.cardDanger : {}) }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f0f4ff" }}>{f.dish_name}</span>
            <span style={{ fontSize: 14 }}>
              {Array(Math.min(f.days_flagged, 5)).fill(f.days_flagged >= 3 ? "🔴" : "🟡").join("")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>WASTE AVG: {parseFloat(f.avg_waste_kg || 0).toFixed(1)} kg</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>RATING: {f.avg_rating ? `${f.avg_rating}/5` : "N/A"}</span>
          </div>
          {f.status && f.status !== "open" ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ {f.status.toUpperCase()}</div>
              {f.status !== "resolved" && (
                <button onClick={() => setFlagStatus(f.id, "resolved")} style={s.resolveBtn}>
                  MARK RESOLVED
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              {["acknowledge", "fix scheduled", "resolved"].map(st => (
                <button key={st} onClick={() => setFlagStatus(f.id, st)} style={s.actionBtn}>
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={s.divider} />

      {/* ESCALATION ALERTS */}
      <div style={{ ...s.sectionLabel, color: "#ff4444" }}>◆ ESCALATION ALERTS</div>
      {escalated.length === 0 ? (
        <div style={s.emptyState}>no escalations. you're on top of it. 👍</div>
      ) : escalated.map((e) => (
        <div key={e.id} style={{ ...s.card, ...s.cardDanger }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f4ff", marginBottom: 6 }}>
            {e.flags?.dish_name || "Unknown dish"}
          </div>
          <div style={{ fontSize: 11, color: "#ff4444", letterSpacing: 0.5, marginBottom: 4 }}>
            IGNORED {e.days_ignored} DAYS — escalated to chief warden
          </div>
          {e.flags?.last_action && (
            <div style={{ fontSize: 11, color: "#64748b" }}>
              LAST ACTION: {e.flags.last_action}
            </div>
          )}
        </div>
      ))}

      <div style={s.divider} />
      <button onClick={loadData} style={s.refreshBtn}>↻ REFRESH DATA</button>

      <div style={{ textAlign: "center", fontSize: 10, color: "#334155", letterSpacing: 1, lineHeight: 2, marginTop: 16 }}>
        — — — — — — — — — — — — — — — — —<br />
        WITH GREAT POWER COMES GREAT<br />MESS ACCOUNTABILITY.<br />
        — — — — — — — — — — — — — — — — —
      </div>
    </div>
  );
}

const s = {
  page: {
    maxWidth: 600, margin: "0 auto",
    padding: "88px 24px 60px",
    minHeight: "100vh",
    fontFamily: "'Outfit', sans-serif",
  },

  // LOGIN
  loginIcon: { fontSize: 48, marginBottom: 12 },
  loginTitle: {
    fontSize: 24, fontWeight: 800,
    letterSpacing: -0.5, color: "#f0f4ff",
    lineHeight: 1.3, marginBottom: 12,
  },
  attentionBadge: {
    display: "inline-block",
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.3)",
    color: "#f59e0b", fontSize: 11,
    fontWeight: 600, padding: "6px 14px",
    borderRadius: 20, letterSpacing: 0.5,
  },

  pageTitle: {
    fontSize: 20, fontWeight: 800,
    letterSpacing: 2, color: "#f0f4ff",
    marginTop: 8,
  },
  divider: {
    height: 1, background: "rgba(255,255,255,0.06)",
    margin: "20px 0",
  },
  label: {
    display: "block",
    fontSize: 11, fontWeight: 700,
    letterSpacing: 1.5, color: "#64748b",
    marginBottom: 6, textTransform: "uppercase",
  },
  input: {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f0f4ff",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14, outline: "none",
    marginBottom: 16, borderRadius: 10,
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  errorMsg: {
    fontSize: 12, color: "#ff4444",
    marginBottom: 12, letterSpacing: 0.5,
  },
  primaryBtn: {
    width: "100%", padding: "14px 20px",
    background: "linear-gradient(135deg, #f59e0b, #ef4444)",
    border: "none", borderRadius: 10, color: "#fff",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13, fontWeight: 700,
    letterSpacing: 2, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
    transition: "all 0.2s ease",
  },

  // SCORE
  progressTrack: {
    height: 6, background: "#111827",
    borderRadius: 99, margin: "0 auto",
    maxWidth: 300, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 99,
    transition: "width 1.2s ease",
  },

  // SECTION
  sectionLabel: {
    fontSize: 11, fontWeight: 700,
    letterSpacing: 2, color: "#f59e0b",
    marginBottom: 12, textTransform: "uppercase",
  },

  // STAT GRID
  statGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, marginBottom: 16,
  },
 statCell: {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12, padding: 16,
},
  statLabel: {
    fontSize: 10, color: "#475569",
    letterSpacing: 1, textTransform: "uppercase",
    marginBottom: 8, fontWeight: 600,
  },
  statValue: {
    fontSize: 18, fontWeight: 800, lineHeight: 1.2,
  },

  // CARDS
card: {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14, padding: 16,
  marginBottom: 12,
},
  cardDanger: {
    background: "linear-gradient(135deg, rgba(255,68,68,0.07), rgba(255,68,68,0.02))",
    border: "1px solid rgba(255,68,68,0.2)",
  },

  emptyState: {
    fontSize: 12, color: "#475569",
    textAlign: "center", padding: "16px 0",
  },

  // BUTTONS
  resolveBtn: {
    padding: "5px 12px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    color: "#10b981", borderRadius: 8,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 10, letterSpacing: 1,
    cursor: "pointer", fontWeight: 600,
  },
  actionBtn: {
    flex: 1, padding: "7px 4px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#64748b", borderRadius: 8,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 10, letterSpacing: 0.5,
    cursor: "pointer", textTransform: "uppercase",
    transition: "all 0.15s",
  },
  refreshBtn: {
    width: "100%", padding: 12,
    background: "transparent",
    border: "1px dashed rgba(255,255,255,0.1)",
    color: "#475569", borderRadius: 10,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11, letterSpacing: 2,
    cursor: "pointer",
  },
};