import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Student from "./pages/Student";
import Kitchen from "./pages/Kitchen";
import Warden from "./pages/Warden";
import Chief from "./pages/Chief";
import "./App.css";

function Navbar() {
  const location = useLocation();
  const links = [
    { to: "/",        label: "Home" },
    { to: "/student", label: "Student" },
    { to: "/kitchen", label: "Kitchen" },
    { to: "/warden",  label: "Warden" },
    { to: "/chief",   label: "Chief" },
  ];
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link to="/" className="topnav-logo">
          🧾 <span>WasteWise</span>
        </Link>
        <div className="topnav-links">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`topnav-link ${location.pathname === l.to ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Landing />} />
        <Route path="/student" element={<Student />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/warden"  element={<Warden />} />
        <Route path="/chief"   element={<Chief />} />
      </Routes>
    </BrowserRouter>
  );
}