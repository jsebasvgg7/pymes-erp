import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authService.login({ username, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <section className="login__left" aria-hidden="true">
        <div className="login__leftInner">
          <div className="login__shapes">
            <div className="login__shape login__shape--circle" />
            <div className="login__shape login__shape--square" />
            <div className="login__shape login__shape--ring" />
          </div>
          <div className="login__welcome">
            <h2 className="login__welcomeTitle">Bienvenido</h2>
            <p className="login__welcomeText">
              Accede a tu ERP contable con una experiencia segura, clara y enfocada en tu negocio.
            </p>
          </div>
        </div>
      </section>

      <section className="login__right">
        <div className="login__card" role="region" aria-label="Formulario de inicio de sesión">
          <div className="login__brand">
            <div className="login__logo" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="28" height="28" focusable="false" aria-hidden="true">
                <path
                  d="M10 34V14a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4Z"
                  fill="currentColor"
                  opacity="0.12"
                />
                <path
                  d="M16 30h16M16 24h16M16 18h10"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="login__brandText">
              <h1 className="login__title">Contabilidad PYMES</h1>
              <p className="login__subtitle">Inicia sesión para continuar</p>
            </div>
          </div>

          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__field">
              <label className="login__label" htmlFor={emailId}>
                Usuario
              </label>
              <input
                className="login__input"
                id={emailId}
                name="email"
                type="text"
                placeholder="admin"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>

            <div className="login__field">
              <label className="login__label" htmlFor={passwordId}>
                Contraseña
              </label>
              <input
                className="login__input"
                id={passwordId}
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="login__error" style={{ color: "red", fontSize: "14px", textAlign: "center" }}>
                {error}
              </div>
            )}

            <PrimaryButton className="login__submit" type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar sesión"}
            </PrimaryButton>
          </form>
        </div>
      </section>
    </div>
  );
}
