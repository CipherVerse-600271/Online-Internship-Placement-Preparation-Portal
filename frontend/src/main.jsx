import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AptitudeTests from "./AptitudeTests.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <>
      <AptitudeTests />
      <App />
    </>
  </StrictMode>
);
