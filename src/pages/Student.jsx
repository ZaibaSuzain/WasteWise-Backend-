import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HOSTELS = ["Block A","Block B","Block C","Block D","Block E"];
const DISHES  = ["Lauki Curry","Jeera Rice","Dal Tadka"];
const SKIP_REASONS = [
  "it looked illegal","smelled sus",
  "didn't know what was being served","my body said no","other"
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display:"flex", gap:4 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          style={{ fontSize:20, cursor:"pointer",
            color: s <= (hover || value) ? "#ffaa00" : "#2a2a25",
            transition:"color 0.1s" }}
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

  const updateDish = (i, field, val) => {
    setDishes(prev => prev.map((d,idx) => idx===i ? {...d,[field]:val} : d));
  };

  const inputStyle = {
    width:"100%", padding:"10px 12px", background:"#111",
    border:"1px solid #2a2a25", color:"var(--text)",
    fontFamily:"var(--font)", fontSize:12, outline:"none",
    marginBottom:12,
  };
  const bigBtn = (active, color="#f5f5f0") => ({
    flex:1, padding:"14px 8px", background:"transparent",
    border:`1px solid ${active ? color : "#2a2a25"}`,
    color: active ? color : "var(--muted)",
    fontFamily:"var(--font)", fontSize:11, letterSpacing:2,
    cursor:"pointer", fontWeight: active ? 700 : 400,
    transition:"all 0.15s",
  });

  /* ── CONFIRMATION RECEIPT ── */
  if (submitted) return (
    <div className="page">
      <div style={{ textAlign:"center", paddingTop:24 }}>
        <div style={{ fontSize:32 }}>🧾</div>
        <div style={{ fontSize:16, fontWeight:700, letterSpacing:3, marginTop:8 }}>
          YOUR TESTIMONY HAS<br/>BEEN RECORDED
        </div>
      </div>
      <hr className="divider"/>
      <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:8 }}>ROLL NO</div>
      <div style={{ fontSize:13, marginBottom:16 }}>{roll || "—"}</div>
      {dishes.map((d,i) => (
        <div key={i} style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span>{d.name}</span>
            <span style={{ color:"#ffaa00" }}>{"★".repeat(d.stars)}{"☆".repeat(5-d.stars)}</span>
          </div>
          {d.comment && <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>"{d.comment}"</div>}
        </div>
      ))}
      <hr className="divider"/>
      <div style={{ textAlign:"center", fontSize:13, color:"var(--amber)", fontWeight:700, marginBottom:16 }}>
        the mess has been put on notice 📢
      </div>
      <button onClick={() => navigate("/")} style={{
        width:"100%", padding:14, background:"var(--text)", border:"none",
        color:"var(--bg)", fontFamily:"var(--font)", fontSize:12,
        fontWeight:700, letterSpacing:3, cursor:"pointer",
      }}>
        SEE TODAY'S FULL ROAST →
      </button>
    </div>
  );

  return (
    <div className="page">
      {/* header */}
      <div style={{ textAlign:"center", paddingTop:16, marginBottom:4 }}>
        <div style={{ fontSize:10, letterSpacing:3, color:"var(--muted)" }}>🧾 MESSY BUSINESS</div>
        <div style={{ fontSize:11, color:"var(--muted)", marginTop:6, letterSpacing:2 }}>
          STEP {step} OF 3 — {"─".repeat(step*6)}
        </div>
      </div>
      <hr className="divider"/>

      {/* ── STEP 1 ── */}
      {step === 1 && <>
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2, marginBottom:16 }}>
          spill your details
        </div>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>ROLL NUMBER</div>
        <input value={roll} onChange={e=>setRoll(e.target.value)}
          placeholder="e.g. 21CS042" style={inputStyle}/>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>HOSTEL</div>
        <select value={hostel} onChange={e=>setHostel(e.target.value)} style={{...inputStyle, marginBottom:16}}>
          <option value="">select hostel...</option>
          {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>

        <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:10 }}>WHICH MEAL?</div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[["breakfast","🌅"],["lunch","☀️"],["dinner","🌙"]].map(([m,e]) => (
            <button key={m} onClick={()=>setMeal(m)}
              style={bigBtn(meal===m,"#00cc66")}>
              {e}<br/>{m.toUpperCase()}
            </button>
          ))}
        </div>

        <button disabled={!roll||!hostel||!meal}
          onClick={()=>setStep(2)}
          style={{
            width:"100%", padding:14, background: (!roll||!hostel||!meal) ? "#111" : "var(--text)",
            border:"none", color: (!roll||!hostel||!meal) ? "var(--muted)" : "var(--bg)",
            fontFamily:"var(--font)", fontSize:12, fontWeight:700,
            letterSpacing:3, cursor: (!roll||!hostel||!meal) ? "not-allowed" : "pointer",
          }}>
          NEXT →
        </button>
      </>}

      {/* ── STEP 2 ── */}
      {step === 2 && <>
        <div style={{ fontSize:16, fontWeight:700, letterSpacing:1, marginBottom:16, lineHeight:1.4 }}>
          real talk — did you actually eat today?
        </div>

        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          <button onClick={()=>{setAte(true); setSkipReason("");}}
            style={bigBtn(ate===true,"#00cc66")}>
            ✅<br/>YES I SURVIVED
          </button>
          <button onClick={()=>setAte(false)}
            style={bigBtn(ate===false,"#ff3333")}>
            ❌<br/>NO I COULDN'T DO IT
          </button>
        </div>

        {ate===false && <>
          <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>WHY THOUGH?</div>
          <select value={skipReason} onChange={e=>setSkipReason(e.target.value)}
            style={inputStyle}>
            <option value="">select your trauma...</option>
            {SKIP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </>}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setStep(1)} style={{
            flex:1, padding:14, background:"transparent",
            border:"1px solid #2a2a25", color:"var(--muted)",
            fontFamily:"var(--font)", fontSize:12, letterSpacing:2, cursor:"pointer",
          }}>← BACK</button>
          <button disabled={ate===null||(ate===false&&!skipReason)}
            onClick={()=>setStep(3)}
            style={{
              flex:2, padding:14,
              background:(ate===null||(ate===false&&!skipReason))?"#111":"var(--text)",
              border:"none",
              color:(ate===null||(ate===false&&!skipReason))?"var(--muted)":"var(--bg)",
              fontFamily:"var(--font)", fontSize:12, fontWeight:700,
              letterSpacing:3, cursor:(ate===null||(ate===false&&!skipReason))?"not-allowed":"pointer",
            }}>
            NEXT →
          </button>
        </div>
      </>}

      {/* ── STEP 3 ── */}
      {step === 3 && <>
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:2, marginBottom:16 }}>
          rate the damage
        </div>

        {dishes.map((d,i) => (
          <div key={i} style={{
            border:"1px solid #2a2a25", padding:14,
            marginBottom:12,
          }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:10, letterSpacing:1 }}>
              {d.name}
            </div>
            <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, marginBottom:6 }}>RATING</div>
            <StarRating value={d.stars} onChange={v=>updateDish(i,"stars",v)}/>

            <div style={{ fontSize:11, color:"var(--muted)", letterSpacing:2, margin:"10px 0 6px" }}>PORTION</div>
            <div style={{ display:"flex", gap:6, marginBottom:10 }}>
              {[["😭","starving"],["😐","okay"],["🤢","too much"]].map(([e,p]) => (
                <button key={p} onClick={()=>updateDish(i,"portion",p)}
                  style={{
                    ...bigBtn(d.portion===p,"#ffaa00"),
                    flex:1, fontSize:10, padding:"8px 4px",
                  }}>
                  {e}<br/>{p.toUpperCase()}
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
            flex:1, padding:14, background:"transparent",
            border:"1px solid #2a2a25", color:"var(--muted)",
            fontFamily:"var(--font)", fontSize:12, letterSpacing:2, cursor:"pointer",
          }}>← BACK</button>
          <button onClick={()=>setSubmitted(true)} style={{
            flex:2, padding:14, background:"var(--text)", border:"none",
            color:"var(--bg)", fontFamily:"var(--font)", fontSize:12,
            fontWeight:700, letterSpacing:3, cursor:"pointer",
          }}>SUBMIT TESTIMONY →</button>
        </div>
      </>}

      <hr className="divider"/>
      <div style={{ textAlign:"center", fontSize:10, color:"var(--muted)", letterSpacing:1 }}>
        - - - - - - - - - - - - - - - - - -<br/>
        YOUR PAIN IS VALID. PROBABLY.<br/>
        - - - - - - - - - - - - - - - - - -
      </div>
    </div>
  );
}