import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, User, Mail, Lock } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";
import { authService, BootstrapRequest } from "../services/authService";

export default function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<BootstrapRequest>({
    empresa: {
      nombre: "",
      nit: "",
      direccion: "",
      telefono: "",
      email: ""
    },
    administrador: {
      username: "",
      email: "",
      password: ""
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Convertir el estado de BootstrapRequest al formato que espera el backend SaaS
      const payload = {
        empresaNombre: form.empresa.nombre,
        username: form.administrador.username,
        email: form.administrador.email,
        password: form.administrador.password
      };

      // 2. Llamar a registrarNuevaEmpresa en lugar de bootstrap
      const response = await authService.registrarNuevaEmpresa(payload);

      // 3. Guardar el token devuelto
      if (response && response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("usuario", JSON.stringify(response.usuario));
      }

      // 4. Redirigir al dashboard de la nueva empresa
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al registrar la nueva empresa. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "540px", margin: "40px auto", padding: "32px", background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>¡Pago exitoso! Crea tu empresa</h2>
      <p style={{ color: "#6b7280", marginBottom: "24px", lineHeight: "1.5" }}>Configura los datos de tu negocio y tu usuario administrador para comenzar a usar el sistema.</p>

      {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* BLOQUE EMPRESA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", color: "#374151", margin: 0 }}>
            <Building size={18} /> Datos del Negocio
          </h3>
          <input
            type="text" required placeholder="Nombre de la Empresa *"
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
            value={form.empresa.nombre} onChange={e => setForm({...form, empresa: {...form.empresa, nombre: e.target.value}})}
          />
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              type="text" placeholder="NIT (Opcional)"
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              value={form.empresa.nit || ""} onChange={e => setForm({...form, empresa: {...form.empresa, nit: e.target.value}})}
            />
            <input
              type="text" placeholder="Teléfono (Opcional)"
              style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
              value={form.empresa.telefono || ""} onChange={e => setForm({...form, empresa: {...form.empresa, telefono: e.target.value}})}
            />
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #e5e7eb", margin: "0" }} />

        {/* BLOQUE ADMIN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", color: "#374151", margin: 0 }}>
            <User size={18} /> Usuario Administrador
          </h3>
          <input
            type="text" required placeholder="Nombre de usuario *"
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
            value={form.administrador.username} onChange={e => setForm({...form, administrador: {...form.administrador, username: e.target.value}})}
          />

          <div style={{ position: "relative" }}>
            <input
              type="email" required placeholder="Correo electrónico *"
              style={{ width: "100%", padding: "12px 12px 12px 36px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
              value={form.administrador.email} onChange={e => setForm({...form, administrador: {...form.administrador, email: e.target.value}})}
            />
            <Mail size={16} style={{ position: "absolute", left: "12px", top: "14px", color: "#9ca3af" }} />
          </div>

          <div style={{ position: "relative" }}>
            <input
              type="password" required placeholder="Contraseña *" minLength={6}
              style={{ width: "100%", padding: "12px 12px 12px 36px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }}
              value={form.administrador.password} onChange={e => setForm({...form, administrador: {...form.administrador, password: e.target.value}})}
            />
            <Lock size={16} style={{ position: "absolute", left: "12px", top: "14px", color: "#9ca3af" }} />
          </div>
        </div>

        <div style={{ marginTop: "8px" }}>
          <PrimaryButton type="submit" disabled={loading} style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center" }}>
            {loading ? "Configurando sistema..." : "Crear empresa y entrar"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
