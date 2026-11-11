# Laboratório de hipérboles — Grupo F

Dê dois cliques em **APRESENTAR.bat** ou **apresentacao.html**.
A apresentação abre diretamente no navegador, sem instalação, servidor ou internet.

- Use **Claro** e **Escuro** no topo. O tema escolhido é lembrado pelo navegador quando o armazenamento local está disponível.
- Clique em **Tela inteira** para esconder as barras do navegador; Esc sai desse modo. F11 também pode ser usado.
- Arraste a e b para alterar os semieixos; h e k deslocam o centro.
- A equação mostra as frações com os valores de a² e b². Abaixo, acompanhe a substituição dos parâmetros, a forma geral, a distância focal e as assíntotas.
- A curva, os focos, os vértices e os resultados se atualizam durante o arraste.
- A tabela e o CSV contêm todos os pontos calculados, inclusive os que estão fora da janela gráfica.

## Para apresentar

Comece com a = 3, b = 2 e centro (0, 0): x²/9 − y²/4 = 1.
Os vértices são (±3, 0), os focos são (±√13, 0) e as assíntotas são y = ±(2/3)x.
Mude um parâmetro por vez e mostre onde ele entra na equação.
Marque “Pontos calculados” e reduza as amostras para explicar a construção.

## Cálculo

O navegador executa o procedimento de `calcularPontos` em `apresentacao.html`:
recebe parâmetros, calcula coordenadas, armazena pares e desenha cada ramo separadamente.
O limite horizontal de amostragem é 20 e os eixos usam a mesma escala.
O arquivo original `hiperbole_grupo_f.py` permanece como referência do cálculo em Python.
Não há modo alternativo na interface nem dependência de Streamlit.
