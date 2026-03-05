import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Chief() {
  const navigate = useNavigate();
  const [pwd, setPwd]         = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [noticed, setNoticed] = useState({});

  // data
  const [escalated, setEscalated]   = useState([]);
  const [shame, setShame]           = useState([]);
  const [monthly, setMonthly]       = useState({ waste: 0, money: 0, co2: 0, hunger: 0 });

  const login = () => {
    if (pwd === "chief123") { setLoggedIn(true); setError(""); }
    else setError("wrong password.");
  };

  // ── LOAD ALL DATA ─────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoISO = monthAgo.toISOString();

    // 1. Escalated issues
    const { data: escalationData } = await supabase
      .from("escalations")
      .select("*, flags(dish_name, days_flagged, last_action, status)")
      .order("days_ignored", { ascending: false });

    // 2. Monthly waste totals
    const { data: wasteData } = await supabase
      .from("waste_logs")
      .select("wasted_kg, money_wasted, co2_kg")
      .gte("created_at", monthAgoISO);

    // 3. Monthly skipped meals (hunger incidents)
    const { data: skipData } = await supabase
      .from("reviews")
      .select("id")
      .eq("skipped", true)
      .gte("created_at", monthAgoISO);

    // 4. Hall of shame — top 3 worst dishes by avg rating
    const { data: flagData } = await supabase
      .from("flags")
      .select("dish_name, avg_waste_kg, avg_rating, days_flagged")
      .order("avg_waste_kg", { ascending: false })
      .limit(3);

    // calculate monthly totals
    const totalWaste = wasteData?.reduce((s, w) => s + (w.wasted_kg   || 0), 0).toFixed(1) || 0;
    const totalMoney = wasteData?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || 0;
    const totalCO2   = wasteData?.reduce((s, w) => s + (w.co2_kg      || 0), 0).toFixed(1) || 0;
    const hunger     = skipData?.length || 0;

    setEscalated(escalationData || []);
    setShame(flagData || []);
    setMonthly({ waste: totalWaste, money: totalMoney, co2: totalCO2, hunger });
    setLoading(false);
  };

  useEffect(() => { if (loggedIn) loadData(); }, [loggedIn]);
  // ─────────────────────────────────────────────────────────────

  // ── SEND FORMAL NOTICE ────────────────────────────────────────
  const sendNotice = async (escalation) => {
    // update the linked flag's last_action
    if (escalation.flags?.dish_name) {
      await supabase
        .from("flags")
        .update({ last_action: "formal notice sent by chief warden" })
        .eq("dish_name", escalation.flags.dish_name);
    }
    setNoticed(p => ({ ...p, [escalation.id]: true }));
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
      <div style={{ textAlign:"center", paddingTop:32, marginBottom:16 }}>        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2 }}>the buck<br/>stops here</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>chief warden access only</div>
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

  /* ── LOADING ── */
  if (loading) return (
    <div className="page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:3 }}>LOADING CHIEF OVERVIEW...</div>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:16, marginBottom:4 }}>        <div style={{ fontSize:14, fontWeight:700, letterSpacing:3, marginTop:8 }}>CHIEF OVERVIEW</div>
      </div>
      <hr className="divider"/>

      {/* escalated issues */}
      <div style={{ fontSize:11, color:"#ff3333", letterSpacing:2, marginBottom:10 }}>◆ ESCALATED ISSUES</div>
      {escalated.length === 0 && (
        <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>
          no escalations right now. 👏
        </div>
      )}
      {escalated.map((e) => (
        <div key={e.id} style={{
          border:"1px solid #ff3333", background:"#110000",
          padding:12, marginBottom:10,
        }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>
            {e.flags?.dish_name || "Unknown dish"}
          </div>
          <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
            {e.days_ignored} DAYS IGNORED — LAST ACTION: {(e.flags?.last_action || "none").toUpperCase()}
          </div>
          {noticed[e.id] ? (
            <div style={{ fontSize:11, color:"#00cc66" }}>✓ FORMAL NOTICE SENT</div>
          ) : (
            <button onClick={() => sendNotice(e)} style={{
              padding:"8px 16px", background:"transparent",
              border:"1px solid #ff3333", color:"#ff3333",
              fontFamily:"var(--font)", fontSize:10, letterSpacing:2,
              cursor:"pointer", textTransform:"uppercase",
            }}>SEND FORMAL NOTICE</button>
          )}
        </div>
      ))}
      <hr className="divider"/>

      {/* monthly receipt */}
      <div style={{ fontSize:11, color:"var(--amber)", letterSpacing:2, marginBottom:10 }}>◆ MONTHLY RECEIPT</div>
      {[
        ["TOTAL WASTE",      `${monthly.waste} kg`],
        ["MONEY WASTED",     `₹${monthly.money}`],
        ["CO₂ EMITTED",      `${monthly.co2} kg`],
        ["HUNGER INCIDENTS", `${monthly.hunger}`],
      ].map(([l,r]) => (
        <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:6 }}>
          <span style={{ color:"var(--muted)" }}>{l}</span>
          <span style={{ fontWeight:700 }}>{r}</span>
        </div>
      ))}

      {/* hall of shame */}
      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, margin:"14px 0 8px" }}>🏆 HALL OF SHAME</div>
      {shame.length === 0 && (
        <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", padding:"8px 0" }}>
          no flagged dishes. mess is clean. 👏
        </div>
      )}
      {shame.map((d, i) => (
        <div key={d.dish_name} style={{ fontSize:12, marginBottom:6, display:"flex", justifyContent:"space-between" }}>
          <span>
            <span style={{ color:"#ff3333", marginRight:8 }}>#{i+1}</span>
            {d.dish_name}
          </span>
          <span style={{ color:"var(--muted)", fontSize:11 }}>
            {parseFloat(d.avg_waste_kg||0).toFixed(1)} kg wasted/day
          </span>
        </div>
      ))}

      <hr className="divider"/>
      <button onClick={loadData} style={{
        width:"100%", padding:10, background:"transparent",
        border:"1px dashed #2a2a25", color:"var(--muted)",
        fontFamily:"var(--font)", fontSize:11, letterSpacing:2,
        cursor:"pointer", marginBottom:8,
      }}>↻ REFRESH DATA</button>

      <button onClick={()=>alert("PDF export coming soon!")} style={{
        width:"100%", padding:14, background:"transparent",
        border:"1px solid var(--amber)", color:"var(--amber)",
        fontFamily:"var(--font)", fontSize:12, fontWeight:700,
        letterSpacing:3, cursor:"pointer", marginBottom:8,
      }}>DOWNLOAD AS PDF →</button>

      <div style={{ textAlign:"center", fontSize:10, color:"var(--muted)", letterSpacing:1, marginTop:8 }}>
        - - - - - - - - - - - - - - - - - -<br/>
        THE BUCK STOPS HERE.<br/>AND SO DOES THE BISIBELEBATH.<br/>
        - - - - - - - - - - - - - - - - - -
      </div>
    </div>
  );
}