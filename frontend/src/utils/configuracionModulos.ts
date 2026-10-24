import { Building2, Coins, Package, Receipt, ShoppingCart, Wallet, type LucideIcon } from "lucide-react";

export type CampoEmpresa = "nombre" | "nit" | "direccion" | "telefono" | "email";

export type CampoConfiguracion = "moneda" | "simboloMoneda" | "formatoFecha" | "stockMinimoDefecto" | "avisarStockBajo" | "diasVencimientoCredito" | "clienteObligatorio" | "horaCierreAutomatico" | "anchoRecibo" | "nombreRecibo" | "mensajePieRecibo";

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
	interruptor?: boolean;
	tipoInput?: "text" | "email" | "tel" | "time";
	requerido?: boolean;
	maxLength?: number;
	mayusculas?: boolean;
	patron?: RegExp;
	mensajePatron?: string;
	opciones?: OpcionConfig[];
	valorFijo?: string;
	textoVacio?: string;
	placeholder?: string;
	unidad?: [string, string];
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
				descripcion: "Días que tiene un cliente para pagar una venta a crédito. Déjalo vacío si no quieres poner un límite.",
				campoConfig: "diasVencimientoCredito",
				maxLength: 3,
				patron: /^([1-9]\d?|[12]\d{2}|3[0-5]\d|36[0-5])$/,
				mensajePatron: "Escribe un número de 1 a 365, o déjalo vacío para no poner límite.",
				textoVacio: "Sin límite",
				placeholder: "Sin límite",
				unidad: ["día", "días"]
			},
			{
				id: "cliente",
				etiqueta: "Cliente obligatorio",
				descripcion: "Exigir un cliente en todas las ventas, no solo en las de crédito. Desactivado por defecto.",
				campoConfig: "clienteObligatorio",
				interruptor: true
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
				descripcion: "Valor inicial para los productos nuevos. Cada producto conserva su propio mínimo.",
				campoConfig: "stockMinimoDefecto",
				requerido: true,
				maxLength: 12,
				patron: /^\d+([.,]\d{1,3})?$/,
				mensajePatron: "Escribe un número igual o mayor a 0, con hasta 3 decimales."
			},
			{
				id: "avisos",
				etiqueta: "Avisos de stock bajo",
				descripcion: "Mostrar una alerta cuando un producto llegue a su mínimo.",
				campoConfig: "avisarStockBajo",
				interruptor: true
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
				etiqueta: "Aviso de cierre de caja",
				descripcion: "Hora (de Bogotá) a la que el sistema te avisa que es momento de cerrar la caja y contar el efectivo. Puedes posponer el aviso y seguir vendiendo.",
				campoConfig: "horaCierreAutomatico",
				tipoInput: "time",
				requerido: true,
				patron: /^([01]\d|2[0-3]):[0-5]\d$/,
				mensajePatron: "Escribe una hora válida, por ejemplo 04:00 o 22:30."
			}
		]
	},
	{
		id: "recibo",
		titulo: "Recibo e impresión",
		descripcion: "Cómo se ve el recibo que recibe tu cliente.",
		icono: Receipt,
		filas: [
			{
				id: "ancho",
				etiqueta: "Ancho del recibo",
				descripcion: "Tamaño del papel con el que se imprime el recibo.",
				campoConfig: "anchoRecibo",
				opciones: [
					{ valor: "58", etiqueta: "58 mm" },
					{ valor: "80", etiqueta: "80 mm" }
				]
			},
			{
				id: "nombreRecibo",
				etiqueta: "Nombre en el recibo",
				descripcion: "Nombre del negocio que se imprime en el encabezado. Si lo dejas vacío se usa el nombre de la empresa.",
				campoConfig: "nombreRecibo",
				maxLength: 150,
				textoVacio: "Nombre de la empresa",
				placeholder: "Nombre de la empresa"
			},
			{
				id: "mensajePie",
				etiqueta: "Mensaje al pie",
				descripcion: "Texto de agradecimiento o aviso al final del recibo.",
				campoConfig: "mensajePieRecibo",
				maxLength: 255,
				textoVacio: "Sin mensaje",
				placeholder: "Gracias por su compra"
			}
		]
	}
];
