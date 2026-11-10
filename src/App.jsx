import { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import InfoSocis from "./components/InfoSocis.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import Reservations from "./components/Reservations.jsx";
import Footer from "./components/Footer.jsx";
import { PAGES } from "./data/seo.js";
const VIEW_PATHS = {
  home: "/",
  info: "/informacio",
  alta: "/fes-te-soci",
  "reserves-zones": "/reserves-zones",
  "reserves-courts": "/reserves-pistes",
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
  if (pathname === "/reserva-confirmada") return "reserves-zones";
  if (pathname === "/reserva-cancelada") return "reserves-zones";

  return "home";
}

export default function App() {
  const [view, setView] = useState(() => getViewFromLocation());

  useEffect(() => {
    const onPopState = () => {
      setView(getViewFromLocation());
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Cada canvi de pàgina torna a dalt, un cop la nova vista ja s'ha pintat.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view]);

  useEffect(() => {
    document.title = (PAGES[view] || PAGES.home).title;
  }, [view]);

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
  };

  return (
    <>
      <Navbar view={view} go={go} />
      <main>
        {view === "home" && <Home go={go} />}
        {view === "info" && <InfoSocis go={go} />}
        {view === "alta" && <RegisterForm go={go} />}
        {view === "reserves-zones" && (
          <Reservations section="zones" />
        )}
        {view === "reserves-courts" && (
          <Reservations section="courts" />
        )}
      </main>
      <Footer go={go} />
    </>
  );
}
