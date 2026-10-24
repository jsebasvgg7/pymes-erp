import { Building2, Coins, Package, Receipt, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";

export type CampoEmpresa = "nombre" | "nit" | "direccion" | "telefono" | "email";

export type CampoConfiguracion = "moneda" | "simboloMoneda" | "formatoFecha";

export type OpcionConfig = {
	valor: string;
	etiqueta: string;
};

export type FilaConfig = {
	id: string;
	etiqueta: string;
	descripcion: string;
	campo?: CampoEmpresa;
	campoConfig?: CampoConfiguracion;
	tipoInput?: "text" | "email" | "tel";
	requerido?: boolean;
	maxLength?: number;
	mayusculas?: boolean;
	patron?: RegExp;
	mensajePatron?: string;
	opciones?: OpcionConfig[];
	valorFijo?: string;
};

export type ModuloConfig = {
	id: string;
	titulo: string;
	descripcion: string;
	icono: LucideIcon;
	filas: FilaConfig[];
};

export const MODULOS_CONFIG: ModuloConfig[] = [
	{
		id: "empresa",
		titulo: "Empresa",
		descripcion: "Los datos con los que se identifica tu negocio.",
		icono: Building2,
		filas: [
			{ id: "logo", etiqueta: "Logotipo", descripcion: "Imagen que identifica a tu negocio." },
			{
				id: "nombre",
				etiqueta: "Nombre de la empresa",
				descripcion: "El nombre con el que tu negocio aparece en el sistema.",
				campo: "nombre",
				requerido: true,
				maxLength: 200
			},
			{
				id: "nit",
				etiqueta: "NIT",
				descripcion: "Número de identificación tributaria de tu negocio.",
				campo: "nit",
				maxLength: 50
			},
			{
				id: "email",
				etiqueta: "Correo electrónico",
				descripcion: "Correo oficial para contacto y comunicaciones.",
				campo: "email",
				tipoInput: "email",
				maxLength: 150
			},
			{
				id: "telefono",
				etiqueta: "Teléfono",
				descripcion: "Número de contacto de tu negocio.",
				campo: "telefono",
				tipoInput: "tel",
				maxLength: 50
			},
			{
				id: "direccion",
				etiqueta: "Dirección",
				descripcion: "Dirección donde atiende tu negocio.",
				campo: "direccion",
				maxLength: 255
			},
			{ id: "ciudad", etiqueta: "Ciudad", descripcion: "Ciudad donde opera tu negocio." }
		]
	},
	{
		id: "moneda",
		titulo: "Moneda y formato",
		descripcion: "Cómo se muestran los valores y las fechas en la app.",
		icono: Coins,
		filas: [
			{
				id: "moneda",
				etiqueta: "Moneda",
				descripcion: "Código de 3 letras de la moneda en la que se registran ventas y compras.",
				campoConfig: "moneda",
				requerido: true,
				maxLength: 3,
				mayusculas: true,
				patron: /^[A-Z]{3}$/,
				mensajePatron: "Escribe el código de 3 letras, por ejemplo COP o USD."
			},
			{
				id: "simbolo",
				etiqueta: "Símbolo",
				descripcion: "Símbolo que acompaña a los valores.",
				campoConfig: "simboloMoneda",
				requerido: true,
				maxLength: 5,
				patron: /^\S{1,5}$/,
				mensajePatron: "Usa de 1 a 5 caracteres, sin espacios."
			},
			{
				id: "fecha",
				etiqueta: "Formato de fecha",
				descripcion: "Cómo se muestran las fechas en pantallas y reportes.",
				campoConfig: "formatoFecha",
				opciones: [
					{ valor: "DD/MM/AAAA", etiqueta: "DD/MM/AAAA (24/10/2026)" },
					{ valor: "MM/DD/AAAA", etiqueta: "MM/DD/AAAA (10/24/2026)" },
					{ valor: "AAAA-MM-DD", etiqueta: "AAAA-MM-DD (2026-10-24)" }
				]
			}
		]
	},
	{
		id: "ventas",
		titulo: "Ventas y POS",
		descripcion: "Reglas que se aplican al vender.",
		icono: ShoppingCart,
		filas: [
			{
				id: "credito",
				etiqueta: "Vencimiento del crédito",
				descripcion: "Días que tiene un cliente para pagar una venta a crédito.",
				valorFijo: "30 días"
			},
			{
				id: "cliente",
				etiqueta: "Cliente obligatorio",
				descripcion: "Exigir un cliente en todas las ventas, no solo en las de crédito."
			},
			{
				id: "barras",
				etiqueta: "Código de barras",
				descripcion: "Habilita el uso de código de barras en productos y ventas.",
				valorFijo: "Desactivado"
			}
		]
	},
	{
		id: "inventario",
		titulo: "Inventario",
		descripcion: "Valores por defecto y avisos del inventario.",
		icono: Package,
		filas: [
			{
				id: "stockMinimo",
				etiqueta: "Stock mínimo por defecto",
				descripcion: "Valor inicial para los productos nuevos.",
				valorFijo: "Por producto"
			},
			{
				id: "avisos",
				etiqueta: "Avisos de stock bajo",
				descripcion: "Mostrar una alerta cuando un producto llegue a su mínimo."
			}
		]
	},
	{
		id: "caja",
		titulo: "Caja",
		descripcion: "Comportamiento de la apertura y el cierre de caja.",
		icono: Wallet,
		filas: [
			{
				id: "cierre",
				etiqueta: "Cierre automático",
				descripcion: "Hora en la que el sistema cierra una caja que quedó abierta.",
				valorFijo: "04:00, hora de Bogotá"
			}
		]
	},
	{
		id: "recibo",
		titulo: "Recibo e impresión",
		descripcion: "Cómo se ve el recibo que recibe tu cliente.",
		icono: Receipt,
		filas: [
			{ id: "ancho", etiqueta: "Ancho del recibo", descripcion: "Tamaño del papel de la impresora térmica." },
			{
				id: "nombreRecibo",
				etiqueta: "Nombre en el recibo",
				descripcion: "Nombre del negocio que se imprime en el encabezado."
			},
			{
				id: "mensajePie",
				etiqueta: "Mensaje al pie",
				descripcion: "Texto de agradecimiento o aviso al final del recibo."
			}
		]
	}
];
