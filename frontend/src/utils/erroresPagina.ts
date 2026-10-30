import { isAxiosError } from "axios";
import { authService } from "../services/authService";

export type PaginaClave =
    | "dashboard"
    | "reportes"
    | "caja"
    | "inventario"
    | "pronosticos"
    | "compras"
    | "pos"
    | "productos"
    | "categorias"
    | "clientes"
    | "proveedores"
    | "usuarios"
    | "roles"
    | "configuracion";

export type CausaError = "conexion" | "servidor" | "sesion" | "inesperado";

export interface ErrorInfo {
    pagina: PaginaClave;
    causa: CausaError;
    estado: number | null;
    codigo: string;
    hora: Date;
    sinInternet: boolean;
    reintentable: boolean;
    mensaje: string | null;
}

export type ErrorPagina = ErrorInfo | string;

interface DatosPagina {
    abrev: string;
    nombre: string;
    que: string;
    consejo?: string;
}

const PAGINAS: Record<PaginaClave, DatosPagina> = {
    dashboard: { abrev: "DAS", nombre: "Dashboard", que: "tu resumen" },
    reportes: { abrev: "REP", nombre: "Reportes", que: "los reportes" },
    caja: {
        abrev: "CAJ",
        nombre: "Caja",
        que: "la caja",
        consejo: "Si ibas a registrar un movimiento, anótalo y regístralo cuando el sistema vuelva."
    },
    inventario: { abrev: "INV", nombre: "Inventario", que: "el inventario" },
    pronosticos: { abrev: "PRN", nombre: "Pronósticos", que: "los pronósticos" },
    compras: {
        abrev: "COM",
        nombre: "Compras",
        que: "las compras",
        consejo: "Si ibas a registrar una compra, guarda la factura y regístrala cuando el sistema vuelva."
    },
    pos: {
        abrev: "POS",
        nombre: "Punto de venta",
        que: "el punto de venta",
        consejo: "Mientras tanto, anota la venta en papel y regístrala cuando el sistema vuelva."
    },
    productos: { abrev: "PRO", nombre: "Productos", que: "los productos" },
    categorias: { abrev: "CAT", nombre: "Categorías", que: "las categorías" },
    clientes: { abrev: "CLI", nombre: "Clientes", que: "los clientes" },
    proveedores: { abrev: "PRV", nombre: "Proveedores", que: "los proveedores" },
    usuarios: { abrev: "USU", nombre: "Usuarios", que: "los usuarios" },
    roles: { abrev: "ROL", nombre: "Roles", que: "los roles" },
    configuracion: { abrev: "CFG", nombre: "Configuración", que: "la configuración" }
};

const SOPORTE_WHATSAPP = "573181261899";
const SOPORTE_CORREO = "pymeserp.oficial@gmail.com";
const ESTADOS_TEMPORALES = [502, 503, 504];

function estaSinInternet(): boolean {
    return typeof navigator !== "undefined" && navigator.onLine === false;
}

function crearError(
    pagina: PaginaClave,
    causa: CausaError,
    estado: number | null,
    extra: Partial<Pick<ErrorInfo, "mensaje" | "reintentable" | "sinInternet">> = {}
): ErrorInfo {
    return {
        pagina,
        causa,
        estado,
        codigo: `${PAGINAS[pagina].abrev}-${estado ?? (causa === "conexion" ? "RED" : "ERR")}`,
        hora: new Date(),
        sinInternet: extra.sinInternet ?? false,
        reintentable: extra.reintentable ?? false,
        mensaje: extra.mensaje ?? null
    };
}

export function describirError(pagina: PaginaClave, err: unknown): ErrorInfo {
    if (!isAxiosError(err)) {
        return crearError(pagina, "inesperado", null);
    }

    const estado = err.response?.status ?? null;

    if (estado === null) {
        return crearError(pagina, "conexion", null, {
            sinInternet: estaSinInternet(),
            reintentable: true
        });
    }

    if (estado === 401) {
        return crearError(pagina, "sesion", estado);
    }

    if (estado >= 500) {
        return crearError(pagina, "servidor", estado, {
            reintentable: ESTADOS_TEMPORALES.includes(estado)
        });
    }

    const mensajeServidor = (err.response?.data as { message?: unknown } | undefined)?.message;
    return crearError(pagina, "inesperado", estado, {
        mensaje: typeof mensajeServidor === "string" ? mensajeServidor : null
    });
}

export function errorSesion(pagina: PaginaClave): ErrorInfo {
    return crearError(pagina, "sesion", null);
}

export function normalizarError(pagina: PaginaClave, error: ErrorPagina): ErrorInfo {
    if (typeof error === "string") {
        return crearError(pagina, "inesperado", null, { mensaje: error });
    }
    return error;
}

export interface TextosError {
    titulo: string;
    mensaje: string;
    consejo?: string;
}

export function textosError(info: ErrorInfo): TextosError {
    const pagina = PAGINAS[info.pagina];

    if (info.causa === "conexion") {
        return {
            titulo: `No logramos cargar ${pagina.que}`,
            mensaje: info.sinInternet
                ? "Parece que tu internet no está funcionando. Revisa el WiFi o los datos del celular y vuelve a intentar."
                : "Revisa que tu internet esté funcionando. Si lo está, espera uno o dos minutos y vuelve a intentar.",
            consejo: pagina.consejo
        };
    }

    if (info.causa === "servidor") {
        return {
            titulo: "Algo falló de nuestro lado",
            mensaje: "No hiciste nada mal. Intenta de nuevo en unos minutos. Si sigue igual, avisa a soporte y dales el código de ayuda.",
            consejo: pagina.consejo
        };
    }

    if (info.causa === "sesion") {
        return {
            titulo: "Tu sesión terminó",
            mensaje: "Por seguridad, vuelve a iniciar sesión para seguir trabajando."
        };
    }

    return {
        titulo: "No pudimos completar esto",
        mensaje: info.mensaje ?? "Intenta de nuevo. Si sigue igual, avisa a soporte y dales el código de ayuda."
    };
}

export function formatearHora(hora: Date): string {
    return new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit"
    }).format(hora);
}

export function enlacesSoporte(info: ErrorInfo): { whatsapp: string; correo: string } {
    const usuario = authService.getUsuario()?.username;
    const lineas = [
        "Hola, necesito ayuda con Pymes ERP.",
        `Pantalla: ${PAGINAS[info.pagina].nombre}`,
        `Código de ayuda: ${info.codigo}`,
        `Hora: ${formatearHora(info.hora)}`
    ];
    if (usuario) lineas.push(`Usuario: ${usuario}`);
    const texto = lineas.join("\n");

    return {
        whatsapp: `https://wa.me/${SOPORTE_WHATSAPP}?text=${encodeURIComponent(texto)}`,
        correo: `mailto:${SOPORTE_CORREO}?subject=${encodeURIComponent(`Ayuda con Pymes ERP (${info.codigo})`)}&body=${encodeURIComponent(texto)}`
    };
}

export function mensajeVentaNoConfirmada(err: unknown): string | null {
    const info = describirError("pos", err);

    if (info.causa === "conexion" && info.sinInternet) {
        return "No hay internet y la venta no se guardó. Cuando vuelva la conexión, intenta de nuevo.";
    }

    if (info.causa === "conexion" || info.causa === "servidor") {
        return "No pudimos confirmar que la venta quedara guardada. Antes de volver a intentar, revisa en Reportes si aparece, para no cobrarla dos veces.";
    }

    return null;
}
