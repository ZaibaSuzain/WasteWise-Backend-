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

  const [escalated, setEscalated]   = useState([]);
  const [shame, setShame]           = useState([]);
  const [monthly, setMonthly]       = useState({ waste: 0, money: 0, co2: 0, hunger: 0 });

  const login = () => {
    if (pwd === "chief123") { setLoggedIn(true); setError(""); }
    else setError("wrong password.");
  };

  const loadData = async () => {
    setLoading(true);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoISO = monthAgo.toISOString();

    const { data: escalationData } = await supabase
      .from("escalations")
      .select("*, flags(dish_name, days_flagged, last_action, status)")
      .order("days_ignored", { ascending: false });

    const { data: wasteData } = await supabase
      .from("waste_logs")
      .select("wasted_kg, money_wasted, co2_kg")
      .gte("created_at", monthAgoISO);

    const { data: skipData } = await supabase
      .from("reviews")
      .select("id")
      .eq("skipped", true)
      .gte("created_at", monthAgoISO);

    const { data: flagData } = await supabase
      .from("flags")
      .select("dish_name, avg_waste_kg, avg_rating, days_flagged")
      .order("avg_waste_kg", { ascending: false })
      .limit(3);

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

  const sendNotice = async (escalation) => {
    if (escalation.flags?.dish_name) {
      await supabase
        .from("flags")
        .update({ last_action: "formal notice sent by chief warden" })
        .eq("dish_name", escalation.flags.dish_name);
    }
    setNoticed(p => ({ ...p, [escalation.id]: true }));
  };

  const downloadPDF = () => {
    const { jsPDF } = require("jspdf");
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("WASTEWISE — CHIEF OVERVIEW", 105, y, { align: "center" });
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 105, y, { align: "center" });
    y += 12;

    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MONTHLY RECEIPT", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    [
      ["Total Waste",      `${monthly.waste} kg`],
      ["Money Wasted",     `Rs. ${monthly.money}`],
      ["CO2 Emitted",      `${monthly.co2} kg`],
      ["Hunger Incidents", `${monthly.hunger}`],
    ].forEach(([label, value]) => {
      doc.text(label, 20, y);
      doc.text(value, 190, y, { align: "right" });
      y += 7;
    });
    y += 5;

    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("HALL OF SHAME", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (shame.length === 0) {
      doc.text("No flagged dishes.", 20, y);
      y += 7;
    } else {
      shame.forEach((d, i) => {
        doc.text(`#${i+1} ${d.dish_name}`, 20, y);
        doc.text(`${parseFloat(d.avg_waste_kg||0).toFixed(1)} kg wasted/day`, 190, y, { align: "right" });
        y += 7;
      });
    }
    y += 5;

    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ESCALATED ISSUES", 20, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    if (escalated.length === 0) {
      doc.text("No escalations.", 20, y);
      y += 7;
    } else {
      escalated.forEach((e) => {
        doc.text(`${e.flags?.dish_name || "Unknown"}`, 20, y);
        doc.text(`${e.days_ignored} days ignored`, 190, y, { align: "right" });
        y += 7;
      });
    }
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("THE BUCK STOPS HERE. AND SO DOES THE BISIBELEBATH.", 105, y, { align: "center" });

    doc.save("wastewise-chief-report.pdf");
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f0f4ff",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14, outline: "none",
    marginBottom: 16, borderRadius: 10,
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  };

  /* ── LOGIN ── */
  if (!loggedIn) return (
    <div className="page">
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍💼</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5,
          color: "#f0f4ff", lineHeight: 1.3, marginBottom: 12 }}>
          the buck<br/>stops here
        </div>
        <div style={{
          display: "inline-block",
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.3)",
          color: "#f59e0b", fontSize: 11,
          fontWeight: 600, padding: "6px 14px",
          borderRadius: 20, letterSpacing: 0.5,
        }}>
          ⚠️ CHIEF WARDEN ACCESS ONLY
        </div>
      </div>
      <hr className="divider"/>
      <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 2, marginBottom: 6, fontWeight: 700 }}>PASSWORD</div>
      <input
        type="password"
        value={pwd}
        onChange={e => setPwd(e.target.value)}
        onKeyDown={e => e.key === "Enter" && login()}
        placeholder="enter password"
        style={inputStyle}
      />
      {error && <div style={{ color: "#ff4444", fontSize: 12, marginBottom: 12 }}>{error}</div>}
      <button onClick={login} style={{
        width: "100%", padding: "14px 20px",
        background: "linear-gradient(135deg, #f59e0b, #ef4444)",
        border: "none", borderRadius: 10, color: "#fff",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 13, fontWeight: 700,
        letterSpacing: 2, cursor: "pointer",
        boxShadow: "0 4px 20px rgba(245,158,11,0.25)",
        transition: "all 0.2s ease",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
      >LOGIN →</button>
    </div>
  );

  /* ── LOADING ── */
  if (loading) return (
    <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
      <div style={{ fontSize: 11, color: "#475569", letterSpacing: 3 }}>LOADING CHIEF OVERVIEW...</div>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div className="page">
      <div style={{ textAlign: "center", paddingTop: 16, marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 3, marginTop: 8 }}>CHIEF OVERVIEW</div>
      </div>
      <hr className="divider"/>

      {/* ESCALATED ISSUES */}
      <div style={{ fontSize: 11, color: "#ff4444", letterSpacing: 2, marginBottom: 10 }}>◆ ESCALATED ISSUES</div>
      {escalated.length === 0 && (
        <div style={{ fontSize: 11, color: "#475569", textAlign: "center", padding: "16px 0" }}>
          no escalations right now. 👏
        </div>
      )}
      {escalated.map((e) => (
        <div key={e.id} style={{
          border: "1px solid #ff4444",
          background: "linear-gradient(135deg, rgba(255,68,68,0.07), rgba(255,68,68,0.02))",
          padding: 16, marginBottom: 12, borderRadius: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: "#f0f4ff" }}>
            {e.flags?.dish_name || "Unknown dish"}
          </div>
          <div style={{ fontSize: 11, color: "#ff4444", letterSpacing: 0.5, marginBottom: 10 }}>
            {e.days_ignored} DAYS IGNORED — LAST ACTION: {(e.flags?.last_action || "none").toUpperCase()}
          </div>
          {noticed[e.id] ? (
            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ FORMAL NOTICE SENT</div>
          ) : (
            <button onClick={() => sendNotice(e)} style={{
              padding: "8px 16px", background: "transparent",
              border: "1px solid #ff4444", color: "#ff4444",
              fontFamily: "'Outfit', sans-serif", fontSize: 10,
              letterSpacing: 2, cursor: "pointer",
              textTransform: "uppercase", borderRadius: 8,
            }}>SEND FORMAL NOTICE</button>
          )}
        </div>
      ))}
      <hr className="divider"/>

      {/* MONTHLY RECEIPT */}
      <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: 2, marginBottom: 10 }}>◆ MONTHLY RECEIPT</div>
      {[
        ["TOTAL WASTE",      `${monthly.waste} kg`],
        ["MONEY WASTED",     `₹${monthly.money}`],
        ["CO₂ EMITTED",      `${monthly.co2} kg`],
        ["HUNGER INCIDENTS", `${monthly.hunger}`],
      ].map(([l, r]) => (
        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "#475569" }}>{l}</span>
          <span style={{ fontWeight: 700 }}>{r}</span>
        </div>
      ))}

      {/* HALL OF SHAME */}
      <div style={{ fontSize: 11, color: "#475569", letterSpacing: 2, margin: "14px 0 8px" }}>🏆 HALL OF SHAME</div>
      {shame.length === 0 && (
        <div style={{ fontSize: 11, color: "#475569", textAlign: "center", padding: "8px 0" }}>
          no flagged dishes. mess is clean. 👏
        </div>
      )}
      {shame.map((d, i) => (
        <div key={d.dish_name} style={{ fontSize: 12, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
          <span>
            <span style={{ color: "#ff4444", marginRight: 8 }}>#{i+1}</span>
            {d.dish_name}
          </span>
          <span style={{ color: "#475569", fontSize: 11 }}>
            {parseFloat(d.avg_waste_kg||0).toFixed(1)} kg wasted/day
          </span>
        </div>
      ))}

      <hr className="divider"/>

      <button onClick={loadData} style={{
        width: "100%", padding: 12,
        background: "transparent",
        border: "1px dashed rgba(255,255,255,0.1)",
        color: "#475569", borderRadius: 10,
        fontFamily: "'Outfit', sans-serif",
        fontSize: 11, letterSpacing: 2,
        cursor: "pointer", marginBottom: 8,
      }}>↻ REFRESH DATA</button>

      <button onClick={downloadPDF} style={{
        width: "100%", padding: 14,
        background: "transparent",
        border: "1px solid rgba(245,158,11,0.4)",
        color: "#f59e0b", borderRadius: 10,
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12, fontWeight: 700,
        letterSpacing: 3, cursor: "pointer", marginBottom: 8,
      }}>DOWNLOAD AS PDF →</button>

      <div style={{ textAlign: "center", fontSize: 10, color: "#334155", letterSpacing: 1, marginTop: 8, lineHeight: 2 }}>
        — — — — — — — — — — — — — — — — —<br/>
        THE BUCK STOPS HERE.<br/>AND SO DOES THE BISIBELEBATH.<br/>
        — — — — — — — — — — — — — — — — —
      </div>
    </div>
  );
}