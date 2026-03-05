import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const RATE = 140;
const CO2_FACTOR = 2.5;

const emptyDish = () => ({ name:"", cooked:"", consumed:"" });

export default function Kitchen() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [staffId, setStaffId] = useState("");
  const [pin, setPin]         = useState("");
  const [meal, setMeal]       = useState("");
  const [dishes, setDishes]   = useState([emptyDish()]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateDish = (i, f, v) =>
    setDishes(prev => prev.map((d,idx) => idx===i ? {...d,[f]:v} : d));

  const calc = (d) => {
    const wasted = Math.max(0, parseFloat(d.cooked||0) - parseFloat(d.consumed||0));
    return { wasted, money: wasted*RATE, co2: wasted*CO2_FACTOR };
  };

  const totals = dishes.reduce((acc,d) => {
    const c = calc(d);
    return { wasted: acc.wasted+c.wasted, money: acc.money+c.money, co2: acc.co2+c.co2 };
  }, { wasted:0, money:0, co2:0 });

  // ── SAVE TO SUPABASE ──────────────────────────────────────────
  const handleSubmit = async () => {
    setSaving(true);
    setSaveError("");

    const validDishes = dishes.filter(d => d.name.trim());

    if (validDishes.length === 0) {
      setSaveError("Add at least one dish before submitting.");
      setSaving(false);
      return;
    }

    // 1. Save each dish to waste_logs
    const wasteLogs = validDishes.map(d => {
      const c = calc(d);
      return {
        staff_id:    staffId,
        meal_type:   meal,
        dish_name:   d.name.trim(),
        cooked_kg:   parseFloat(d.cooked  || 0),
        consumed_kg: parseFloat(d.consumed || 0),
        wasted_kg:   c.wasted,
        money_wasted: c.money,
        co2_kg:      c.co2,
      };
    });

    const { error: wasteError } = await supabase
      .from("waste_logs")
      .insert(wasteLogs);

    if (wasteError) {
      setSaveError("Failed to save: " + wasteError.message);
      setSaving(false);
      return;
    }

    // 2. For dishes with waste >= 5kg, upsert into flags
    const flaggedDishes = validDishes.filter(d => calc(d).wasted >= 5);

    for (const d of flaggedDishes) {
      const c = calc(d);

      // Check if this dish is already flagged
      const { data: existing } = await supabase
        .from("flags")
        .select("*")
        .eq("dish_name", d.name.trim())
        .neq("status", "resolved")
        .maybeSingle();

      if (existing) {
        // Update existing flag — increment days, recalculate averages
        await supabase
          .from("flags")
          .update({
            days_flagged: existing.days_flagged + 1,
            avg_waste_kg: ((existing.avg_waste_kg * existing.days_flagged) + c.wasted) / (existing.days_flagged + 1),
            status: existing.days_flagged + 1 >= 3 ? "escalated" : existing.status,
          })
          .eq("id", existing.id);
      } else {
        // Create new flag
        await supabase
          .from("flags")
          .insert([{
            dish_name:   d.name.trim(),
            days_flagged: 1,
            avg_waste_kg: c.wasted,
            avg_rating:  null,
            status:      "open",
            last_action: null,
          }]);
      }
    }

    setSaving(false);
    setSubmitted(true);
  };
  // ─────────────────────────────────────────────────────────────

  const inputStyle = {
    width:"100%", padding:"10px 12px", background:"#111",
    border:"1px solid #2a2a25", color:"var(--text)",
    fontFamily:"var(--font)", fontSize:12, outline:"none", marginBottom:10,
  };
  const bigBtn = (active, color="#f5f5f0") => ({
    flex:1, padding:"12px 6px", background:"transparent",
    border:`1px solid ${active ? color : "#2a2a25"}`,
    color: active ? color : "var(--muted)",
    fontFamily:"var(--font)", fontSize:10, letterSpacing:2,
    cursor:"pointer", fontWeight: active ? 700 : 400, transition:"all 0.15s",
  });

  /* ── DAMAGE REPORT ── */
  if (submitted) return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:16 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:"var(--muted)" }}>🧾 DAMAGE REPORT</div>
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2, marginTop:8 }}>
          TODAY'S NUMBERS<br/>ARE IN
        </div>
        <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{meal.toUpperCase()} — STAFF: {staffId}</div>
      </div>
      <hr className="divider"/>

      {dishes.filter(d=>d.name).map((d,i) => {
        const c = calc(d);
        const flagged = c.wasted >= 5;
        return (
          <div key={i} style={{
            border:`1px solid ${flagged?"#ff3333":"#2a2a25"}`,
            padding:12, marginBottom:10,
            background: flagged ? "#110000" : "transparent",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, fontWeight:700 }}>
                {flagged && "⚠️ "}{d.name}
              </span>
              {flagged && <span style={{ fontSize:10, color:"#ff3333", border:"1px solid #ff3333", padding:"1px 6px" }}>FLAGGED</span>}
            </div>
            <div style={{ fontSize:11, display:"flex", justifyContent:"space-between", color:"var(--muted)" }}>
              <span>WASTED</span><span style={{ color: flagged?"#ff3333":"var(--text)" }}>{c.wasted.toFixed(1)} kg</span>
            </div>
            <div style={{ fontSize:11, display:"flex", justifyContent:"space-between", color:"var(--muted)" }}>
              <span>MONEY</span><span>₹{c.money.toFixed(0)}</span>
            </div>
            <div style={{ fontSize:11, display:"flex", justifyContent:"space-between", color:"var(--muted)" }}>
              <span>CO₂</span><span>{c.co2.toFixed(1)} kg</span>
            </div>
          </div>
        );
      })}

      <hr className="divider"/>
      <div style={{ fontSize:12 }}>
        {[["TOTAL WASTE", `${totals.wasted.toFixed(1)} kg`],
          ["MONEY WASTED", `₹${totals.money.toFixed(0)}`],
          ["CO₂ EMITTED", `${totals.co2.toFixed(1)} kg`]
        ].map(([l,r]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ color:"var(--muted)" }}>{l}</span>
            <span style={{ fontWeight:700 }}>{r}</span>
          </div>
        ))}
      </div>
      <hr className="divider"/>
      <div style={{ fontSize:11, color:"#ff3333", textAlign:"center", marginBottom:16, letterSpacing:1 }}>
        ⚠️ flagged dishes have been added to the accountability wall
      </div>
      <button onClick={()=>navigate("/")} style={{
        width:"100%", padding:14, background:"var(--text)", border:"none",
        color:"var(--bg)", fontFamily:"var(--font)", fontSize:12,
        fontWeight:700, letterSpacing:3, cursor:"pointer",
      }}>BACK TO HOME →</button>
    </div>
  );

  return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:16, marginBottom:4 }}>        <div style={{ fontSize:11, color:"var(--muted)", marginTop:6, letterSpacing:2 }}>
          STEP {step} OF 2 — {"─".repeat(step*10)}
        </div>
      </div>
      <hr className="divider"/>

      {/* ── STEP 1 ── */}
      {step===1 && <>
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2, marginBottom:16 }}>staff login</div>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>STAFF ID</div>
        <input value={staffId} onChange={e=>setStaffId(e.target.value)}
          placeholder="e.g. KS-042" style={inputStyle}/>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>PIN</div>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
          placeholder="••••" style={inputStyle}/>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:10 }}>MEAL</div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[["breakfast","🌅"],["lunch","☀️"],["dinner","🌙"]].map(([m,e]) => (
            <button key={m} onClick={()=>setMeal(m)} style={bigBtn(meal===m,"#ffaa00")}>
              {e}<br/>{m.toUpperCase()}
            </button>
          ))}
        </div>

        <button disabled={!staffId||!pin||!meal}
          onClick={()=>setStep(2)}
          style={{
            width:"100%", padding:14,
            background:(!staffId||!pin||!meal)?"#111":"var(--text)",
            border:"none",
            color:(!staffId||!pin||!meal)?"var(--muted)":"var(--bg)",
            fontFamily:"var(--font)", fontSize:12, fontWeight:700,
            letterSpacing:3, cursor:(!staffId||!pin||!meal)?"not-allowed":"pointer",
          }}>
          NEXT →
        </button>
      </>}

      {/* ── STEP 2 ── */}
      {step===2 && <>
        <div style={{ fontSize:13, fontWeight:700, letterSpacing:1, marginBottom:16, lineHeight:1.5 }}>
          today's numbers<br/>
          <span style={{ color:"var(--muted)", fontSize:11, fontWeight:400 }}>
            (be honest, no one's judging you personally)
          </span>
        </div>

        {dishes.map((d,i) => {
          const c = calc(d);
          return (
            <div key={i} style={{ border:"1px solid #2a2a25", padding:12, marginBottom:10 }}>
              <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>
                DISH {i+1}
              </div>
              <input value={d.name} onChange={e=>updateDish(i,"name",e.target.value)}
                placeholder="dish name" style={inputStyle}/>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1, marginBottom:4 }}>COOKED (kg)</div>
                  <input type="number" value={d.cooked} onChange={e=>updateDish(i,"cooked",e.target.value)}
                    placeholder="0.0" style={{...inputStyle, marginBottom:0}}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1, marginBottom:4 }}>CONSUMED (kg)</div>
                  <input type="number" value={d.consumed} onChange={e=>updateDish(i,"consumed",e.target.value)}
                    placeholder="0.0" style={{...inputStyle, marginBottom:0}}/>
                </div>
              </div>
              {(d.cooked||d.consumed) && (
                <div style={{ marginTop:10, padding:"8px", background:"#0d0d0d", fontSize:11 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ color:"var(--muted)" }}>WASTED</span>
                    <span style={{ color: c.wasted>=5?"#ff3333":"var(--text)", fontWeight:700 }}>
                      {c.wasted>=5 && "⚠️ "}{c.wasted.toFixed(1)} kg
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ color:"var(--muted)" }}>₹ WASTED</span>
                    <span>₹{c.money.toFixed(0)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"var(--muted)" }}>CO₂</span>
                    <span>{c.co2.toFixed(1)} kg</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={()=>setDishes(p=>[...p,emptyDish()])} style={{
          width:"100%", padding:10, background:"transparent",
          border:"1px dashed #2a2a25", color:"var(--muted)",
          fontFamily:"var(--font)", fontSize:11, letterSpacing:2,
          cursor:"pointer", marginBottom:16,
        }}>+ ADD DISH</button>

        {/* running totals */}
        <div style={{ border:"1px solid #2a2a25", padding:12, marginBottom:16, background:"#0a0a0a" }}>
          <div style={{ fontSize:11, color:"var(--amber)", letterSpacing:2, marginBottom:8 }}>◆ RUNNING TOTAL</div>
          {[["TOTAL WASTED",`${totals.wasted.toFixed(1)} kg`],
            ["MONEY WASTED",`₹${totals.money.toFixed(0)}`],
            ["CO₂ EMITTED",`${totals.co2.toFixed(1)} kg`]
          ].map(([l,r]) => (
            <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
              <span style={{ color:"var(--muted)" }}>{l}</span>
              <span style={{ fontWeight:700, color: l.includes("WASTED")&&totals.wasted>=5?"#ff3333":"var(--text)" }}>{r}</span>
            </div>
          ))}
        </div>

        {/* error message if save fails */}
        {saveError && (
          <div style={{ fontSize:11, color:"#ff3333", marginBottom:12, textAlign:"center", letterSpacing:1 }}>
            ⚠️ {saveError}
          </div>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setStep(1)} style={{
            flex:1, padding:14, background:"transparent",
            border:"1px solid #2a2a25", color:"var(--muted)",
            fontFamily:"var(--font)", fontSize:12, letterSpacing:2, cursor:"pointer",
          }}>← BACK</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex:2, padding:14,
            background: saving ? "#111" : "var(--text)",
            border:"none",
            color: saving ? "var(--muted)" : "var(--bg)",
            fontFamily:"var(--font)", fontSize:12,
            fontWeight:700, letterSpacing:3,
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "SAVING..." : "SUBMIT REPORT →"}
          </button>
        </div>
      </>}
    </div>
  );
}