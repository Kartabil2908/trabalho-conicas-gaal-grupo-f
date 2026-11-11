const obterElemento = (id) => document.getElementById(id);
const canvas = obterElemento("graph");
const contextoGrafico = canvas.getContext("2d");
let pontosCalculados = [];
let atualizacaoPendente = false;
let marcadoresInterativos = [];
let ramosInterativos = [];
let configuracaoGrafico = null;
let quadroHoverPendente = 0;
let posicaoPonteiro = null;

function ocultarDicaInterativa() {
  posicaoPonteiro = null;
  obterElemento("chart-tip").hidden = true;
  obterElemento("hover-dot").hidden = true;
}

// Define os formatos numericos usados nos resultados.
const formatadoresDeNumero = Array.from(
  { length: 5 },
  (_, digits) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }),
);
const formatarNumero = (value, digits = 2) =>
  formatadoresDeNumero[digits].format(value);
const formatadorCompacto = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});

let temporizadorTabela;
function agendarAtualizacaoTabela() {
  clearTimeout(temporizadorTabela);

  if (obterElemento("table-details").open) {
    temporizadorTabela = setTimeout(atualizarTabela, 140);
  }
}

function gerarPontosDaHiperbole(
  centroX,
  centroY,
  semiEixoHorizontal,
  semiEixoVertical,
  limiteHorizontal,
  quantidadeAmostras,
) {
  const pontos = [];

  for (const lado of [-1, 1]) {
    for (
      let indiceAmostra = 0;
      indiceAmostra < quantidadeAmostras;
      indiceAmostra++
    ) {
      const distanciaHorizontal =
        semiEixoHorizontal +
        ((limiteHorizontal - semiEixoHorizontal) * indiceAmostra) /
          (quantidadeAmostras - 1);
      const x = centroX + lado * distanciaHorizontal;
      const altura =
        semiEixoVertical *
        Math.sqrt(
          Math.max(0, (distanciaHorizontal / semiEixoHorizontal) ** 2 - 1),
        );

      pontos.push([x, centroY + altura]);
      if (altura !== 0) {
        pontos.push([x, centroY - altura]);
      }
    }
  }

  return pontos;
}

