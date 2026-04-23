import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWasteLog} from "../api";

const RATE = 140;
const CO2_FACTOR = 2.5;
const emptyDish = () => ({ name: "", cooked: "", consumed: "" });

export default function Kitchen() {
  const navigate = useNavigate();
  const [step, setStep]           = useState(1);
  const [staffId, setStaffId]     = useState("");
  const [meal, setMeal]           = useState("");
  const [dishes, setDishes]       = useState([emptyDish()]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateDish = (i, f, v) =>
    setDishes(prev => prev.map((d, idx) => idx === i ? { ...d, [f]: v } : d));

  const calc = (d) => {
    const wasted = Math.max(0, parseFloat(d.cooked || 0) - parseFloat(d.consumed || 0));
    return { wasted, money: wasted * RATE, co2: wasted * CO2_FACTOR };
  };

  const totals = dishes.reduce((acc, d) => {
    const c = calc(d);
    return { wasted: acc.wasted + c.wasted, money: acc.money + c.money, co2: acc.co2 + c.co2 };
  }, { wasted: 0, money: 0, co2: 0 });

  const handleSubmit = async () => {
  setSaving(true);
  setSaveError("");
  const validDishes = dishes.filter(d => d.name.trim());
  if (validDishes.length === 0) {
    setSaveError("Add at least one dish before submitting.");
    setSaving(false);
    return;
  }
  for (const d of validDishes) {
    const c = calc(d);
    await createWasteLog({
      staff_id: staffId,
      meal_type: meal,
      dish_name: d.name.trim(),
      cooked_kg: parseFloat(d.cooked || 0),
      consumed_kg: parseFloat(d.consumed || 0),
      wasted_kg: c.wasted,
      money_wasted: c.money,
      co2_kg: c.co2,
    });
  }
  setSaving(false);
  setSubmitted(true);
};

  // ── SUBMITTED ──
  if (submitted) return (
    <div style={s.page}>
      <div style={s.successIcon}>✅</div>
      <div style={s.successTitle}>TODAY'S NUMBERS<br />ARE IN</div>
      <div style={s.successSub}>{meal.toUpperCase()} — STAFF: {staffId}</div>
      <div style={s.divider} />

      {dishes.filter(d => d.name).map((d, i) => {
        const c = calc(d);
        const flagged = c.wasted >= 5;
        return (
          <div key={i} style={{ ...s.dishCard, ...(flagged ? s.dishCardDanger : {}) }}>
            <div style={s.dishCardHeader}>
              <span style={s.dishName}>{flagged && "⚠️ "}{d.name}</span>
              {flagged && <span style={s.flaggedBadge}>FLAGGED</span>}
            </div>
            {[["WASTED", `${c.wasted.toFixed(1)} kg`, flagged ? "#ff4444" : "#f0f4ff"],
              ["MONEY",  `₹${c.money.toFixed(0)}`,    "#f59e0b"],
              ["CO₂",   `${c.co2.toFixed(1)} kg`,     "#94a3b8"],
            ].map(([l, r, col]) => (
              <div key={l} style={s.statRow}>
                <span style={s.statLabel}>{l}</span>
                <span style={{ ...s.statValue, color: col }}>{r}</span>
              </div>
            ))}
          </div>
        );
      })}

      <div style={s.divider} />
      <div style={s.totalCard}>
        <div style={s.sectionLabel}>◆ TOTAL DAMAGE</div>
        {[["TOTAL WASTE", `${totals.wasted.toFixed(1)} kg`, "#ff4444"],
          ["MONEY WASTED", `₹${totals.money.toFixed(0)}`, "#f59e0b"],
          ["CO₂ EMITTED", `${totals.co2.toFixed(1)} kg`, "#94a3b8"],
        ].map(([l, r, col]) => (
          <div key={l} style={s.statRow}>
            <span style={s.statLabel}>{l}</span>
            <span style={{ ...s.statValue, color: col }}>{r}</span>
          </div>
        ))}
      </div>

      {totals.wasted >= 5 && (
        <div style={s.warningBox}>
          ⚠️ flagged dishes have been added to the accountability wall
        </div>
      )}

      <button onClick={() => navigate("/")} style={s.primaryBtn}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
      >BACK TO HOME →</button>
    </div>
  );

  return (
    <div style={s.page}>

      {/* progress */}
      <div style={s.progressWrap}>
        <div style={s.progressInfo}>
          <span style={s.stepText}>STEP {step} OF 2</span>
          <span style={s.stepText}>{step === 1 ? "Staff Login" : "Log Dishes"}</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${step * 50}%` }} />
        </div>
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div style={s.fadeIn}>
          <div style={s.pageTitle}>Staff login</div>
          <div style={s.pageSub}>Enter your credentials to continue</div>
          <div style={s.divider} />

          <label style={s.label}>STAFF ID</label>
          <input
            value={staffId} onChange={e => setStaffId(e.target.value)}
            placeholder="e.g. KS-042" style={s.input}
            onFocus={e => e.target.style.borderColor = "#f59e0b"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
          />


          <label style={s.label}>MEAL</label>
          <div style={s.mealGrid}>
            {[["breakfast", "🌅"], ["lunch", "☀️"], ["dinner", "🌙"]].map(([m, e]) => (
              <button key={m} onClick={() => setMeal(m)} style={{
                ...s.mealBtn,
                ...(meal === m ? s.mealBtnActive : {}),
              }}
                onMouseEnter={ev => { if (meal !== m) ev.currentTarget.style.borderColor = "rgba(245,158,11,0.4)"; }}
                onMouseLeave={ev => { if (meal !== m) ev.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <span style={{ fontSize: 24 }}>{e}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>{m.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <button
           disabled={!staffId || !meal}
          onClick={() => setStep(2)}
          style={{ ...s.primaryBtn, ...(!staffId || !meal ? s.btnDisabled : {}) }}
          onMouseEnter={e => { if (staffId && meal) e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >NEXT →</button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div style={s.fadeIn}>
          <div style={s.pageTitle}>log today's numbers</div>
          <div style={s.pageSub}>Be honest, no one's judging you personally</div>
          <div style={s.divider} />

          {dishes.map((d, i) => {
            const c = calc(d);
            const flagged = c.wasted >= 5;
            return (
              <div key={i} style={{ ...s.dishCard, ...(flagged ? s.dishCardDanger : {}) }}>
                <div style={s.sectionLabel}>DISH {i + 1} {flagged && "⚠️"}</div>
                <input
                  value={d.name} onChange={e => updateDish(i, "name", e.target.value)}
                  placeholder="dish name" style={s.input}
                  onFocus={e => e.target.style.borderColor = "#f59e0b"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <div style={s.kgGrid}>
                  <div>
                    <label style={s.label}>COOKED (kg)</label>
                    <input type="number" value={d.cooked} onChange={e => updateDish(i, "cooked", e.target.value)}
                      placeholder="0.0" style={{ ...s.input, marginBottom: 0 }}
                      onFocus={e => e.target.style.borderColor = "#f59e0b"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                  <div>
                    <label style={s.label}>CONSUMED (kg)</label>
                    <input type="number" value={d.consumed} onChange={e => updateDish(i, "consumed", e.target.value)}
                      placeholder="0.0" style={{ ...s.input, marginBottom: 0 }}
                      onFocus={e => e.target.style.borderColor = "#f59e0b"}
                      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                    />
                  </div>
                </div>

                {(d.cooked || d.consumed) && (
                  <div style={s.liveCalc}>
                    {[["WASTED", `${c.wasted >= 5 ? "⚠️ " : ""}${c.wasted.toFixed(1)} kg`, c.wasted >= 5 ? "#ff4444" : "#10b981"],
                      ["₹ WASTED", `₹${c.money.toFixed(0)}`, "#f59e0b"],
                      ["CO₂", `${c.co2.toFixed(1)} kg`, "#94a3b8"],
                    ].map(([l, r, col]) => (
                      <div key={l} style={s.statRow}>
                        <span style={s.statLabel}>{l}</span>
                        <span style={{ ...s.statValue, color: col }}>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => setDishes(p => [...p, emptyDish()])} style={s.addBtn}>
            + ADD DISH
          </button>

          {/* running total */}
          <div style={s.totalCard}>
            <div style={s.sectionLabel}>◆ RUNNING TOTAL</div>
            {[["TOTAL WASTED", `${totals.wasted.toFixed(1)} kg`, totals.wasted >= 5 ? "#ff4444" : "#f0f4ff"],
              ["MONEY WASTED", `₹${totals.money.toFixed(0)}`, "#f59e0b"],
              ["CO₂ EMITTED", `${totals.co2.toFixed(1)} kg`, "#94a3b8"],
            ].map(([l, r, col]) => (
              <div key={l} style={s.statRow}>
                <span style={s.statLabel}>{l}</span>
                <span style={{ ...s.statValue, color: col }}>{r}</span>
              </div>
            ))}
          </div>

          {saveError && <div style={s.errorMsg}>⚠️ {saveError}</div>}

          <div style={s.btnRow}>
            <button onClick={() => setStep(1)} style={s.ghostBtn}>← BACK</button>
            <button onClick={handleSubmit} disabled={saving} style={{
              ...s.primaryBtn, flex: 2,
              ...(saving ? s.btnDisabled : {}),
            }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {saving ? "SAVING..." : "SUBMIT REPORT →"}
            </button>
          </div>
        </div>
      )}
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
  fadeIn: {
    animation: "fadeIn 0.3s ease",
  },

  // progress
  progressWrap: { marginBottom: 32 },
  progressInfo: {
    display: "flex", justifyContent: "space-between",
    marginBottom: 8,
  },
  stepText: {
    fontSize: 11, color: "#475569",
    letterSpacing: 1, textTransform: "uppercase",
  },
  progressTrack: {
    height: 4, background: "#111827",
    borderRadius: 99, overflow: "hidden",
  },
  progressFill: {
    height: "100%", borderRadius: 99,
    background: "linear-gradient(90deg, #f59e0b, #ef4444)",
    transition: "width 0.4s ease",
    boxShadow: "0 0 10px rgba(245,158,11,0.4)",
  },

  pageTitle: {
    fontSize: 28, fontWeight: 800,
    letterSpacing: -0.5, color: "#f0f4ff",
    marginBottom: 6,
  },
  pageSub: {
    fontSize: 13, color: "#64748b",
    marginBottom: 4,
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
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f0f4ff",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14, outline: "none",
    marginBottom: 16, borderRadius: 10,
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },

  // meal buttons
  mealGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10, marginBottom: 20,
  },
  mealBtn: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6,
    padding: "16px 8px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#64748b", borderRadius: 12,
    cursor: "pointer", transition: "all 0.2s",
    fontFamily: "'Outfit', sans-serif",
  },
  mealBtnActive: {
    background: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.4)",
    color: "#f59e0b",
    boxShadow: "0 0 16px rgba(245,158,11,0.15)",
  },

  // dish cards
  dishCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 20,
    marginBottom: 16,
  },
  dishCardDanger: {
    background: "linear-gradient(135deg, rgba(255,68,68,0.07), rgba(255,68,68,0.02))",
    border: "1px solid rgba(255,68,68,0.2)",
  },
  dishCardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  dishName: {
    fontSize: 15, fontWeight: 700, color: "#f0f4ff",
  },
  flaggedBadge: {
    background: "rgba(255,68,68,0.1)",
    border: "1px solid rgba(255,68,68,0.3)",
    color: "#ff4444", fontSize: 10,
    fontWeight: 700, padding: "3px 10px",
    borderRadius: 20, letterSpacing: 0.5,
  },

  sectionLabel: {
    fontSize: 11, fontWeight: 700,
    letterSpacing: 2, color: "#f59e0b",
    marginBottom: 14,
  },

  kgGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr",
    gap: 12, marginBottom: 0,
  },

  liveCalc: {
    background: "#0f172a", borderRadius: 10,
    padding: "12px 14px", marginTop: 12,
  },

  statRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 6, fontSize: 12,
  },
  statLabel: { color: "#475569", fontWeight: 500 },
  statValue: { fontWeight: 700 },

  // total card
  totalCard: {
    background: "rgba(245,158,11,0.05)",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: 16, padding: 20,
    marginBottom: 16,
  },

  addBtn: {
    width: "100%", padding: 12,
    background: "transparent",
    border: "1px dashed rgba(255,255,255,0.12)",
    color: "#475569", borderRadius: 10,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 12, letterSpacing: 1.5,
    cursor: "pointer", marginBottom: 16,
    transition: "all 0.2s",
  },

  warningBox: {
    background: "rgba(255,68,68,0.08)",
    border: "1px solid rgba(255,68,68,0.2)",
    borderRadius: 10, padding: "12px 16px",
    fontSize: 12, color: "#ff4444",
    textAlign: "center", marginBottom: 16,
    letterSpacing: 0.5,
  },

  errorMsg: {
    fontSize: 12, color: "#ff4444",
    textAlign: "center", marginBottom: 12,
    letterSpacing: 0.5,
  },

  btnRow: {
    display: "flex", gap: 10,
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
  btnDisabled: {
    background: "#1e293b",
    color: "#475569",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  ghostBtn: {
    flex: 1, padding: "14px 16px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#64748b", borderRadius: 10,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13, letterSpacing: 1,
    cursor: "pointer", transition: "all 0.2s",
  },

  successIcon: {
    fontSize: 48, textAlign: "center",
    marginBottom: 12, marginTop: 8,
  },
  successTitle: {
    fontSize: 24, fontWeight: 800,
    letterSpacing: 1, color: "#f0f4ff",
    textAlign: "center", lineHeight: 1.3,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 12, color: "#475569",
    textAlign: "center", letterSpacing: 1,
    marginBottom: 4,
  },
};