import { useNavigate } from "react-router-dom";
import { useState } from "react";

const ROLES = [
  {
    emoji: "🎓",
    title: "STUDENT",
    sub: "i eat here (and suffer)",
    route: "/student",
    color: "#00cc66",
  },
  {
    emoji: "👨‍🍳",
    title: "KITCHEN STAFF",
    sub: "i make the food (not my fault i swear)",
    route: "/kitchen",
    color: "#ffaa00",
  },
  {
    emoji: "👔",
    title: "WARDEN",
    sub: "i'm responsible (apparently)",
    route: "/warden",
    color: "#f5f5f0",
  },
  {
    emoji: "🏛️",
    title: "CHIEF WARDEN",
    sub: "i watch the watchman",
    route: "/chief",
    color: "#ff3333",
  },
];

export default function Enter() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed]  = useState(null);

  return (
    <div className="page">

      {/* ── HEADER ── */}
      <div style={{ textAlign: "center", marginBottom: 4, paddingTop: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: "var(--muted)", marginBottom: 10 }}>
          🧾 MESSY BUSINESS
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
          so... what's your damage?
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, letterSpacing: 1 }}>
          SELECT YOUR ROLE TO CONTINUE
        </div>
      </div>

      <hr className="divider" />

      {/* ── ROLE CARDS ── */}
      {ROLES.map((role, i) => {
        const isHovered = hovered === i;
        const isPressed = pressed === i;

        return (
          <div
            key={role.route}
            onClick={() => navigate(role.route)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => { setHovered(null); setPressed(null); }}
            onMouseDown={() => setPressed(i)}
            onMouseUp={() => setPressed(null)}
            onTouchStart={() => setPressed(i)}
            onTouchEnd={() => { setPressed(null); navigate(role.route); }}
            style={{
              border: `1px solid ${isHovered ? "#ff3333" : "#2a2a25"}`,
              padding: "20px 16px",
              marginBottom: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: isPressed
                ? "#1a0000"
                : isHovered
                ? "#110000"
                : "transparent",
              transform: isPressed ? "scale(0.98)" : "scale(1)",
              transition: "all 0.15s ease",
              userSelect: "none",
            }}
          >
            {/* Emoji */}
            <div style={{ fontSize: 32, lineHeight: 1 }}>{role.emoji}</div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, letterSpacing: 3,
                color: isHovered ? "#ff3333" : role.color,
                transition: "color 0.15s",
              }}>
                {role.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, letterSpacing: 0.5 }}>
                {role.sub}
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              fontSize: 16,
              color: isHovered ? "#ff3333" : "#2a2a25",
              transition: "color 0.15s, transform 0.15s",
              transform: isHovered ? "translateX(4px)" : "translateX(0)",
            }}>
              →
            </div>
          </div>
        );
      })}

      <hr className="divider" />

      {/* ── FOOTER ── */}
      <div style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", letterSpacing: 1, lineHeight: 2 }}>
        - - - - - - - - - - - - - - - - - -<br />
        CHOOSE WISELY. OR DON'T.<br />
        WE'RE ALL SUFFERING EITHER WAY.<br />
        - - - - - - - - - - - - - - - - - -
      </div>

    </div>
  );
}