function atualizarTabela() {
  if (!obterElemento("table-details").open) {
    return;
  }

  obterElemento("rows").innerHTML = pontosCalculados
    .map(
      ([x, y]) =>
        `<tr><td>${formatarNumero(x, 4)}</td><td>${formatarNumero(y, 4)}</td></tr>`,
    )
    .join("");
}
// Atualiza o grafico, as formulas e os pontos exibidos.
function atualizarVisualizacao() {
  atualizacaoPendente = false;
  ocultarDicaInterativa();
  marcadoresInterativos = [];
  ramosInterativos = [];

  const estilosTema = getComputedStyle(document.documentElement);
  const coresTema = Object.fromEntries(
    [
      "--fg",
      "--bg",
      "--panel",
      "--border",
      "--curve",
      "--button",
      "--axis",
      "--muted",
      "--focus",
      "--vertex",
      "--asym",
      "--grid",
    ].map((key) => [key, estilosTema.getPropertyValue(key).trim()]),
  );
  const a = +obterElemento("a").value;
  const b = +obterElemento("b").value;
  const h = +obterElemento("h").value;
  const k = +obterElemento("k").value;
  const n = +obterElemento("n").value;
  const c = Math.hypot(a, b);

  for (const id of ["a", "b", "h", "k", "n"]) {
    obterElemento("o" + id).value = formatarNumero(
      +obterElemento(id).value,
      id === "n" ? 0 : 1,
    );
  }
  pontosCalculados = gerarPontosDaHiperbole(h, k, a, b, 20, n);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * devicePixelRatio);
  const pixelHeight = Math.round(height * devicePixelRatio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  contextoGrafico.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  contextoGrafico.clearRect(0, 0, width, height);

  const escalaGrafico = Math.min((width - 52) / 24, (height - 48) / 12);
  const converterXParaTela = (x) => width / 2 + x * escalaGrafico;
  const converterYParaTela = (y) => height / 2 - y * escalaGrafico;
  configuracaoGrafico = { width, height };

  function desenharLinha(pontos, color, lineWidth = 1, dash = []) {
    contextoGrafico.beginPath();
    contextoGrafico.strokeStyle = color;
    contextoGrafico.lineWidth = lineWidth;
    contextoGrafico.setLineDash(dash);
    pontos.forEach(([x, y], index) => {
      if (index) {
        contextoGrafico.lineTo(converterXParaTela(x), converterYParaTela(y));
      } else {
        contextoGrafico.moveTo(converterXParaTela(x), converterYParaTela(y));
      }
    });
    contextoGrafico.stroke();
    contextoGrafico.setLineDash([]);
  }

  function desenharTexto(x, y, value) {
    contextoGrafico.fillStyle = coresTema["--muted"];
    contextoGrafico.font = "14px system-ui";
    contextoGrafico.fillText(value, x, y);
  }

  const limiteVisivelX = (width / 2 - 20) / escalaGrafico;
  const limiteVisivelY = (height / 2 - 20) / escalaGrafico;
  const intervaloGrade = width < 450 ? 4 : 2;

  for (
    let x = Math.ceil(-limiteVisivelX / intervaloGrade) * intervaloGrade;
    x < limiteVisivelX;
    x += intervaloGrade
  ) {
    desenharLinha(
      [
        [x, -limiteVisivelY],
        [x, limiteVisivelY],
      ],
      coresTema["--grid"],
    );
    if (x) {
      desenharTexto(
        converterXParaTela(x) + 3,
        converterYParaTela(0) + 16,
        "" + x,
      );
    }
  }

  for (
    let y = Math.ceil(-limiteVisivelY / intervaloGrade) * intervaloGrade;
    y < limiteVisivelY;
    y += intervaloGrade
  ) {
    desenharLinha(
      [
        [-limiteVisivelX, y],
        [limiteVisivelX, y],
      ],
      coresTema["--grid"],
    );
    if (y) {
      desenharTexto(
        converterXParaTela(0) + 5,
        converterYParaTela(y) - 4,
        "" + y,
      );
    }
  }

  desenharLinha(
    [
      [-limiteVisivelX, 0],
      [limiteVisivelX, 0],
    ],
    coresTema["--axis"],
  );
  desenharLinha(
    [
      [0, -limiteVisivelY],
      [0, limiteVisivelY],
    ],
    coresTema["--axis"],
  );
  desenharTexto(
    converterXParaTela(limiteVisivelX) - 8,
    converterYParaTela(0) - 8,
    "x",
  );
  desenharTexto(
    converterXParaTela(0) + 8,
    converterYParaTela(limiteVisivelY) + 9,
    "y",
  );

  contextoGrafico.save();
  contextoGrafico.beginPath();
  contextoGrafico.rect(16, 16, width - 32, height - 32);
  contextoGrafico.clip();

  if (obterElemento("assintotas").checked) {
    for (const sentido of [-1, 1]) {
      desenharLinha(
        [
          [-100, k + (sentido * b * (-100 - h)) / a],
          [100, k + (sentido * b * (100 - h)) / a],
        ],
        coresTema["--asym"],
        2,
        [8, 6],
      );
    }
  }

  if (obterElemento("retangulo").checked) {
    desenharLinha(
      [
        [h - a, k - b],
        [h + a, k - b],
        [h + a, k + b],
        [h - a, k + b],
        [h - a, k - b],
      ],
      coresTema["--axis"],
      1,
      [3, 5],
    );
  }

  for (const lado of [-1, 1]) {
    const base = lado < 0 ? 0 : 2 * n - 1;
    const ramo = [];

    for (let i = n - 1; i >= 1; i--) {
      ramo.push(pontosCalculados[base + 2 * i]);
    }
    ramo.push(pontosCalculados[base]);
    for (let i = 1; i < n; i++) {
      ramo.push(pontosCalculados[base + 2 * i - 1]);
    }

    ramosInterativos.push({
      lado,
      pontos: ramo.map(([x, y]) => ({
        x,
        y,
        px: converterXParaTela(x),
        py: converterYParaTela(y),
      })),
    });
    desenharLinha(ramo, coresTema["--curve"], 3.5);

    if (obterElemento("pontos").checked) {
      for (const [x, y] of ramo) {
        contextoGrafico.fillStyle = coresTema["--curve"];
        contextoGrafico.beginPath();
        contextoGrafico.arc(
          converterXParaTela(x),
          converterYParaTela(y),
          2.5,
          0,
          Math.PI * 2,
        );
        contextoGrafico.fill();
      }
    }
  }

  function desenharMarcador(x, y, label, color, diamond) {
    const px = converterXParaTela(x);
    const py = converterYParaTela(y);
    const description = label.startsWith("F")
      ? "Foco " + label
      : label.startsWith("V")
        ? "Vértice " + label
        : "Centro";

    marcadoresInterativos.push({ x, y, px, py, label: description });
    contextoGrafico.fillStyle = color;
    contextoGrafico.beginPath();

    if (diamond) {
      contextoGrafico.moveTo(px, py - 6);
      contextoGrafico.lineTo(px + 6, py);
      contextoGrafico.lineTo(px, py + 6);
      contextoGrafico.lineTo(px - 6, py);
      contextoGrafico.closePath();
    } else {
      contextoGrafico.arc(px, py, 6, 0, Math.PI * 2);
    }

    contextoGrafico.fill();
    const labelY = py + (diamond ? -30 : label === "C" ? 32 : 38);
    const labelX = px - 9;
    contextoGrafico.font = "600 15px system-ui";
    contextoGrafico.fillStyle = coresTema["--bg"];
    contextoGrafico.fillRect(labelX - 4, labelY - 16, 27, 22);
    contextoGrafico.fillStyle = color;
    contextoGrafico.fillText(label, labelX, labelY);
  }

  if (obterElemento("focos").checked) {
    desenharMarcador(h - c, k, "F₁", coresTema["--focus"], true);
    desenharMarcador(h + c, k, "F₂", coresTema["--focus"], true);
  }
  if (obterElemento("vertices").checked) {
    desenharMarcador(h - a, k, "V₁", coresTema["--vertex"], false);
    desenharMarcador(h + a, k, "V₂", coresTema["--vertex"], false);
  }
  desenharMarcador(h, k, "C", coresTema["--muted"], false);
  contextoGrafico.restore();

  const formatarTermo = (value, name) =>
    value === 0
      ? name
      : `(${name} ${value < 0 ? "+" : "−"} ${formatarNumero(Math.abs(value), 1)})`;

  obterElemento("equation").innerHTML = `
    <span class="frac">
      <span>${formatarTermo(h, "x")}²</span>
      <span>${formatarNumero(a, 1)}²</span>
    </span>
    <span>−</span>
    <span class="frac">
      <span>${formatarTermo(k, "y")}²</span>
      <span>${formatarNumero(b, 1)}²</span>
    </span>
    <span>= 1</span>
  `;
  obterElemento("substitution").innerHTML = `
    <span>a² = ${formatarNumero(a, 1)}² = <strong>${formatarNumero(a * a)}</strong></span>
    <span>b² = ${formatarNumero(b, 1)}² = <strong>${formatarNumero(b * b)}</strong></span>
    <span>Centro: <strong>(${formatarNumero(h, 1)}; ${formatarNumero(k, 1)})</strong></span>
  `;

  const A = b * b;
  const B = -(a * a);
  const D = -2 * b * b * h;
  const E = 2 * a * a * k;
  const F = b * b * h * h - a * a * k * k - a * a * b * b;

  function formatarPolinomio(terms) {
    let output = "";

    for (const [rawValue, name] of terms) {
      const value = Math.round(rawValue * 10000) / 10000;
      if (value === 0) {
        continue;
      }

      const magnitude = Math.abs(value);
      const number =
        magnitude === 1 && name ? "" : formatadorCompacto.format(magnitude);
      const sign = output
        ? value < 0
          ? " − "
          : " + "
        : value < 0
          ? "−"
          : "";
      output += sign + number + name;
    }

    return output || "0";
  }

  obterElemento("results").innerHTML = `
    <p>
      <strong>Forma geral</strong><br>
      ${formatarPolinomio([
        [A, "x²"],
        [B, "y²"],
        [D, "x"],
        [E, "y"],
        [F, ""],
      ])} = 0
    </p>
    <p>
      <strong>Focos</strong><br>
      c = √(a² + b²) = √(${formatarNumero(a * a)} + ${formatarNumero(b * b)})
      = √${formatarNumero(a * a + b * b)} ≈ ${formatarNumero(c, 3)}
    </p>
    <p>
      <strong>Assíntotas</strong><br>
      ${formatarTermo(k, "y")} = ± (${formatarNumero(b, 1)} / ${formatarNumero(a, 1)}) · ${formatarTermo(h, "x")}<br>
      Inclinações ≈ ±${formatarNumero(b / a, 3)}
    </p>
  `;

  obterElemento("mc").textContent = formatarNumero(c, 3);
  obterElemento("me").textContent = formatarNumero(c / a, 3);
  obterElemento("mp").textContent = pontosCalculados.length;

  const criarLinhaDePonto = (name, formula, x, y, approx = false) => `
    <div class="point-row">
      <strong>${name}</strong>
      <div class="point-formula">${formula}</div>
      <div class="point-coordinates">
        <span>x ${approx ? "≈" : "="} <b>${formatarNumero(x, approx ? 3 : 1)}</b></span>
        <span>y = <b>${formatarNumero(y, 1)}</b></span>
      </div>
    </div>
  `;

  obterElemento("elements").innerHTML = `
    <section class="point-group">
      <h3 class="vertex-title">● Vértices</h3>
      ${criarLinhaDePonto("V₁ · esquerdo", "(h − a, k)", h - a, k)}
      ${criarLinhaDePonto("V₂ · direito", "(h + a, k)", h + a, k)}
    </section>
    <section class="point-group">
      <h3 class="focus-title">◆ Focos</h3>
      ${criarLinhaDePonto("F₁ · esquerdo", "(h − c, k)", h - c, k, true)}
      ${criarLinhaDePonto("F₂ · direito", "(h + c, k)", h + c, k, true)}
      <p class="precision">c = √(a² + b²) ≈ ${formatarNumero(c, 3)}</p>
    </section>
  `;
  canvas.setAttribute(
    "aria-label",
    `Hipérbole: a=${a}, b=${b}, centro (${h}, ${k}), distância focal ${c.toFixed(3)}.`,
  );
  agendarAtualizacaoTabela();
}

