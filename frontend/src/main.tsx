import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/context/AuthContext.tsx";
import "./styles/index.css";
import "leaflet/dist/leaflet.css";
import "./app/lib/leafletIcons";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);
