import argparse
import hashlib
import secrets
import sys


def construir_parser():
    parser = argparse.ArgumentParser(
        description="Genera un codigo de acceso de un solo uso para crear una cuenta."
    )
    parser.add_argument("--nota", default="", help="Para quien es el codigo (maximo 200 caracteres)")
    parser.add_argument("--dias", type=int, default=7, help="Dias de vigencia (1 a 90, por defecto 7)")
    return parser


def validar(nota, dias):
    if not 1 <= dias <= 90:
        sys.exit("--dias debe estar entre 1 y 90")
    if len(nota) > 200:
        sys.exit("--nota admite como maximo 200 caracteres")
    if any(ord(c) < 32 for c in nota):
        sys.exit("--nota no admite caracteres de control")


def sql_texto(valor):
    return "'" + valor.replace("'", "''") + "'"


def main():
    args = construir_parser().parse_args()
    nota = args.nota.strip()
    validar(nota, args.dias)

    codigo = secrets.token_urlsafe(32)
    huella = hashlib.sha256(codigo.encode("utf-8")).hexdigest()
    nota_sql = sql_texto(nota) if nota else "NULL"

    print("Codigo de acceso (se muestra una sola vez, entregalo por un canal privado):")
    print()
    print(codigo)
    print()
    print("Ejecuta esta sentencia en la base de datos (guarda solo el hash, nunca el codigo):")
    print()
    print(
        "INSERT INTO codigo_registro (codigo_hash, nota, expira_en) VALUES "
        f"('{huella}', {nota_sql}, CURRENT_TIMESTAMP + INTERVAL '{args.dias} days');"
    )


if __name__ == "__main__":
    main()