// Localiza o ponto mais proximo do cursor e posiciona a dica.
function atualizarDicaInterativa() {
  quadroHoverPendente = 0;
  if (!posicaoPonteiro || !configuracaoGrafico) {
    return;
  }

  const { x: cursorX, y: cursorY } = posicaoPonteiro;
  const { width, height } = configuracaoGrafico;
  const estaDentroDoGrafico = (point) =>
    point.px >= 16 &&
    point.px <= width - 16 &&
    point.py >= 16 &&
    point.py <= height - 16;
  const marcadoresProximos = marcadoresInterativos
    .filter(
      (point) =>
        estaDentroDoGrafico(point) &&
        Math.hypot(point.px - cursorX, point.py - cursorY) <= 12,
    )
    .sort(
      (pontoInicial, pontoFinal) =>
        Math.hypot(pontoInicial.px - cursorX, pontoInicial.py - cursorY) -
        Math.hypot(pontoFinal.px - cursorX, pontoFinal.py - cursorY),
    );

  let alvoMaisProximo = null;
  let textoDaDica = "";

  if (marcadoresProximos.length) {
    alvoMaisProximo = marcadoresProximos[0];
    textoDaDica = marcadoresProximos
      .map(
        (point) =>
          `${point.label}\nx = ${formatarNumero(point.x, 3)}   y = ${formatarNumero(point.y, 3)}`,
      )
      .join("\n");
  } else {
    let distanciaMinima = 10;

    for (const ramo of ramosInterativos) {
      for (let i = 1; i < ramo.pontos.length; i++) {
        const pontoInicial = ramo.pontos[i - 1];
        const pontoFinal = ramo.pontos[i];
        const dx = pontoFinal.px - pontoInicial.px;
        const dy = pontoFinal.py - pontoInicial.py;
        const comprimentoAoQuadrado = dx * dx + dy * dy;
        const proporcaoNoSegmento = comprimentoAoQuadrado
          ? Math.max(
              0,
              Math.min(
                1,
                ((cursorX - pontoInicial.px) * dx + (cursorY - pontoInicial.py) * dy) /
                  comprimentoAoQuadrado,
              ),
            )
          : 0;
        const px = pontoInicial.px + proporcaoNoSegmento * dx;
        const py = pontoInicial.py + proporcaoNoSegmento * dy;
        const distanciaAtual = Math.hypot(cursorX - px, cursorY - py);

        if (
          distanciaAtual < distanciaMinima &&
          estaDentroDoGrafico({ px, py })
        ) {
          distanciaMinima = distanciaAtual;
          alvoMaisProximo = {
            px,
            py,
            x: pontoInicial.x + proporcaoNoSegmento * (pontoFinal.x - pontoInicial.x),
            y: pontoInicial.y + proporcaoNoSegmento * (pontoFinal.y - pontoInicial.y),
          };
          textoDaDica = `Hipérbole · ramo ${ramo.lado < 0 ? "esquerdo" : "direito"}
x ≈ ${formatarNumero(alvoMaisProximo.x, 3)}   y ≈ ${formatarNumero(alvoMaisProximo.y, 3)}
Aproximação no segmento desenhado`;
        }
      }
    }
  }

  const tooltip = obterElemento("chart-tip");
  const dot = obterElemento("hover-dot");
  if (!alvoMaisProximo) {
    tooltip.hidden = true;
    dot.hidden = true;
    return;
  }

  tooltip.textContent = textoDaDica;
  tooltip.hidden = false;
  dot.hidden = false;
  dot.style.left = alvoMaisProximo.px + "px";
  dot.style.top = alvoMaisProximo.py + "px";
  tooltip.style.left =
    Math.max(
      8,
      Math.min(alvoMaisProximo.px + 18, width - tooltip.offsetWidth - 8),
    ) + "px";
  tooltip.style.top =
    Math.max(8, Math.min(alvoMaisProximo.py + 18, height - tooltip.offsetHeight - 8)) +
    "px";
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  posicaoPonteiro = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  if (!quadroHoverPendente) {
    quadroHoverPendente = requestAnimationFrame(atualizarDicaInterativa);
  }
});
canvas.addEventListener("pointerleave", ocultarDicaInterativa);
canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  posicaoPonteiro = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  atualizarDicaInterativa();
});

