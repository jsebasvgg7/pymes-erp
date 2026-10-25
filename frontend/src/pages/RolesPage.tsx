import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import PrimaryButton from "../components/PrimaryButton";
import Modal from "../components/Modal";
import DataTable, { DataTableLayout } from "../components/DataTable";
import { authService } from "../services/authService";
import { http } from "../services/http";
import "./RolesPage.css";

type RolResponse = {
    id: number;
    nombre: string;
    descripcion: string;
    modulos: string[];
};

const MODULOS_DISPONIBLES = [
    "DASHBOARD", "CLIENTES", "PROVEEDORES", "PRODUCTOS", "CATEGORIAS",
    "COMPRAS", "INVENTARIO", "POS", "CAJA", "REPORTES", "CONFIGURACION", "USUARIOS", "ROLES"
];

export default function RolesPage() {
    const empresaId = authService.getUsuario()?.empresaId;
    const [roles, setRoles] = useState<RolResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState({ nombre: "", descripcion: "", modulos: [] as string[] });

    const loadRoles = useCallback(async () => {
        if (!empresaId) return;
        try {
            const { data } = await http.get(`/api/roles/listar-por-empresa/${empresaId}`);
            setRoles(data.content || data);
        } catch (error) {
            console.error("Error al cargar roles:", error);
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    useEffect(() => {
        loadRoles();
    }, [loadRoles]);

    const handleToggleModulo = (modulo: string) => {
        setForm(prev => ({
            ...prev,
            modulos: prev.modulos.includes(modulo)
                ? prev.modulos.filter(m => m !== modulo)
                : [...prev.modulos, modulo]
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...form, empresaId };
            if (editId) {
                await http.put(`/api/roles/actualizar/${editId}`, payload);
            } else {
                await http.post("/api/roles/crear", payload);
            }
            setModalOpen(false);
            loadRoles();
        } catch (error) {
            alert("Error al guardar el rol. Verifica tu conexión.");
        }
    };

    const layout: DataTableLayout<RolResponse> = {
        principal: (r) => r.nombre,
        secundario: (r) => r.descripcion || "Sin descripción",
        etiquetas: (r) => r.nombre === "ADMIN"
            ? <span style={{ color: "green" }}>Acceso Total</span>
            : <span>{r.modulos ? r.modulos.length : 0} módulos permitidos</span>,
        estado: () => null,
        valor: (r) => r.nombre === "ADMIN" ? null : (
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                    setEditId(r.id);
                    setForm({ nombre: r.nombre, descripcion: r.descripcion, modulos: r.modulos || [] });
                    setModalOpen(true);
                }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#666' }}>
                    <Edit2 size={16} />
                </button>
            </div>
        )
    };

    return (
        <div style={{ padding: "24px" }}>
            <PageHeader
                title="Roles y Permisos"
                subtitle="Crea perfiles de acceso y decide qué puede ver cada usuario."
                actions={
                    <PrimaryButton type="button" onClick={() => {
                        setEditId(null);
                        setForm({ nombre: "", descripcion: "", modulos: [] });
                        setModalOpen(true);
                    }}>
                        <Plus size={14} /> Nuevo Rol
                    </PrimaryButton>
                }
            />

            {!loading && <DataTable data={roles} layout={layout} title="Roles Activos" pageSize={10} />}

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar Rol" : "Crear Rol"}>
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Nombre del Rol</label>
                        <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>Descripción</label>
                        <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginTop: "8px", marginBottom: "12px" }}>
                            Paneles Permitidos
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {MODULOS_DISPONIBLES.map(mod => (
                                <label key={mod} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.modulos.includes(mod)}
                                        onChange={() => handleToggleModulo(mod)}
                                    />
                                    {mod}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                        <PrimaryButton type="submit">Guardar Rol</PrimaryButton>
                    </div>
                </form>
            </Modal>
        </div>
    );
}