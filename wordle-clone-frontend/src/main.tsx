import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";  // Import the main App component
import "./index.css";  // Keep global styles if needed

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);