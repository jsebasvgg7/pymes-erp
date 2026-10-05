import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import loginIllustration from "../assets/login-element-1.png";
import logo from "../assets/logo.png";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const usernameId = useId();
  const passwordId = useId();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    authService.getBootstrapStatus()
      .then(({ setupAvailable }) => setSetupAvailable(setupAvailable))
      .catch(() => setSetupAvailable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string)?.trim();
    const password = formData.get("password") as string;

    if (!username || !password) {
      setError("Usuario o contraseña incorrecta, intente de nuevo");
      return;
    }

    setLoading(true);

    try {
      await authService.login({ username, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Usuario o contraseña incorrecta, intente de nuevo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__shell">
        <section className="login__left">
          <div className="login__form-wrap">
            <div className="login__brandLogo">
              <img src={logo} alt="Pymes ERP" className="login__brandLogoImg" />
            </div>

            <h1 className="login__welcomeTitle">Inicie sesión en su cuenta</h1>
            <p className="login__welcomeText">
              Gestiona tu punto de venta, inventario, pagos desde un solo lugar.
            </p>

            <form className="login__form" onSubmit={handleSubmit}>
              <div className="login__field">
                <label className="login__label" htmlFor={usernameId}>
                  Usuario
                </label>
                <div className="login__inputWrap">
                  <span className="login__inputIcon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
                      <path
                        d="M4.5 20c1.4-3.6 4.5-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    className="login__input"
                    id={usernameId}
                    name="username"
                    type="text"
                    placeholder="usuario"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="login__field">
                <label className="login__label" htmlFor={passwordId}>
                  Contraseña
                </label>
                <div className="login__inputWrap">
                  <span className="login__inputIcon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="10.5" width="14" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    className="login__input login__input--password"
                    id={passwordId}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login__toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.7 6.7C4.7 8.1 3.2 10 2.5 12c1.4 3.5 5 6.5 9.5 6.5 1.6 0 3-.3 4.3-.9M17.4 17.4C19.2 16 20.5 14.1 21.5 12c-1.4-3.5-5-6.5-9.5-6.5-1 0-1.9.1-2.8.4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M2.5 12c1.4-3.5 5-6.5 9.5-6.5s8.1 3 9.5 6.5c-1.4 3.5-5 6.5-9.5 6.5S3.9 15.5 2.5 12Z"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <label className="login__remember">
                <input
                  type="checkbox"
                  className="login__checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Recordarme
              </label>

              {error && (
                <div className="login__error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M9 9l6 6M15 9l-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <PrimaryButton className="login__submit" type="submit" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar sesión"}
              </PrimaryButton>
            </form>

            <div className="login__divider">
              <span />
              <p>o</p>
              <span />
            </div>

            <button
              type="button"
              className="login__secondary"
              onClick={() => navigate(setupAvailable ? "/setup" : "/#precios")}
            >
              {setupAvailable ? "Configurar empresa y crear administrador" : "Consigue tu cuenta ¡AQUÍ!"}
            </button>
            <Link className="login__recoveryLink" to="/recover-admin">
              ¿Perdiste el acceso de administrador?
            </Link>

            <p className="login__footer">Pymes ERP · Tu negocio, más simple</p>
          </div>
        </section>

        <section className="login__right" aria-hidden="true">
          <div className="login__panel">
            <div className="login__illustration">
              <img src={loginIllustration} alt="" />
            </div>
            <div className="login__panelCaption">
              <h2>Accede a tu panel de control</h2>
              <p>Ingresa con tus credenciales para administrar tu negocio y registrar tus movimientos de hoy.</p>
            </div>
            <div className="login__dots">
              <span className="login__dot login__dot--active" />
              <span className="login__dot" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}