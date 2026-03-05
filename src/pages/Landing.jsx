import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TODAY = new Date().toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});

function getMsg(score) {
  if (score < 3)  return { text: "they really said 💀",          color: "#ff3333" };
  if (score < 5)  return { text: "bhai kuch toh sharam karo 😬", color: "#ff3333" };
  if (score < 7)  return { text: "improvement? maybe? 👀",        color: "#ffaa00" };
  return              { text: "okay not bad ngl 👏",              color: "#00cc66" };
}

const DAY_LABELS = ["M","T","W","T","F","S","S"];

export default function Landing() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(0);
  const [lines, setLines]     = useState([]);
  const [ready, setReady]     = useState(false);

  // ── FETCH ALL STATS FROM SUPABASE ─────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      // 1. Today's waste
      const { data: todayWaste } = await supabase
        .from("waste_logs")
        .select("wasted_kg, money_wasted, dish_name")
        .gte("created_at", `${todayStr}T00:00:00`);

      const wasteToday = todayWaste?.reduce((s, w) => s + (w.wasted_kg    || 0), 0).toFixed(1) || "0.0";
      const moneyToday = todayWaste?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || "0";

      // worst dish today = highest wasted_kg
      const worstDish = todayWaste?.length
        ? todayWaste.reduce((a, b) => (a.wasted_kg > b.wasted_kg ? a : b)).dish_name
        : "N/A";

      // 2. Students who skipped today
      const { data: skipData } = await supabase
        .from("reviews")
        .select("id")
        .eq("skipped", true)
        .gte("created_at", `${todayStr}T00:00:00`);
      const skippedToday = skipData?.length || 0;

      // 3. This week's totals
      const { data: weekWaste } = await supabase
        .from("waste_logs")
        .select("wasted_kg, money_wasted")
        .gte("created_at", weekAgoISO);

      const weekWasteTotal = weekWaste?.reduce((s, w) => s + (w.wasted_kg    || 0), 0).toFixed(1) || "0.0";
      const weekMoneyTotal = weekWaste?.reduce((s, w) => s + (w.money_wasted || 0), 0).toFixed(0) || "0";

      // 4. Avg rating this week
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("rating")
        .gte("created_at", weekAgoISO);

      const avgRating = reviewData?.length
        ? (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1)
        : "0.0";

      // 5. Mess health score (rating * 2 to get out of 10)
      const score = parseFloat(avgRating) * 2 || 3.2;

      // 6. Ignored complaints (flags with status = open or acknowledged, 5+ days)
      const { data: flagData } = await supabase
        .from("flags")
        .select("dish_name, days_flagged, status")
        .in("status", ["open", "acknowledged", "escalated"])
        .gte("days_flagged", 5)
        .order("days_flagged", { ascending: false })
        .limit(3);

      // 7. Waste trend last 7 days
      const { data: trendData } = await supabase
        .from("waste_logs")
        .select("wasted_kg, created_at")
        .gte("created_at", weekAgoISO)
        .order("created_at", { ascending: true });

      // group by day of week
      const dayTotals = Array(7).fill(0);
      trendData?.forEach(w => {
        const day = new Date(w.created_at).getDay(); // 0=Sun..6=Sat
        const idx = day === 0 ? 6 : day - 1;         // Mon=0..Sun=6
        dayTotals[idx] += w.wasted_kg || 0;
      });
      const bars = dayTotals.map(v => parseFloat(v.toFixed(1)));

      // ── BUILD LINES ARRAY WITH REAL DATA ──────────────────────
      const builtLines = [
        { id: "gap0",   type: "gap" },
        { id: "logo",   type: "logo" },
        { id: "hostel", type: "center", text: "RAJIV GANDHI HOSTEL — BLOCK C" },
        { id: "date",   type: "center", text: `📅 ${TODAY}` },
        { id: "div0",   type: "divider" },

        { id: "dtitle", type: "label",     text: "◆ TODAY'S DAMAGE" },
        { id: "waste",  type: "row",       left: "WASTE TODAY",          right: `${wasteToday} kg 🗑️` },
        { id: "money",  type: "row",       left: "MONEY WASTED",         right: `₹${moneyToday}` },
        { id: "skip",   type: "row",       left: "STUDENTS WHO SKIPPED", right: `${skippedToday} 😶` },
        { id: "dish",   type: "row",       left: "WORST DISH TODAY",     right: `${worstDish} 💀`, rightColor: "#ff3333" },
        { id: "div1",   type: "divider" },

        { id: "wtitle", type: "label",     text: "◆ THIS WEEK SO FAR" },
        { id: "wwaste", type: "row",       left: "TOTAL WASTE",          right: `${weekWasteTotal} kg` },
        { id: "wmoney", type: "row",       left: "MONEY WASTED",         right: `₹${weekMoneyTotal}` },
        { id: "rating", type: "row",       left: "AVG MESS RATING",      right: `${avgRating} / 5 ⭐`, rightColor: parseFloat(avgRating) < 3 ? "#ff3333" : "#ffaa00" },
        { id: "menu",   type: "row",       left: "MENU UNCHANGED FOR",   right: "6 DAYS 😐", rightColor: "#ffaa00" },
        { id: "div2",   type: "divider" },

        { id: "stitle", type: "label",     text: "◆ MESS HEALTH SCORE" },
        { id: "score",  type: "score",     value: score },
        { id: "msg",    type: "msg",       value: score },
        { id: "div3",   type: "divider" },

        { id: "ctitle", type: "label",     text: "◆ CURRENTLY IGNORED 🙈" },
        ...(flagData?.length
          ? flagData.map((f, i) => ({
              id: `c${i}`, type: "complaint",
              days: f.days_flagged,
              text: `${f.dish_name} flagged for ${f.days_flagged} days`,
            }))
          : [{ id: "c0", type: "center", text: "nothing ignored right now 👀", muted: true }]
        ),
        { id: "div4",   type: "divider" },

        { id: "trend",  type: "label",     text: "◆ WASTE TREND (MON–SUN)" },
        { id: "chart",  type: "chart",     bars },
        { id: "div5",   type: "divider" },

        { id: "tip",    type: "center",    text: "💡 TIP: EAT WHAT YOU TAKE", muted: true },
        { id: "footer", type: "footer" },
        { id: "btn",    type: "button" },
        { id: "gap1",   type: "gap" },
      ];

      setLines(builtLines);
      setReady(true);
    };

    fetchStats();
  }, []);
  // ─────────────────────────────────────────────────────────────

  // animate lines one by one after data is ready
  useEffect(() => {
    if (!ready) return;
    if (visible >= lines.length) return;
    const t = setTimeout(() => setVisible(v => v + 1), 80);
    return () => clearTimeout(t);
  }, [visible, ready, lines.length]);

  const renderLine = (line) => {
    switch (line.type) {

      case "gap":
        return <div style={{ height: 16 }} />;

      case "logo":
        return (
          <div style={{ textAlign: "center", marginBottom: 4 }}>            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6, lineHeight: 1.2 }}>
              MESS<br/>RECEIPT
            </div>
          </div>
        );

      case "center":
        return (
          <div style={{
            textAlign: "center", fontSize: 11,
            color: line.muted ? "var(--muted)" : "var(--text)",
            letterSpacing: 1, marginBottom: 2,
          }}>
            {line.text}
          </div>
        );

      case "divider":
        return <hr className="divider" style={{ margin: "10px 0" }} />;

      case "label":
        return (
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 2,
            color: "var(--amber)", marginBottom: 8, marginTop: 4,
          }}>
            {line.text}
          </div>
        );

      case "row":
        return (
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 12, marginBottom: 6,
          }}>
            <span style={{ color: "var(--muted)" }}>{line.left}</span>
            <span style={{ color: line.rightColor || "var(--text)", fontWeight: 700 }}>
              {line.right}
            </span>
          </div>
        );

      case "score": {
        const pct = (line.value / 10) * 100;
        const col = line.value < 5 ? "#ff3333" : line.value < 7 ? "#ffaa00" : "#00cc66";
        return (
          <div style={{ textAlign: "center", margin: "8px 0" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: col, lineHeight: 1 }}>
              {line.value.toFixed(1)}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 2, marginTop: 4 }}>
              OUT OF 10
            </div>
            <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, margin: "10px 0 4px" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: col, borderRadius: 3, transition: "width 1s ease",
              }} />
            </div>
          </div>
        );
      }

      case "msg": {
        const { text, color } = getMsg(line.value);
        return (
          <div style={{
            textAlign: "center", fontSize: 13, fontWeight: 700,
            color, letterSpacing: 1, marginBottom: 4,
          }}>
            {text}
          </div>
        );
      }

      case "complaint":
        return (
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 12, marginBottom: 8, alignItems: "flex-start",
          }}>
            <span style={{ color: "var(--text)", flex: 1 }}>• {line.text}</span>
            <span style={{
              color: "#ff3333", fontSize: 10, fontWeight: 700,
              letterSpacing: 1, marginLeft: 8, whiteSpace: "nowrap",
              border: "1px solid #ff3333", padding: "1px 6px",
            }}>
              {line.days}d ignored
            </span>
          </div>
        );

      case "chart": {
        const bars = line.bars || [];
        const max  = Math.max(...bars, 1);
        return (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, marginBottom: 4 }}>
            {bars.map((val, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: "var(--muted)" }}>{val}</div>
                <div style={{
                  width: "100%",
                  height: `${(val / max) * 44}px`,
                  background: val === max ? "#ff3333" : val > 3 ? "#ffaa00" : "#00cc66",
                  minHeight: val > 0 ? 2 : 0,
                }} />
                <div style={{ fontSize: 9, color: "var(--muted)" }}>{DAY_LABELS[i]}</div>
              </div>
            ))}
          </div>
        );
      }

      case "footer":
        return (
          <div style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
            - - - - - - - - - - - - - - - - - -<br />
            NO FOOD WASTAGE. NO EXCUSES.<br />
            PRINT TIME: {new Date().toLocaleTimeString("en-IN")}<br />
            - - - - - - - - - - - - - - - - - -
          </div>
        );

      case "button":
        return (
          <button
            onClick={() => navigate("/enter")}
            style={{
              width: "100%", marginTop: 16, padding: "14px",
              background: "var(--text)", border: "none",
              color: "var(--bg)", fontFamily: "var(--font)",
              fontSize: "12px", fontWeight: 700,
              letterSpacing: "3px", cursor: "pointer",
            }}
          >
            OKAY BUT WHO DID THIS →
          </button>
        );

      default: return null;
    }
  };


  // show loading state while fetching
  if (!ready) return (
    <div style={{ textAlign: "center", paddingTop: 140 }}>
      <div style={heroBadge}>🧾 Hostel Mess Accountability</div>
      <h1 style={heroH1}>Welcome to <span style={heroSpan}>WasteWise</span></h1>
      <p style={heroSub}>Real-time mess accountability for students, kitchen staff and wardens.</p>
      <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 40 }}>Loading today's data...</div>
    </div>
  );

  return (
    <div style={{ paddingTop: 0 }}>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "80px 24px 48px",
        textAlign: "center",
      }}>
        <div style={heroBadge}>🧾 Hostel Mess Accountability</div>
        <h1 style={heroH1}>
          Welcome to <span style={heroSpan}>WasteWise</span>
        </h1>
        <p style={heroSub}>
          Track food waste. Flag bad dishes. Escalate ignored issues.<br/>
          Real-time accountability for every meal.
        </p>
        <div style={{ display:"flex", justifyContent:"center", marginTop:28 }}>
          <button onClick={() => navigate("/enter")} style={{
            padding:"12px 28px",
            background:"linear-gradient(135deg, #f59e0b, #ef4444)",
            border:"none", borderRadius:8, color:"#fff",
            fontFamily:"var(--font)", fontSize:14, fontWeight:700,
            cursor:"pointer", boxShadow:"0 4px 20px rgba(245,158,11,0.35)",
          }}>Get Started →</button>
        </div>
      </div>

      {/* RECEIPT */}
      <div className="page" style={{ paddingTop: 32 }}>
        {lines.slice(0, visible).map((line) => (
          <div key={line.id} style={{ animation: "fadeIn 0.15s ease" }}>
            {renderLine(line)}
          </div>
        ))}
        {visible < lines.length && (
          <span style={{
            display:"inline-block", width:8, height:14,
            background:"var(--text)",
            animation:"blink 0.6s step-end infinite",
            verticalAlign:"middle", marginTop:4,
          }} />
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
        @keyframes blink  { 0%,100%{opacity:1;} 50%{opacity:0;} }
      `}</style>
    </div>
  );
}

const heroBadge = {
  display:"inline-block",
  background:"rgba(245,158,11,0.12)",
  border:"1px solid rgba(245,158,11,0.3)",
  color:"#f59e0b", fontSize:12, fontWeight:600,
  padding:"5px 14px", borderRadius:20,
  letterSpacing:"0.5px", marginBottom:20,
};
const heroH1 = {
  fontSize:"clamp(32px, 6vw, 52px)",
  fontWeight:800, letterSpacing:"-1px", lineHeight:1.15,
  marginBottom:16, color:"#f0f4ff",
};
const heroSpan = {
  background:"linear-gradient(135deg, #f59e0b, #ef4444)",
  WebkitBackgroundClip:"text",
  WebkitTextFillColor:"transparent",
  backgroundClip:"text",
};
const heroSub = {
  fontSize:16, color:"#94a3b8", lineHeight:1.7,
  maxWidth:480, margin:"0 auto",
};