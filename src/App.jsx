import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import InfoSocis from "./components/InfoSocis.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import Reservations from "./components/Reservations.jsx";
import ReservationConfirmation from "./components/ReservationConfirmation.jsx";
import ReservationCancelled from "./components/ReservationCancelled.jsx";
import Footer from "./components/Footer.jsx";
import {
  clearAuthSession,
  loginWithOdoo,
  readStoredAuth,
  storeAuthSession,
} from "./lib/auth.js";

const VIEW_PATHS = {
  home: "/",
  info: "/informacio",
  alta: "/fes-te-soci",
  "reserves-zones": "/reserves-zones",
  "reserves-courts": "/reserves-pistes",
  "reservation-confirmed": "/reserva-confirmada",
  "reservation-cancelled": "/reserva-cancelada",
};

function normalisePathname(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) || "/" : pathname;
}

function getViewFromLocation() {
  const pathname = normalisePathname(window.location.pathname);

  if (pathname === "/informacio") return "info";
  if (pathname === "/fes-te-soci") return "alta";
  if (pathname === "/reserves-zones" || pathname === "/reserves") {
    return "reserves-zones";
  }
  if (pathname === "/reserves-pistes" || pathname === "/reserves-courts") {
    return "reserves-courts";
  }
  if (pathname === "/reserva-confirmada") return "reservation-confirmed";
  if (pathname === "/reserva-cancelada") return "reservation-cancelled";

  return "home";
}

export default function App() {
  const [view, setView] = useState(() => getViewFromLocation());
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    setAuth(readStoredAuth());
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setView(getViewFromLocation());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const nextPath = VIEW_PATHS[view] || "/";
    const currentPath = normalisePathname(window.location.pathname);
    if (currentPath !== nextPath) {
      window.history.replaceState({}, "", `${nextPath}${window.location.search}`);
    }
  }, [view]);

  const go = (v) => {
    setView(v);
    const nextPath = VIEW_PATHS[v] || "/";
    window.history.pushState({}, "", nextPath);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (credentials) => {
    const session = await loginWithOdoo(credentials);
    setAuth(session);
    storeAuthSession(session);
    return session;
  };

  const handleLogout = () => {
    setAuth(null);
    clearAuthSession();
    if (view === "reserves-zones" || view === "reserves-courts") {
      setView("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar view={view} go={go} auth={auth} onLogout={handleLogout} />
      <main>
        {view === "home" && <Home go={go} auth={auth} />}
        {view === "info" && <InfoSocis go={go} auth={auth} />}
        {view === "alta" && <RegisterForm go={go} />}
        {view === "reserves-zones" && (
          <Reservations auth={auth} onLogin={handleLogin} section="zones" />
        )}
        {view === "reserves-courts" && (
          <Reservations auth={auth} onLogin={handleLogin} section="courts" />
        )}
        {view === "reservation-confirmed" && <ReservationConfirmation go={go} />}
        {view === "reservation-cancelled" && <ReservationCancelled go={go} />}
      </main>
      <Footer go={go} auth={auth} />
    </>
  );
}
