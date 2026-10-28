import argparse
import csv
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path

SEMANAS_ENTRADA = 4
SEMANAS_MIN_HISTORIAL = 8
PRIMERA_SEMANA_EVALUABLE = 5
RUTA_ARBOL = "backend/src/main/resources/modelos/demanda_arbol.json"
OBJETIVO_RAZON = "razon_promedio_4sem"
TOLERANCIA_B = 0.05
VARIANTES = (
    ("a", "A. v10.8 (ventas en 0)"),
    ("b", "B. Promedio 4 semanas"),
    ("c", "C. Arbol nuevo"),
    ("d", "D. Arbol v10.8 corregido"),
)


def leer_csv(ruta):
    with open(ruta, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def cargar_arbol(ruta):
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def cargar_meta(ruta):
    if ruta.exists():
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    return {}


def numerar_hojas(nodo, hojas=None):
    if hojas is None:
        hojas = []
    if "prediccion" in nodo:
        nodo["_hoja"] = len(hojas)
        hojas.append(nodo["prediccion"])
        return hojas
    numerar_hojas(nodo["izq"], hojas)
    numerar_hojas(nodo["der"], hojas)
    return hojas


def evaluar(nodo, variables):
    while "prediccion" not in nodo:
        valor = variables.get(nodo["variable"], 0.0)
        nodo = nodo["izq"] if valor <= nodo["umbral"] else nodo["der"]
    return nodo["prediccion"], nodo["_hoja"]


def predecir(arbol, variables, razon):
    valor, hoja = evaluar(arbol, variables)
    if razon:
        valor *= variables["promedio_4sem"]
    return valor, hoja


def semana_incluye_quincena(lunes):
    for i in range(7):
        dia = (lunes + timedelta(days=i)).day
        if dia == 15 or dia >= 28:
            return True
    return False


def cargar_ventas(ruta):
    ventas = {}
    for fila in leer_csv(ruta):
        ventas.setdefault(fila["sku"], {})[date.fromisoformat(fila["semana_inicio"])] = float(fila["unidades"])
    return ventas


def cargar_stock(ruta):
    stock = {}
    for fila in leer_csv(ruta):
        stock.setdefault(fila["sku"], {})[date.fromisoformat(fila["semana_inicio"])] = float(fila["cantidad"])
    return stock


def cargar_catalogo(ruta):
    return {fila["sku"]: fila for fila in leer_csv(ruta)}


def cargar_categorias(ruta, catalogo):
    if ruta.exists():
        return {fila["sku"]: float(fila["categoria_id"]) for fila in leer_csv(ruta)}, "reales"
    return {sku: 3.0 for sku in catalogo}, "constante"


def metricas(errores):
    n = len(errores)
    if n == 0:
        return None
    mae = sum(abs(e) for e in errores) / n
    rmse = math.sqrt(sum(e * e for e in errores) / n)
    sesgo = sum(errores) / n
    return mae, rmse, sesgo


def formato(valor):
    return "-" if valor is None else f"{valor:,.2f}"


def imprimir_resumen(titulo, filas):
    print()
    print(titulo)
    print(f"  pares evaluados: {len(filas)}")
    if not filas:
        return None
    resultado = {}
    print(f"  {'variante':<28}{'MAE':>10}{'RMSE':>10}{'sesgo':>10}")
    for clave, nombre in VARIANTES:
        errores = [f[f"pred_{clave}"] - f["real"] for f in filas]
        m = metricas(errores)
        resultado[clave] = m
        print(f"  {nombre:<28}{formato(m[0]):>10}{formato(m[1]):>10}{formato(m[2]):>10}")
    return resultado


def imprimir_por_producto(titulo, filas, catalogo):
    print()
    print(titulo)
    print(f"  {'sku':<9}{'producto':<30}{'n':>3}{'real':>9}{'MAE A':>9}{'MAE B':>9}{'MAE C':>9}{'MAE D':>9}")
    por_sku = {}
    for f in filas:
        por_sku.setdefault(f["sku"], []).append(f)
    for sku in sorted(por_sku):
        grupo = por_sku[sku]
        n = len(grupo)
        real = sum(g["real"] for g in grupo) / n
        maes = [sum(abs(g[f"pred_{k}"] - g["real"]) for g in grupo) / n for k in ("a", "b", "c", "d")]
        nombre = catalogo[sku]["nombre"][:28]
        print(f"  {sku:<9}{nombre:<30}{n:>3}{real:>9.1f}{maes[0]:>9.2f}{maes[1]:>9.2f}{maes[2]:>9.2f}{maes[3]:>9.2f}")


def imprimir_por_semana(titulo, filas):
    print()
    print(titulo)
    print(f"  {'semana':<12}{'n':>4}{'MAE A':>10}{'MAE B':>10}{'MAE C':>10}{'MAE D':>10}")
    por_semana = {}
    for f in filas:
        por_semana.setdefault(f["semana_inicio"], []).append(f)
    for semana in sorted(por_semana):
        grupo = por_semana[semana]
        n = len(grupo)
        maes = [sum(abs(g[f"pred_{k}"] - g["real"]) for g in grupo) / n for k in ("a", "b", "c", "d")]
        print(f"  {semana.isoformat():<12}{n:>4}{maes[0]:>10.2f}{maes[1]:>10.2f}{maes[2]:>10.2f}{maes[3]:>10.2f}")


def imprimir_hojas(filas, total_hojas, valores_hojas):
    usos = {}
    for f in filas:
        usos[f["hoja"]] = usos.get(f["hoja"], 0) + 1
    print()
    print(f"Hojas del arbol nuevo usadas: {len(usos)} de {total_hojas}")
    print(f"  {'hoja':<6}{'valor':>12}{'casos':>8}")
    for hoja in sorted(usos, key=lambda h: -usos[h]):
        print(f"  {hoja:<6}{valores_hojas[hoja]:>12.2f}{usos[hoja]:>8}")


def porcentaje(valor, referencia):
    if referencia == 0:
        return "-"
    return f"{(valor - referencia) / referencia * 100:+.1f} %"


def veredicto(resultado, titulo):
    if resultado is None:
        return
    mae_a, mae_b, mae_c = resultado["a"][0], resultado["b"][0], resultado["c"][0]
    rmse_a, rmse_b, rmse_c = resultado["a"][1], resultado["b"][1], resultado["c"][1]
    limite = 1 + TOLERANCIA_B
    mejora_a = mae_c < mae_a and rmse_c < rmse_a
    dentro_b = mae_c <= mae_b * limite and rmse_c <= rmse_b * limite
    print(titulo)
    print(f"  C mejora claramente a A: {'SI' if mejora_a else 'NO'} (MAE {mae_c:.2f} frente a {mae_a:.2f})")
    print(f"  C dentro de {TOLERANCIA_B * 100:.0f} % de B:   {'SI' if dentro_b else 'NO'} (MAE {mae_c:.2f} frente a {mae_b:.2f}, RMSE {rmse_c:.2f} frente a {rmse_b:.2f})")
    print(f"  Diferencia de C frente a B: MAE {porcentaje(mae_c, mae_b)}, RMSE {porcentaje(rmse_c, rmse_b)}")
    mae_d, rmse_d = resultado["d"][0], resultado["d"][1]
    print(f"  Diferencia de C frente a D: MAE {porcentaje(mae_c, mae_d)}, RMSE {porcentaje(rmse_c, rmse_d)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--simulacion", default="plan/simulacion")
    parser.add_argument("--arbol", default=RUTA_ARBOL)
    parser.add_argument("--meta", default=None)
    parser.add_argument("--arbol-actual", default=RUTA_ARBOL)
    parser.add_argument("--categorias", default=None)
    parser.add_argument("--salida", default=None)
    args = parser.parse_args()

    carpeta = Path(args.simulacion)
    arbol = cargar_arbol(args.arbol)
    valores_hojas = numerar_hojas(arbol)
    arbol_actual = cargar_arbol(args.arbol_actual)
    numerar_hojas(arbol_actual)
    ruta_meta = Path(args.meta) if args.meta else Path(args.arbol).with_name(Path(args.arbol).stem + ".meta.json")
    meta = cargar_meta(ruta_meta)
    tipo_objetivo = meta.get("tipo_objetivo")
    if tipo_objetivo not in (None, "unidades", OBJETIVO_RAZON):
        print(f"tipo_objetivo no soportado: {tipo_objetivo}")
        return 1
    razon = tipo_objetivo == OBJETIVO_RAZON

    ventas = cargar_ventas(carpeta / "ventas_semanales.csv")
    stock = cargar_stock(carpeta / "stock_lunes.csv")
    catalogo = cargar_catalogo(carpeta / "catalogo.csv")
    ruta_categorias = Path(args.categorias) if args.categorias else carpeta / "categorias_reales.csv"
    categorias, origen_categorias = cargar_categorias(ruta_categorias, catalogo)

    semanas = sorted({s for por_semana in ventas.values() for s in por_semana})
    indice = {s: i + 1 for i, s in enumerate(semanas)}
    primera_venta = {}
    for sku, por_semana in ventas.items():
        con_ventas = [s for s, u in por_semana.items() if u > 0]
        primera_venta[sku] = min(con_ventas) if con_ventas else None

    print(f"Semanas en los datos: {len(semanas)} ({semanas[0]} a {semanas[-1]})")
    print(f"Arbol nuevo: {args.arbol} ({len(valores_hojas)} hojas, version {meta.get('version', 'sin meta')}, objetivo {tipo_objetivo or 'unidades'})")
    print(f"Arbol v10.8: {args.arbol_actual}")
    print(f"categoria_id: {origen_categorias} ({sorted(set(categorias.values()))})")

    filas = []
    sin_ventas_previas = []
    sin_stock = 0
    for sku in sorted(ventas):
        for semana in semanas:
            if indice[semana] < PRIMERA_SEMANA_EVALUABLE or semana not in ventas[sku]:
                continue
            previas = [ventas[sku].get(semana - timedelta(weeks=k), 0.0) for k in range(1, SEMANAS_ENTRADA + 1)]
            if sum(previas) <= 0:
                sin_ventas_previas.append((sku, semana))
                continue
            if semana not in stock.get(sku, {}):
                sin_stock += 1
                continue
            promedio = sum(previas) / SEMANAS_ENTRADA
            quincena = 1.0 if semana_incluye_quincena(semana) else 0.0
            base = {
                "es_quincena": quincena,
                "categoria_id": categorias[sku],
                "stock_actual": stock[sku][semana],
            }
            variables_c = dict(base)
            for k, valor in enumerate(previas, start=1):
                variables_c[f"ventas_sem_{k}"] = valor
            variables_c["promedio_4sem"] = promedio
            variables_a = dict(base)
            for nombre in ("ventas_sem_1", "ventas_sem_2", "ventas_sem_3", "ventas_sem_4", "promedio_4sem"):
                variables_a[nombre] = 0.0
            pred_a, _ = evaluar(arbol_actual, variables_a)
            pred_d, _ = evaluar(arbol_actual, variables_c)
            pred_c, hoja = predecir(arbol, variables_c, razon)
            primera = primera_venta[sku]
            historial = (semana - primera).days // 7 + 1 if primera is not None and primera <= semana else 0
            filas.append(
                {
                    "sku": sku,
                    "semana_inicio": semana,
                    "semana_n": indice[semana],
                    "real": ventas[sku][semana],
                    "pred_a": pred_a,
                    "pred_b": promedio,
                    "pred_c": pred_c,
                    "pred_d": pred_d,
                    "hoja": hoja,
                    "semanas_historial": historial,
                    "apto_backend": historial >= SEMANAS_MIN_HISTORIAL,
                }
            )

    principal = filas
    fiel = [f for f in filas if f["apto_backend"]]

    print()
    print("Excluidos de las metricas")
    print(f"  pares sin ventas en las 4 semanas previas: {len(sin_ventas_previas)}")
    productos_excluidos = sorted({sku for sku, _ in sin_ventas_previas})
    print(f"  productos afectados: {len(productos_excluidos)} {productos_excluidos}")
    print(f"  pares sin foto de stock: {sin_stock}")
    descartados_regla = len(principal) - len(fiel)
    print(f"  pares evaluables en la tabla principal que el backend dejaria en 'Sin datos suficientes': {descartados_regla}")

    r1 = imprimir_resumen(
        f"TABLA PRINCIPAL: semanas {PRIMERA_SEMANA_EVALUABLE} a {len(semanas)} (4 semanas previas por prediccion)",
        principal,
    )
    r2 = imprimir_resumen(
        f"TABLA FIEL AL BACKEND: solo pares con {SEMANAS_MIN_HISTORIAL} o mas semanas de historial",
        fiel,
    )

    print()
    validacion = meta.get("metricas_validacion")
    if validacion:
        print(f"Referencia del entrenamiento (meta): MAE {validacion['mae']:.2f}, RMSE {validacion['rmse']:.2f}")

    print()
    veredicto(r1, "Condiciones (tabla principal, informativo)")
    veredicto(r2, "Condiciones de aceptacion (tabla fiel al backend)")

    imprimir_por_producto("Desglose por producto (tabla principal)", principal, catalogo)
    imprimir_por_semana("Desglose por semana (tabla principal)", principal)
    imprimir_hojas(principal, len(valores_hojas), valores_hojas)

    salida = Path(args.salida) if args.salida else carpeta / "backtest_detalle.csv"
    with open(salida, "w", newline="", encoding="utf-8") as f:
        escritor = csv.writer(f, lineterminator="\n")
        escritor.writerow(
            ["sku", "semana_inicio", "semana_n", "real", "pred_a", "pred_b", "pred_c", "pred_d", "hoja", "semanas_historial", "apto_backend"]
        )
        for fila in principal:
            escritor.writerow(
                [
                    fila["sku"],
                    fila["semana_inicio"].isoformat(),
                    fila["semana_n"],
                    f"{fila['real']:.3f}",
                    f"{fila['pred_a']:.2f}",
                    f"{fila['pred_b']:.2f}",
                    f"{fila['pred_c']:.2f}",
                    f"{fila['pred_d']:.2f}",
                    fila["hoja"],
                    fila["semanas_historial"],
                    "SI" if fila["apto_backend"] else "NO",
                ]
            )
    print()
    print(f"Detalle escrito en {salida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
