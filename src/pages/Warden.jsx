import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Warden() {
  const navigate = useNavigate();
  const [pwd, setPwd]         = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError]     = useState("");

  // data
  const [flags, setFlags]           = useState([]);
  const [escalated, setEscalated]   = useState([]);
  const [stats, setStats]           = useState({ avgRating: 0, totalWaste: 0, totalMoney: 0, menuAge: 6, resolved: 0 });
  const [loading, setLoading]       = useState(false);

  const login = () => {
    if (pwd === "warden123") { setLoggedIn(true); setError(""); }
    else setError("wrong password. try again.");
  };

  // ── LOAD ALL DATA ─────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString();

    // 1. Flags (accountability wall)
    const { data: flagData } = await supabase
      .from("flags")
      .select("*")
      .order("days_flagged", { ascending: false });

    // 2. Escalations (ignored 3+ days)
    const { data: escalationData } = await supabase
      .from("escalations")
      .select("*, flags(dish_name, days_flagged, last_action)")
      .order("days_ignored", { ascending: false });

    // 3. Avg rating this week
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("rating")
      .gte("created_at", weekAgoISO);

    // 4. Waste totals this week
    const { data: wasteData } = await supabase
      .from("waste_logs")
      .select("wasted_kg, money_wasted")
      .gte("created_at", weekAgoISO);

    // calculate stats
    const avgRating = reviewData?.length
      ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1)
      : 0;

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
  // ─────────────────────────────────────────────────────────────

  // ── UPDATE FLAG STATUS ────────────────────────────────────────
  const setFlagStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("flags")
      .update({ status: newStatus, last_action: newStatus })
      .eq("id", id);

    if (!error) {
      setFlags(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    }
  };
  // ─────────────────────────────────────────────────────────────

  const inputStyle = {
    width:"100%", padding:"10px 12px", background:"#111",
    border:"1px solid #2a2a25", color:"var(--text)",
    fontFamily:"var(--font)", fontSize:12, outline:"none", marginBottom:10,
  };

  /* ── LOGIN ── */
  if (!loggedIn) return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:32, marginBottom:16 }}>        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2 }}>oh so YOU'RE<br/>the warden</div>
        <div style={{ marginTop:12, display:"inline-block", border:"1px solid #ffaa00",
          color:"#ffaa00", fontSize:10, padding:"4px 12px", letterSpacing:2 }}>
          ⚠️ 3 THINGS NEED YOUR ATTENTION RN
        </div>
      </div>
      <hr className="divider"/>
      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>PASSWORD</div>
      <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&login()}
        placeholder="••••••••" style={inputStyle}/>
      {error && <div style={{ color:"#ff3333", fontSize:11, marginBottom:10 }}>{error}</div>}
      <button onClick={login} style={{
        width:"100%", padding:14, background:"var(--text)", border:"none",
        color:"var(--bg)", fontFamily:"var(--font)", fontSize:12,
        fontWeight:700, letterSpacing:3, cursor:"pointer",
      }}>LOGIN →</button>
    </div>
  );

  /* ── DASHBOARD ── */
  const score = parseFloat(stats.avgRating) * 2 || 3.8; // convert 0-5 rating to 0-10 score
  const scoreColor = score < 4 ? "#ff3333" : score < 7 ? "#ffaa00" : "#00cc66";

  if (loading) return (
    <div className="page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:3 }}>LOADING CASE FILE...</div>
    </div>
  );

  return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:16, marginBottom:4 }}>        <div style={{ fontSize:14, fontWeight:700, letterSpacing:3, marginTop:8 }}>THE FULL CASE FILE</div>
      </div>
      <hr className="divider"/>

      {/* score */}
      <div style={{ textAlign:"center", margin:"8px 0 16px" }}>
        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>MESS HEALTH SCORE</div>
        <div style={{ fontSize:64, fontWeight:700, color:scoreColor, lineHeight:1 }}>{score.toFixed(1)}</div>
        <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:2 }}>OUT OF 10</div>
        <div style={{ height:6, background:"#1a1a1a", borderRadius:3, margin:"10px 0" }}>
          <div style={{ height:"100%", width:`${score*10}%`, background:scoreColor, borderRadius:3 }}/>
        </div>
      </div>
      <hr className="divider"/>

      {/* 2x2 stat grid */}
      <div style={{ fontSize:11, color:"var(--amber)", letterSpacing:2, marginBottom:10 }}>◆ THIS WEEK</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"AVG RATING",  val:`${stats.avgRating} / 5`,              color:"#ff3333" },
          { label:"TOTAL WASTE", val:`${stats.totalWaste} kg\n₹${stats.totalMoney}` },
          { label:"MENU AGE",    val:`${stats.menuAge} DAYS`,               color:"#ffaa00" },
          { label:"RESOLVED",    val:`${stats.resolved}%`,                  color: stats.resolved > 60 ? "#00cc66" : "#ffaa00" },
        ].map(({label,val,color}) => (
          <div key={label} style={{ border:"1px solid #2a2a25", padding:12 }}>
            <div style={{ fontSize:9, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:15, fontWeight:700, color:color||"var(--text)", whiteSpace:"pre" }}>{val}</div>
          </div>
        ))}
      </div>
      <hr className="divider"/>

      {/* accountability wall */}
      <div style={{ fontSize:11, color:"var(--amber)", letterSpacing:2, marginBottom:10 }}>◆ ACCOUNTABILITY WALL</div>
      {flags.length === 0 && (
        <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>
          no flagged dishes. mess is thriving. 👏
        </div>
      )}
      {flags.map((f) => (
        <div key={f.id} style={{
          border:`1px solid ${f.days_flagged>=5?"#ff3333":"#2a2a25"}`,
          padding:12, marginBottom:10,
          background: f.days_flagged>=5?"#110000":"transparent",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:700 }}>{f.dish_name}</span>
            <span style={{ fontSize:12 }}>
              {Array(Math.min(f.days_flagged, 5)).fill(f.days_flagged >= 3 ? "🔴" : "🟡").join("")}
            </span>
          </div>
          <div style={{ fontSize:11, display:"flex", gap:16, color:"var(--muted)", marginBottom:10 }}>
            <span>WASTE AVG: {parseFloat(f.avg_waste_kg||0).toFixed(1)} kg</span>
            <span>RATING: {f.avg_rating ? `${f.avg_rating}/5` : "N/A"}</span>
          </div>
          {f.status && f.status !== "open" ? (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:11, color:"#00cc66", letterSpacing:1 }}>✓ {f.status.toUpperCase()}</div>
              {f.status !== "resolved" && (
                <button onClick={()=>setFlagStatus(f.id,"resolved")} style={{
                  padding:"4px 10px", background:"transparent",
                  border:"1px solid #00cc66", color:"#00cc66",
                  fontFamily:"var(--font)", fontSize:9, letterSpacing:1, cursor:"pointer",
                }}>MARK RESOLVED</button>
              )}
            </div>
          ) : (
            <div style={{ display:"flex", gap:6 }}>
              {["acknowledge","fix scheduled","resolved"].map(s => (
                <button key={s} onClick={()=>setFlagStatus(f.id, s)} style={{
                  flex:1, padding:"6px 4px", background:"transparent",
                  border:"1px solid #2a2a25", color:"var(--muted)",
                  fontFamily:"var(--font)", fontSize:9, letterSpacing:1,
                  cursor:"pointer", textTransform:"uppercase",
                }}>{s}</button>
              ))}
            </div>
          )}
        </div>
      ))}
      <hr className="divider"/>

      {/* escalation alerts */}
      <div style={{ fontSize:11, color:"#ff3333", letterSpacing:2, marginBottom:10 }}>◆ ESCALATION ALERTS</div>
      {escalated.length === 0 && (
        <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>
          no escalations. you're on top of it. 👍
        </div>
      )}
      {escalated.map((e) => (
        <div key={e.id} style={{
          background:"#110000", border:"1px solid #ff3333",
          padding:12, marginBottom:10,
        }}>
          <div style={{ fontSize:12, marginBottom:4, fontWeight:700 }}>
            {e.flags?.dish_name || "Unknown dish"}
          </div>
          <div style={{ fontSize:10, color:"#ff3333", letterSpacing:1 }}>
            IGNORED {e.days_ignored} DAYS — this has been escalated to chief warden
          </div>
          {e.flags?.last_action && (
            <div style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>
              LAST ACTION: {e.flags.last_action}
            </div>
          )}
        </div>
      ))}

      <hr className="divider"/>
      <button onClick={loadData} style={{
        width:"100%", padding:10, background:"transparent",
        border:"1px dashed #2a2a25", color:"var(--muted)",
        fontFamily:"var(--font)", fontSize:11, letterSpacing:2,
        cursor:"pointer", marginBottom:16,
      }}>↻ REFRESH DATA</button>

      <div style={{ textAlign:"center", fontSize:10, color:"var(--muted)", letterSpacing:1 }}>
        - - - - - - - - - - - - - - - - - -<br/>
        WITH GREAT POWER COMES GREAT<br/>MESS ACCOUNTABILITY.<br/>
        - - - - - - - - - - - - - - - - - -
      </div>
    </div>
  );
}