// Agrupa mudancas proximas em um unico redesenho.
function agendarAtualizacaoVisual() {
  if (!atualizacaoPendente) {
    atualizacaoPendente = true;
    requestAnimationFrame(atualizarVisualizacao);
  }
}

document.querySelectorAll("input").forEach((element) => {
  element.addEventListener("input", agendarAtualizacaoVisual);
});

obterElemento("reset").onclick = () => {
  for (const [id, value] of Object.entries({ a: 3, b: 2, h: 0, k: 0, n: 150 })) {
    obterElemento(id).value = value;
  }
  agendarAtualizacaoVisual();
};

obterElemento("csv").onclick = () => {
  atualizarVisualizacao();
  const csv = ["x,y", ...pontosCalculados.map((point) => point.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "pontos_hiperbole.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

obterElemento("table-details").addEventListener("toggle", atualizarTabela);
new ResizeObserver(agendarAtualizacaoVisual).observe(canvas.parentElement);

function aplicarTema(value) {
  document.documentElement.dataset.theme = value;
  for (const temaSelecionado of ["light", "dark"]) {
    obterElemento(temaSelecionado).setAttribute(
      "aria-pressed",
      String(temaSelecionado === value),
    );
  }

  try {
    localStorage.setItem("gaal-theme", value);
  } catch {}

  agendarAtualizacaoVisual();
}

obterElemento("light").onclick = () => aplicarTema("light");
obterElemento("dark").onclick = () => aplicarTema("dark");

let temaSalvo;
try {
  temaSalvo = localStorage.getItem("gaal-theme");
} catch {}

const temaPreferido = matchMedia("(prefers-color-scheme: light)").matches
  ? "light"
  : "dark";
aplicarTema(temaSalvo === "light" || temaSalvo === "dark" ? temaSalvo : temaPreferido);

obterElemento("fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  } catch {
    obterElemento("status").textContent =
      "Use F11 para alternar a tela inteira neste navegador.";
  }
};

document.addEventListener("fullscreenchange", () => {
  obterElemento("fullscreen").textContent = document.fullscreenElement
    ? "Sair da tela inteira"
    : "Tela inteira";
  agendarAtualizacaoVisual();
});

atualizarVisualizacao();
