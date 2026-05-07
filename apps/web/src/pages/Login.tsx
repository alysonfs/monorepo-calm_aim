import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../http/client";

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0f0f0f",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#1a1a1a",
    padding: "2rem",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "360px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
  },
  title: { textAlign: "center", marginBottom: "1.5rem", fontSize: "1.25rem" },
  label: {
    display: "block",
    marginBottom: "0.25rem",
    fontSize: "0.85rem",
    color: "#aaa",
  },
  input: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    marginBottom: "1rem",
    background: "#2a2a2a",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.7rem",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: "0.25rem",
  },
  toggle: {
    marginTop: "1rem",
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#aaa",
  },
  toggleLink: {
    color: "#818cf8",
    cursor: "pointer",
    textDecoration: "underline",
  },
  error: { color: "#f87171", fontSize: "0.85rem", marginBottom: "0.75rem" },
  success: { color: "#4ade80", fontSize: "0.85rem", marginBottom: "0.75rem" },
};

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!email.includes("@")) return "Email inválido.";
    if (senha.length < 6) return "Senha deve ter ao menos 6 caracteres.";
    if (mode === "register" && senha !== confirmar)
      return "As senhas não coincidem.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const validationError = validate();
    if (validationError) {
      setErro(validationError);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { data } = await api.post("/auth/login", { email, senha });
        login(data.accessToken, data.refreshToken);
        navigate("/dashboard", { replace: true });
      } else {
        await api.post("/auth/register", { email, senha });
        setSucesso("Conta criada! Faça login.");
        setMode("login");
        setSenha("");
        setConfirmar("");
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setErro(message ?? "Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setErro("");
    setSucesso("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        {erro && <p style={styles.error}>{erro}</p>}
        {sucesso && <p style={styles.success}>{sucesso}</p>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <label style={styles.label}>Senha</label>
          <input
            style={styles.input}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />
          {mode === "register" && (
            <>
              <label style={styles.label}>Confirmar senha</label>
              <input
                style={styles.input}
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
              />
            </>
          )}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
        </form>
        <p style={styles.toggle}>
          {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          <span style={styles.toggleLink} onClick={toggleMode}>
            {mode === "login" ? "Criar conta" : "Entrar"}
          </span>
        </p>
      </div>
    </div>
  );
}
