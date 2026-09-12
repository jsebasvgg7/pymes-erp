import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import posIllustration from "../assets/pos-illustration.png";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

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
      <div className="login__shell">
        <section className="login__left" aria-hidden="true">
          <div className="login__brandRow">
            <div className="login__brandLogo">
              <svg viewBox="0 0 24 24" width="22" height="22" focusable="false" aria-hidden="true">
                <path
                  d="M4 5h2l1.6 9.6a2 2 0 0 0 2 1.65h7.1a2 2 0 0 0 1.97-1.64L20 8.5H7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="10" cy="20" r="1.4" fill="currentColor" />
                <circle cx="16.5" cy="20" r="1.4" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="login__brandName">
                PYMES <span>ERP</span>
              </p>
              <p className="login__brandTag">POS · Inventario · Facturación</p>
            </div>
          </div>

          <div className="login__illustration">
            <img src={posIllustration} alt="" />
          </div>
        </section>

        <section className="login__right">
          <div className="login__form-wrap">
            <div className="login__eyebrow" />
            <h2 className="login__welcomeTitle">
              Bienvenido a
              <br />
              PYMES <span>ERP</span>
            </h2>
            <p className="login__welcomeText">
              Tu punto de venta y gestión empresarial en un solo lugar.
            </p>

            <form className="login__form" onSubmit={handleSubmit}>
              <div className="login__field">
                <label className="login__label" htmlFor={emailId}>
                  Usuario o correo electrónico
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
                    id={emailId}
                    name="email"
                    type="text"
                    placeholder="admin"
                    autoComplete="username"
                    required
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
                    required
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

              <div className="login__row">
                <label className="login__remember">
                  <input
                    type="checkbox"
                    className="login__checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Recordarme
                </label>
                <button type="button" className="login__link">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && <div className="login__error">{error}</div>}

              <PrimaryButton className="login__submit" type="submit" disabled={loading}>
                {loading ? (
                  "Cargando..."
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M10 17l5-5-5-5M4 12h11"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Iniciar sesión
                  </>
                )}
              </PrimaryButton>
            </form>

            <p className="login__footer">PYMES ERP · Tu negocio, más simple</p>
          </div>
        </section>
      </div>
    </div>
  );
}