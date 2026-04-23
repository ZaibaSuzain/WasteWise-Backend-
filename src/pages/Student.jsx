import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReview } from "../api";

const HOSTELS = ["Block A","Block B","Block C","Block D","Block E"];
const DISHES  = ["Irekai palya","Jeera Rice","Dal "];
const SKIP_REASONS = [
  "There was a cockroach in it🤮","smelled sus",
  "didn't know what was being served","my body said no","other"
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:6 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ fontSize:28, cursor:"pointer",
            color: s <= (hover || value) ? "#ffaa00" : "#1e293b",
            transition:"color 0.1s",
            filter: s <= (hover || value) ? "drop-shadow(0 0 6px rgba(255,170,0,0.5))" : "none",
          }}
        >★</span>
      ))}
    </div>
  );
}

export default function Student() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(1);
  const [roll, setRoll]       = useState("");
  const [hostel, setHostel]   = useState("");
  const [meal, setMeal]       = useState("");
  const [ate, setAte]         = useState(null);
  const [skipReason, setSkipReason] = useState("");
  const [dishes, setDishes]   = useState(
    DISHES.map(d => ({ name:d, stars:0, comment:"", portion:"" }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]   = useState(false);

  const updateDish = (i, field, val) => {
    setDishes(prev => prev.map((d,idx) => idx===i ? {...d,[field]:val} : d));
  };

  const handleSubmit = async () => {
  setSaving(true);
  for (const d of dishes) {
    await createReview({
      roll_number: roll,
      hostel,
      meal_type: meal,
      dish_name: d.name,
      rating: d.stars || 0,
      comment: d.comment,
      portion: d.portion,
      skipped: ate === false,
      skip_reason: skipReason || null,
    });
  }
  setSaving(false);
  setSubmitted(true);
};

  const inputStyle = {
    width:"100%", padding:"12px 16px",
    background:"#111827",
    border:"1px solid rgba(255,255,255,0.08)",
    color:"#f0f4ff",
    fontFamily:"'Outfit', sans-serif",
    fontSize:14, outline:"none",
    marginBottom:12, borderRadius:10,
    transition:"border-color 0.2s",
    boxSizing:"border-box",
  };

  /* ── CONFIRMATION RECEIPT ── */
  if (submitted) return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:24 }}>
        <div style={{ fontSize:48 }}>🧾</div>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:2, marginTop:12, color:"#f0f4ff" }}>
          YOUR TESTIMONY HAS<br/>BEEN RECORDED
        </div>
      </div>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"20px 0" }}/>
      <div style={{ fontSize:11, color:"#475569", letterSpacing:2, marginBottom:8 }}>Hostel ID</div>
      <div style={{ fontSize:13, marginBottom:16, color:"#f0f4ff" }}>{roll || "—"}</div>
      {dishes.map((d,i) => (
        <div key={i} style={{ marginBottom:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
            <span style={{ color:"#f0f4ff", fontWeight:600 }}>{d.name}</span>
            <span style={{ color:"#ffaa00" }}>{"★".repeat(d.stars)}{"☆".repeat(5-d.stars)}</span>
          </div>
          {d.comment && <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>"{d.comment}"</div>}
        </div>
      ))}
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"20px 0" }}/>
      <div style={{ textAlign:"center", fontSize:13, color:"#f59e0b", fontWeight:700, marginBottom:20 }}>
        the mess has been put on notice 📢
      </div>
      <button onClick={() => navigate("/")} style={{
        width:"100%", padding:"14px 20px",
        background:"linear-gradient(135deg, #f59e0b, #ef4444)",
        border:"none", borderRadius:10, color:"#fff",
        fontFamily:"'Outfit', sans-serif", fontSize:13,
        fontWeight:700, letterSpacing:2, cursor:"pointer",
        boxShadow:"0 4px 20px rgba(245,158,11,0.25)",
      }}>
        SEE TODAY'S FULL ROAST →
      </button>
    </div>
  );

  return (
    <div className="page">
      {/* PROGRESS BAR */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:11, color:"#475569", letterSpacing:1 }}>STEP {step} OF 3</span>
          <span style={{ fontSize:11, color:"#475569", letterSpacing:1 }}>
            {step === 1 ? "Your Details" : step === 2 ? "Did You Eat?" : "Rate the Food"}
          </span>
        </div>
        <div style={{ height:4, background:"#111827", borderRadius:99, overflow:"hidden" }}>
          <div style={{
            height:"100%", borderRadius:99,
            width: `${(step/3) * 100}%`,
            background:"linear-gradient(90deg, #f59e0b, #ef4444)",
            boxShadow:"0 0 10px rgba(245,158,11,0.4)",
            transition:"width 0.4s ease",
          }}/>
        </div>
      </div>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"0 0 20px" }}/>

      {/* ── STEP 1 ── */}
      {step === 1 && <>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:20, color:"#f0f4ff" }}>
          spill your details
        </div>

        <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", marginBottom:6, textTransform:"uppercase" }}>Roll Number</label>
        <input value={roll} onChange={e=>setRoll(e.target.value)}
          placeholder="e.g. 21CS042" style={inputStyle}/>

        <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", marginBottom:6, textTransform:"uppercase" }}>Hostel</label>
        <select value={hostel} onChange={e=>setHostel(e.target.value)} style={{...inputStyle, marginBottom:20}}>
          <option value="">select hostel...</option>
          {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>

        <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", marginBottom:10, textTransform:"uppercase" }}>Which Meal?</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
          {[["breakfast","🌅"],["lunch","☀️"],["dinner","🌙"]].map(([m,e]) => (
            <button key={m} onClick={()=>setMeal(m)} style={{
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:8,
              padding:"18px 8px",
              background: meal===m ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
              border: meal===m ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)",
              color: meal===m ? "#f59e0b" : "#64748b",
              fontFamily:"'Outfit', sans-serif",
              fontSize:11, fontWeight: meal===m ? 700 : 400,
              letterSpacing:1, borderRadius:12,
              cursor:"pointer", transition:"all 0.2s",
              boxShadow: meal===m ? "0 0 16px rgba(245,158,11,0.15)" : "none",
            }}>
              <span style={{ fontSize:24 }}>{e}</span>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <button disabled={!roll||!hostel||!meal} onClick={()=>setStep(2)} style={{
          width:"100%", padding:"14px 20px",
          background: (!roll||!hostel||!meal) ? "#1e293b" : "linear-gradient(135deg, #f59e0b, #ef4444)",
          border:"none", borderRadius:10,
          color: (!roll||!hostel||!meal) ? "#475569" : "#fff",
          fontFamily:"'Outfit', sans-serif", fontSize:13, fontWeight:700,
          letterSpacing:2, cursor: (!roll||!hostel||!meal) ? "not-allowed" : "pointer",
          boxShadow: (!roll||!hostel||!meal) ? "none" : "0 4px 20px rgba(245,158,11,0.25)",
          transition:"all 0.2s ease",
        }}>
          NEXT →
        </button>
      </>}

      {/* ── STEP 2 ── */}
      {step === 2 && <>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.5, marginBottom:20, color:"#f0f4ff", lineHeight:1.4 }}>
          real talk — did you actually eat today?
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <button onClick={()=>{setAte(true); setSkipReason("");}} style={{
            flex:1, padding:"20px 8px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            background: ate===true ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
            border: ate===true ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: ate===true ? "#10b981" : "#64748b",
            fontFamily:"'Outfit', sans-serif", fontSize:11, fontWeight: ate===true ? 700 : 400,
            letterSpacing:1, borderRadius:12, cursor:"pointer", transition:"all 0.2s",
          }}>
            <span style={{ fontSize:28 }}>✅</span>
            YES I SURVIVED
          </button>
          <button onClick={()=>setAte(false)} style={{
            flex:1, padding:"20px 8px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            background: ate===false ? "rgba(255,68,68,0.1)" : "rgba(255,255,255,0.03)",
            border: ate===false ? "1px solid rgba(255,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: ate===false ? "#ff4444" : "#64748b",
            fontFamily:"'Outfit', sans-serif", fontSize:11, fontWeight: ate===false ? 700 : 400,
            letterSpacing:1, borderRadius:12, cursor:"pointer", transition:"all 0.2s",
          }}>
            <span style={{ fontSize:28 }}>❌</span>
            NO I COULDN'T
          </button>
        </div>

        {ate===false && <>
          <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", marginBottom:6, textTransform:"uppercase" }}>Why Though?</label>
          <select value={skipReason} onChange={e=>setSkipReason(e.target.value)} style={inputStyle}>
            <option value="">select your trauma...</option>
            {SKIP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </>}

        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={()=>setStep(1)} style={{
            flex:1, padding:"14px 16px",
            background:"transparent",
            border:"1px solid rgba(255,255,255,0.08)",
            color:"#64748b", borderRadius:10,
            fontFamily:"'Outfit', sans-serif", fontSize:13,
            letterSpacing:1, cursor:"pointer", transition:"all 0.2s",
          }}>← BACK</button>
          <button disabled={ate===null||(ate===false&&!skipReason)} onClick={()=>setStep(3)} style={{
            flex:2, padding:"14px 20px",
            background:(ate===null||(ate===false&&!skipReason)) ? "#1e293b" : "linear-gradient(135deg, #f59e0b, #ef4444)",
            border:"none", borderRadius:10,
            color:(ate===null||(ate===false&&!skipReason)) ? "#475569" : "#fff",
            fontFamily:"'Outfit', sans-serif", fontSize:13, fontWeight:700,
            letterSpacing:2, cursor:(ate===null||(ate===false&&!skipReason)) ? "not-allowed" : "pointer",
            boxShadow:(ate===null||(ate===false&&!skipReason)) ? "none" : "0 4px 20px rgba(245,158,11,0.25)",
            transition:"all 0.2s ease",
          }}>
            NEXT →
          </button>
        </div>
      </>}

      {/* ── STEP 3 ── */}
      {step === 3 && <>
        <div style={{ fontSize:22, fontWeight:800, letterSpacing:-0.5, marginBottom:20, color:"#f0f4ff" }}>
          rate the damage
        </div>

        {dishes.map((d,i) => (
          <div key={i} style={{
            border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:16, padding:20, marginBottom:16,
            background:"rgba(255,255,255,0.02)",
          }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:14, letterSpacing:0.5, color:"#f0f4ff" }}>
              {d.name}
            </div>
            <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", marginBottom:8, textTransform:"uppercase" }}>Rating</label>
            <StarRating value={d.stars} onChange={v=>updateDish(i,"stars",v)}/>

            <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#64748b", margin:"14px 0 8px", textTransform:"uppercase" }}>Portion</label>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              {[["😭","starving"],["😐","okay"],["🤢","too much"]].map(([e,p]) => (
                <button key={p} onClick={()=>updateDish(i,"portion",p)} style={{
                  flex:1, padding:"10px 4px",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                  background: d.portion===p ? "rgba(245,158,11,0.1)" : "transparent",
                  border: d.portion===p ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: d.portion===p ? "#f59e0b" : "#64748b",
                  fontFamily:"'Outfit', sans-serif", fontSize:10,
                  fontWeight: d.portion===p ? 700 : 400,
                  letterSpacing:1, borderRadius:10, cursor:"pointer", transition:"all 0.2s",
                }}>
                  <span style={{ fontSize:18 }}>{e}</span>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            <input value={d.comment} onChange={e=>updateDish(i,"comment",e.target.value)}
              placeholder="it tasted like regret"
              style={{...inputStyle, marginBottom:0}}/>
          </div>
        ))}

        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={()=>setStep(2)} style={{
            flex:1, padding:"14px 16px",
            background:"transparent",
            border:"1px solid rgba(255,255,255,0.08)",
            color:"#64748b", borderRadius:10,
            fontFamily:"'Outfit', sans-serif", fontSize:13,
            letterSpacing:1, cursor:"pointer",
          }}>← BACK</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex:2, padding:"14px 20px",
            background: saving ? "#1e293b" : "linear-gradient(135deg, #f59e0b, #ef4444)",
            border:"none", borderRadius:10,
            color: saving ? "#475569" : "#fff",
            fontFamily:"'Outfit', sans-serif", fontSize:13,
            fontWeight:700, letterSpacing:2,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(245,158,11,0.25)",
            transition:"all 0.2s ease",
          }}>
            {saving ? "SAVING..." : "SUBMIT TESTIMONY →"}
          </button>
        </div>
      </>}

      <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"24px 0" }}/>
      <div style={{ textAlign:"center", fontSize:10, color:"#334155", letterSpacing:1 }}>
        — — — — — — — — — — — — — — — — —<br/>
        YOUR PAIN IS VALID. PROBABLY.<br/>
        — — — — — — — — — — — — — — — — —
      </div>
    </div>
  );
}