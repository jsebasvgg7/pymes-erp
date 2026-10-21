import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Lock, ArrowRight } from "lucide-react";
import PrimaryButton from "../components/PrimaryButton";
import PageHeader from "../components/PageHeader";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSimularPago = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulamos un delay de validación bancaria de 1.5 segundos
    setTimeout(() => {
      setLoading(false);
      navigate("/setup");
    }, 1500);
  };

  return (
    <div style={{ maxWidth: "480px", margin: "60px auto", padding: "24px", background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
      <PageHeader
        title="Completa tu suscripción"
        subtitle="Ingresa tus datos de pago para activar tu plan."
      />

      <form onSubmit={handleSimularPago} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Nombre en la tarjeta</label>
          <input type="text" required placeholder="Ej. Juan Pérez" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Número de Tarjeta (Simulación)</label>
          <div style={{ position: "relative" }}>
            <input type="text" required placeholder="0000 0000 0000 0000" style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", border: "1px solid #d1d5db", boxSizing: "border-box" }} />
            <CreditCard size={18} style={{ position: "absolute", left: "12px", top: "14px", color: "#9ca3af" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Vencimiento</label>
            <input type="text" required placeholder="MM/AA" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>CVC</label>
            <input type="text" required placeholder="123" style={{ padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
          </div>
        </div>

        <div style={{ marginTop: "8px" }}>
            <PrimaryButton type="submit" disabled={loading} style={{ width: "100%", padding: "14px", display: "flex", justifyContent: "center" }}>
            {loading ? "Procesando pago..." : <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>Pagar y Continuar <ArrowRight size={16} /></span>}
            </PrimaryButton>
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", margin: 0 }}>
          <Lock size={14} /> Pago 100% seguro (Entorno de pruebas)
        </p>
      </form>
    </div>
  );
}
