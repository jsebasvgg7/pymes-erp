import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff, KeyRound, Lock, Mail, User } from "lucide-react";
import type { ReactNode } from "react";
import PrimaryButton from "../components/PrimaryButton";
import { authService } from "../services/authService";
import logo from "../assets/logo.png";
import registroIllustration from "../assets/registro-illustration.png";
import "./LoginPage.css";
import "./SetupPage.css";

interface CampoProps {
  label: string;
  icon: ReactNode;
  name: string;
  type: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  onChange: (value: string) => void;
  toggle?: { visible: boolean; onToggle: () => void; labelShow: string; labelHide: string };
}

function Campo({ label, icon, name, type, value, placeholder, autoComplete, onChange, toggle }: CampoProps) {
  const id = useId();
  return (
    <div className="login__field">
      <label className="login__label" htmlFor={id}>
        {label}
      </label>
      <div className="login__inputWrap">
        <span className="login__inputIcon" aria-hidden="true">
          {icon}
        </span>
        <input
          className={toggle ? "login__input login__input--password" : "login__input"}
          id={id}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
        {toggle && (
          <button
            type="button"
            className="login__toggle"
            onClick={toggle.onToggle}
            aria-label={toggle.visible ? toggle.labelHide : toggle.labelShow}
          >
            {toggle.visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

const MIN_PASSWORD = 6;

function mensajeDeError(err: any): string {
  const status = err?.response?.status;
  const data = err?.response?.data;

  if (!err?.response) {
    return "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  }
  if (status === 403) {
    return "Código de acceso inválido";
  }
  if (status === 429) {
    return data?.message || "Demasiados intentos. Espera unos minutos antes de volver a intentarlo.";
  }
  if (status === 400 && data?.errors) {
    const primero = Object.values(data.errors)[0];
    if (typeof primero === "string") return primero;
  }
  return data?.message || "No se pudo crear la cuenta. Inténtalo de nuevo.";
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState("");
  const [usuario, setUsuario] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [codigo, setCodigo] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [verCodigo, setVerCodigo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const nombreEmpresa = empresa.trim();
    const nombreUsuario = usuario.trim();
    const correoLimpio = correo.trim();
    const codigoLimpio = codigo.trim();

    if (!nombreEmpresa || !nombreUsuario || !correoLimpio || !password || !codigoLimpio) {
      setError("Completa todos los campos para crear tu cuenta.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authService.registrarNuevaEmpresa({
        empresaNombre: nombreEmpresa,
        username: nombreUsuario,
        email: correoLimpio,
        password,
        codigoRegistro: codigoLimpio,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(mensajeDeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__shell setup__shell">
        <section className="login__left">
          <div className="login__form-wrap">
            <div className="login__brandLogo">
              <img src={logo} alt="Pymes ERP" className="login__brandLogoImg" />
            </div>

            <h1 className="login__welcomeTitle">Crea tu cuenta</h1>
            <p className="login__welcomeText">
              Registra tu negocio y empieza a gestionar tu operación desde un solo lugar.
            </p>

            <form className="login__form setup__form" onSubmit={handleSubmit}>
              <Campo
                label="Empresa"
                icon={<Building2 size={16} />}
                name="empresa"
                type="text"
                value={empresa}
                placeholder="Nombre de tu negocio"
                autoComplete="organization"
                onChange={setEmpresa}
              />
              <Campo
                label="Usuario"
                icon={<User size={16} />}
                name="usuario"
                type="text"
                value={usuario}
                placeholder="Nombre de usuario"
                autoComplete="username"
                onChange={setUsuario}
              />
              <Campo
                label="Correo"
                icon={<Mail size={16} />}
                name="correo"
                type="email"
                value={correo}
                placeholder="Correo electronico"
                autoComplete="email"
                onChange={setCorreo}
              />
              <Campo
                label="Contraseña"
                icon={<Lock size={16} />}
                name="password"
                type={verPassword ? "text" : "password"}
                value={password}
                placeholder="••••••••"
                autoComplete="new-password"
                onChange={setPassword}
                toggle={{
                  visible: verPassword,
                  onToggle: () => setVerPassword((v) => !v),
                  labelShow: "Mostrar contraseñas",
                  labelHide: "Ocultar contraseñas",
                }}
              />
              <Campo
                label="Confirmar contraseña"
                icon={<Lock size={16} />}
                name="confirmar"
                type={verPassword ? "text" : "password"}
                value={confirmar}
                placeholder="••••••••"
                autoComplete="new-password"
                onChange={setConfirmar}
              />
              <Campo
                label="Código de acceso"
                icon={<KeyRound size={16} />}
                name="codigo"
                type={verCodigo ? "text" : "password"}
                value={codigo}
                placeholder="Código que te entregamos"
                autoComplete="off"
                onChange={setCodigo}
                toggle={{
                  visible: verCodigo,
                  onToggle: () => setVerCodigo((v) => !v),
                  labelShow: "Mostrar código",
                  labelHide: "Ocultar código",
                }}
              />

              {error && (
                <div className="login__error" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9.25" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <PrimaryButton className="login__submit" type="submit" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </PrimaryButton>
            </form>

            <Link className="login__recoveryLink" to="/login">
              ¿Ya tienes cuenta? Inicia sesión
            </Link>

            <p className="login__footer">Pymes ERP · Tu negocio, más simple</p>
          </div>
        </section>

        <section className="login__right" aria-hidden="true">
          <div className="login__panel">
            <div className="login__illustration">
              <img src={registroIllustration} alt="" />
            </div>
            <div className="login__panelCaption">
              <h2>Crea tu cuenta en Pymes ERP</h2>
              <p>Ingresa el código de acceso que te entregamos y registra tu negocio en minutos.</p>
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
