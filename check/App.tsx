import React, { useState } from "react";
import FarmDashboard  from "../Farmxi/src/screens/FarmDashboard";
import VoiceLoginPage from "../Farmxi/src/screens/VoiceLoginPage";

type Page = "dashboard" | "voice";

export default function App() {
  const [page,     setPage]     = useState<Page>("dashboard");
  const [language, setLanguage] = useState("English");

  if (page === "voice") {
    return (
      <VoiceLoginPage
        onBack={() => setPage("dashboard")}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  return (
    <FarmDashboard
      onAskAI={() => setPage("voice")}
      language={language}
    />
  );
}