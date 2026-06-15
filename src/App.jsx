import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import InfoSocis from "./components/InfoSocis.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import Reservations from "./components/Reservations.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const [view, setView] = useState("home");

  const go = (v) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar view={view} go={go} />
      <main>
        {view === "home" && <Home go={go} />}
        {view === "info" && <InfoSocis go={go} />}
        {view === "alta" && <RegisterForm go={go} />}
        {view === "reserves" && <Reservations />}
      </main>
      <Footer go={go} />
    </>
  );
}
