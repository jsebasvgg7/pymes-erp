import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import loginIllustration from "../assets/login-element-1.png";
import logo from "../assets/logo.png";
import "./LoginPage.css";
import "./SetupPage.css";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return "No se pudo conectar con el servidor. Verifica que el backend esté iniciado.";
}

export default function AdminRecoveryPage() {
  const navigate = useNavigate();
  const prefix = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const recoveryKey = String(data.get("recoveryKey") ?? "");
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("passwordConfirmation") ?? "");

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await authService.recoverAdmin({
        recoveryKey,
        username: String(data.get("username") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        password
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
            <h1 className="login__welcomeTitle">Recuperar acceso</h1>
            <p className="login__welcomeText">
              Crea una nueva cuenta administradora sin eliminar los datos actuales. Requiere una clave temporal configurada en el backend.
            </p>

            <form className="login__form setup__form" onSubmit={handleSubmit}>
              <div className="login__field">
                <label className="login__label" htmlFor={`${prefix}-key`}>Clave de recuperación (mínimo 32 caracteres) *</label>
                <input className="login__input setup__input" id={`${prefix}-key`} name="recoveryKey" type="password" required minLength={32} maxLength={256} autoComplete="off" />
              </div>
              <div className="login__field">
                <label className="login__label" htmlFor={`${prefix}-username`}>Nuevo usuario *</label>
                <input className="login__input setup__input" id={`${prefix}-username`} name="username" required maxLength={80} autoComplete="username" />
              </div>
              <div className="login__field">
                <label className="login__label" htmlFor={`${prefix}-email`}>Correo *</label>
                <input className="login__input setup__input" id={`${prefix}-email`} name="email" type="email" required maxLength={150} autoComplete="email" />
              </div>
              <div className="login__field">
                <label className="login__label" htmlFor={`${prefix}-password`}>Nueva contraseña (mínimo 8 caracteres) *</label>
                <input className="login__input setup__input" id={`${prefix}-password`} name="password" type="password" required minLength={8} maxLength={255} autoComplete="new-password" />
              </div>
              <div className="login__field">
                <label className="login__label" htmlFor={`${prefix}-confirm`}>Confirmar contraseña *</label>
                <input className="login__input setup__input" id={`${prefix}-confirm`} name="passwordConfirmation" type="password" required minLength={8} maxLength={255} autoComplete="new-password" />
              </div>

              {error && <div className="login__error" role="alert">{error}</div>}
              <PrimaryButton className="login__submit" type="submit" disabled={submitting}>
                {submitting ? "Recuperando..." : "Crear administrador y entrar"}
              </PrimaryButton>
            </form>

            <Link className="setup__back" to="/login">Volver al inicio de sesión</Link>
            <p className="login__footer">Pymes ERP · Tu negocio, más simple</p>
          </div>
        </section>
        <section className="login__right" aria-hidden="true">
          <div className="login__panel">
            <div className="login__illustration"><img src={loginIllustration} alt="" /></div>
            <div className="login__panelCaption">
              <h2>Recuperación protegida</h2>
              <p>La clave no se guarda en la aplicación. Quien administre el backend debe configurarla temporalmente para autorizar esta operación.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
