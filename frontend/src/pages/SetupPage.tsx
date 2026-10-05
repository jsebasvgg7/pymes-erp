import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import loginIllustration from "../assets/login-element-1.png";
import logo from "../assets/logo.png";
import "./LoginPage.css";
import "./SetupPage.css";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string; message?: string } } }).response;
    return response?.data?.detail ?? response?.data?.message ?? "No se pudo completar la configuración.";
  }
  return "No se pudo conectar con el servidor. Verifica que el backend esté iniciado.";
}

export default function SetupPage() {
  const navigate = useNavigate();
  const prefix = useId();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [companyExists, setCompanyExists] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.getBootstrapStatus()
      .then((status) => {
        setAvailable(status.setupAvailable);
        setCompanyExists(status.companyExists);
        setInitialized(status.initialized);
      })
      .catch((err: unknown) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("adminPassword") ?? "");
    const passwordConfirmation = String(data.get("passwordConfirmation") ?? "");
    if (password !== passwordConfirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.bootstrap({
        empresa: {
          nombre: companyExists ? "" : String(data.get("companyName") ?? "").trim(),
          nit: String(data.get("nit") ?? "").trim() || null,
          direccion: String(data.get("address") ?? "").trim() || null,
          telefono: String(data.get("phone") ?? "").trim() || null,
          email: String(data.get("companyEmail") ?? "").trim() || null
        },
        administrador: {
          username: String(data.get("username") ?? "").trim(),
          email: String(data.get("adminEmail") ?? "").trim(),
          password
        }
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="login setup">
      <div className="login__shell setup__shell">
        <section className="login__left">
          <div className="login__form-wrap setup__form-wrap">
            <Link to="/login" className="setup__brand" aria-label="Volver al inicio de sesión">
              <img src={logo} alt="Pymes ERP" className="login__brandLogoImg" />
            </Link>
            <h1 className="login__welcomeTitle">Configura tu negocio</h1>
            <p className="login__welcomeText">
              Crea la empresa y la cuenta administradora inicial para comenzar.
            </p>

            {loading ? (
              <p role="status">Verificando si la configuración inicial está disponible...</p>
            ) : available ? (
              <form className="login__form setup__form" onSubmit={handleSubmit}>
                {!companyExists && (
                  <>
                    <h2 className="setup__sectionTitle">Datos de la empresa</h2>
                    <div className="login__field">
                      <label className="login__label" htmlFor={`${prefix}-company`}>Nombre de la empresa *</label>
                      <input className="login__input setup__input" id={`${prefix}-company`} name="companyName" required maxLength={200} autoComplete="organization" />
                    </div>
                    <div className="setup__grid">
                      <div className="login__field">
                        <label className="login__label" htmlFor={`${prefix}-nit`}>NIT</label>
                        <input className="login__input setup__input" id={`${prefix}-nit`} name="nit" maxLength={50} />
                      </div>
                      <div className="login__field">
                        <label className="login__label" htmlFor={`${prefix}-phone`}>Teléfono</label>
                        <input className="login__input setup__input" id={`${prefix}-phone`} name="phone" maxLength={50} autoComplete="tel" />
                      </div>
                    </div>
                    <div className="login__field">
                      <label className="login__label" htmlFor={`${prefix}-address`}>Dirección</label>
                      <input className="login__input setup__input" id={`${prefix}-address`} name="address" maxLength={255} autoComplete="street-address" />
                    </div>
                    <div className="login__field">
                      <label className="login__label" htmlFor={`${prefix}-company-email`}>Correo de la empresa</label>
                      <input className="login__input setup__input" id={`${prefix}-company-email`} name="companyEmail" type="email" maxLength={150} autoComplete="email" />
                    </div>
                  </>
                )}

                <h2 className="setup__sectionTitle">Cuenta administradora</h2>
                <div className="setup__grid">
                  <div className="login__field">
                    <label className="login__label" htmlFor={`${prefix}-username`}>Usuario *</label>
                    <input className="login__input setup__input" id={`${prefix}-username`} name="username" required maxLength={80} autoComplete="username" />
                  </div>
                  <div className="login__field">
                    <label className="login__label" htmlFor={`${prefix}-admin-email`}>Correo *</label>
                    <input className="login__input setup__input" id={`${prefix}-admin-email`} name="adminEmail" type="email" required maxLength={150} autoComplete="email" />
                  </div>
                </div>
                <div className="login__field">
                  <label className="login__label" htmlFor={`${prefix}-password`}>Contraseña (mínimo 8 caracteres) *</label>
                  <input className="login__input setup__input" id={`${prefix}-password`} name="adminPassword" type="password" required minLength={8} maxLength={255} autoComplete="new-password" />
                </div>
                <div className="login__field">
                  <label className="login__label" htmlFor={`${prefix}-confirm-password`}>Confirmar contraseña *</label>
                  <input className="login__input setup__input" id={`${prefix}-confirm-password`} name="passwordConfirmation" type="password" required minLength={8} maxLength={255} autoComplete="new-password" />
                </div>

                {error && <div className="login__error" role="alert">{error}</div>}
                <PrimaryButton className="login__submit" type="submit" disabled={submitting}>
                  {submitting ? "Configurando..." : "Crear empresa y administrador"}
                </PrimaryButton>
              </form>
            ) : (
              <div className="setup__notice" role={error ? "alert" : "status"}>
                {error ?? (initialized
                  ? "La configuración inicial ya fue completada. Inicia sesión con la cuenta administradora."
                  : "La configuración inicial no está disponible para el estado actual de la base de datos. Contacta a quien administra la instalación.")}
              </div>
            )}

            <Link className="setup__back" to="/login">Volver al inicio de sesión</Link>
            <p className="login__footer">Pymes ERP · Tu negocio, más simple</p>
          </div>
        </section>
        <section className="login__right" aria-hidden="true">
          <div className="login__panel">
            <div className="login__illustration"><img src={loginIllustration} alt="" /></div>
            <div className="login__panelCaption">
              <h2>Un primer paso para tu negocio</h2>
              <p>Esta configuración solo se puede realizar una vez en una instalación vacía.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
