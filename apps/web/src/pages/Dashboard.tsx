import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../http/client";

const ACCESS_TOKEN_KEY = "calm_aim:access_token";

type Sessao = {
  _id: string;
  modo: string;
  criadoEm: string;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "#0f0f0f",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: { fontSize: "1.25rem", margin: 0 },
  email: { fontSize: "0.85rem", color: "#aaa" },
  button: {
    padding: "0.6rem 1.25rem",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  logoutButton: {
    padding: "0.6rem 1rem",
    background: "transparent",
    color: "#aaa",
    border: "1px solid #333",
    borderRadius: "4px",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  empty: { color: "#666", marginTop: "2rem" },
  error: { color: "#f87171", fontSize: "0.85rem", marginTop: "0.5rem" },
};

function decodeEmail(token: string): string {
  try {
    const part = token.split(".")[1];
    if (!part) return "Usuário";
    const payload = JSON.parse(atob(part)) as Record<string, unknown>;
    return typeof payload.email === "string" ? payload.email : "Usuário";
  } catch {
    return "Usuário";
  }
}

export default function Dashboard() {
  // TODO: GET /sessions quando endpoint existir
  const [sessoes] = useState<Sessao[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
  const emailUsuario = decodeEmail(token);

  const handleNovaSessao = async () => {
    setErro("");
    setLoading(true);
    try {
      await api.post("/sessions", { modo: "livre" });
      navigate("/treino");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setErro(message ?? "Erro ao criar sessão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <span style={styles.email}>{emailUsuario}</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            style={styles.button}
            onClick={handleNovaSessao}
            disabled={loading}
          >
            {loading ? "Criando..." : "Nova Sessão"}
          </button>
          <button style={styles.logoutButton} onClick={logout}>
            Sair
          </button>
        </div>
      </div>

      {erro && <p style={styles.error}>{erro}</p>}

      {sessoes.length === 0 ? (
        <p style={styles.empty}>Nenhuma sessão encontrada.</p>
      ) : (
        <ul>
          {sessoes.map((s) => (
            <li key={s._id}>{s.modo}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
