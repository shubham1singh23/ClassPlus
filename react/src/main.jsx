import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Clerk publishable key. Set VITE_CLERK_PUBLISHABLE_KEY in .env");
}

function ClerkErrorBoundary({ children }) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        background: "#f8fafc",
        padding: "2rem",
      }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#0f172a", margin: "0 0 0.5rem" }}>
            Clerk Key Required
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            Set <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>VITE_CLERK_PUBLISHABLE_KEY</code> in
            your <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>.env</code> file to enable authentication.
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
            Get your key from <a href="https://dashboard.clerk.com/last-active?path=api-keys" target="_blank" rel="noreferrer" style={{ color: "#4d4fe6" }}>dashboard.clerk.com</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkErrorCatcher onError={() => setHasError(true)}>
      {children}
    </ClerkErrorCatcher>
  );
}

class ClerkErrorCatcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY || "pk_test_placeholder"}>
        <App />
      </ClerkProvider>
    </ClerkErrorBoundary>
  </React.StrictMode>
);