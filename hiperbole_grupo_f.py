import math


def ler_numero(mensagem: str) -> float:
    return float(input(mensagem).replace(",", "."))


def calcular_pontos(
    centro_x: float,
    centro_y: float,
    semi_eixo_horizontal: float,
    semi_eixo_vertical: float,
    distancia_maxima: float,
    quantidade: int,
) -> list[tuple[float, float]]:
    a = semi_eixo_horizontal
    b = semi_eixo_vertical

    if a <= 0 or b <= 0:
        raise ValueError("Os semieixos devem ser positivos.")
    if distancia_maxima < a:
        raise ValueError("A distância máxima deve ser maior ou igual a a.")
    if quantidade < 2:
        raise ValueError("A quantidade de pontos deve ser pelo menos 2.")

    pontos: list[tuple[float, float]] = []

    for lado in (-1, 1):
        for indice in range(quantidade):
            distancia = a + (distancia_maxima - a) * indice / (quantidade - 1)
            x = centro_x + lado * distancia
            altura = b * math.sqrt((distancia / a) ** 2 - 1)

            pontos.append((x, centro_y + altura))
            if altura != 0:
                pontos.append((x, centro_y - altura))

    return pontos


def main() -> None:
    print("Hipérbole com eixo horizontal")
    print("Equação: (x - centro_x)²/a² - (y - centro_y)²/b² = 1")
    print("Digite os dados da hipérbole:")

    centro_x = ler_numero("Centro x: ")
    centro_y = ler_numero("Centro y: ")
    a = ler_numero("Semieixo horizontal a: ")
    b = ler_numero("Semieixo vertical b: ")
    distancia_maxima = ler_numero(
        "Distância máxima do centro aos pontos (em x): "
    )
    quantidade = int(input("Quantidade de valores de x em cada lado: "))

    pontos = calcular_pontos(
        centro_x,
        centro_y,
        a,
        b,
        distancia_maxima,
        quantidade,
    )
    print(f"\n{len(pontos)} pontos foram guardados na lista 'pontos'.")
    print("Pontos calculados:")
    for indice, (x, y) in enumerate(pontos, start=1):
        print(f"Ponto {indice}: (x={x:.6f}, y={y:.6f})")


if __name__ == "__main__":
    try:
        main()
    except ValueError as erro:
        print(f"Erro: {erro}")
