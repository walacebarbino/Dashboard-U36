let meuGraficoObj = null;
let dadosOriginaisDashboard = [];
let statusFabricacaoChartObj = null;
let statusMontagemChartObj = null;

const MAPA_CONCATENACAO_PPU = [
    { value: "4.3.5.1.1 / 4.3.5.4.2", itens: ["4.3.5.1.1", "4.3.5.4.2"] },
    { value: "4.3.5.1.2 / 4.3.5.4.3", itens: ["4.3.5.1.2", "4.3.5.4.3"] },
    { value: "4.3.5.1.3 / 4.3.5.4.4", itens: ["4.3.5.1.3", "4.3.5.4.4"] },
    { value: "4.3.5.2.1 / 4.3.5.5.2", itens: ["4.3.5.2.1", "4.3.5.5.2"] },
    { value: "4.3.5.2.2 / 4.3.5.5.3", itens: ["4.3.5.2.2", "4.3.5.5.3"] },
    { value: "4.3.5.2.3 / 4.3.5.5.4", itens: ["4.3.5.2.3", "4.3.5.5.4"] },
    { value: "4.3.5.3.1 / 4.3.5.6.2", itens: ["4.3.5.3.1", "4.3.5.6.2"] },
    { value: "4.3.5.3.2 / 4.3.5.6.3", itens: ["4.3.5.3.2", "4.3.5.6.3"] },
    { value: "4.3.5.3.3 / 4.3.5.6.4", itens: ["4.3.5.3.3", "4.3.5.6.4"] }
];

const ITENS_NAO_CONCATENAR = [
    "4.3.5.4.1",
    "4.3.5.5.1",
    "4.3.5.6.1"
];

function preencherDataAtual() {
    const el = document.getElementById("dataAtual");
    if (!el) return;

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();

    el.textContent = `${dia}/${mes}/${ano}`;
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === "") return 0;
    if (typeof valor === "number") return valor;

    let texto = String(valor).trim();
    texto = texto.replace(/\s/g, "");
    texto = texto.replace(/\.(?=\d{3}(\D|$))/g, "");
    texto = texto.replace(",", ".");

    const numero = parseFloat(texto);
    return isNaN(numero) ? 0 : numero;
}

function formatarToneladas(valorKg) {
    return `${(valorKg / 1000).toFixed(2)} ton`;
}

function formatarNumeroBr(valor, casas = 2) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

function obterValorColunaG(item) {
    return normalizarNumero(
        item["G"] ??
        item["COLUNA G"] ??
        item["VALOR G"] ??
        item["QTD CONTRATO"] ??
        0
    );
}

function obterValorColunaH(item) {
    return normalizarNumero(
        item["H"] ??
        item["COLUNA H"] ??
        item["VALOR H"] ??
        item["BASE REM. CONTRATO"] ??
        0
    );
}

function obterValorColunaK(item) {
    return normalizarNumero(
        item["K"] ??
        item["COLUNA K"] ??
        item["VALOR K"] ??
        item["TOTAL À FABRICAR (VALID.)"] ??
        item["TOTAL A FABRICAR (VALID.)"] ??
        item["TOTAL À MONTAR (VALID.)"] ??
        item["TOTAL A MONTAR (VALID.)"] ??
        0
    );
}

function carregarDashboard() {
    fetch("/api/ppu")
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                alert(data.erro);
                return;
            }

            dadosOriginaisDashboard = Array.isArray(data) ? data : [];
            processarDashboard(dadosOriginaisDashboard);
            preencherFiltroPpu(dadosOriginaisDashboard);
            configurarFiltroPpu();
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao carregar os dados da API /api/ppu.");
        });
}

function processarDashboard(data) {
    let totalFabricar = 0;
    let totalLiberado = 0;
    let totalProgramar = 0;

    if (!Array.isArray(data)) {
        console.warn("processarDashboard: data inválido", data);
        return;
    }

    data.forEach(item => {
        const itemCodigo = item["ITEM"] ?? "";
        const ppu = item["PPU"] ?? "";
        const mat = item["MAT"] ?? "";
        const regra = String(item["REGRA"] ?? "").trim().toLowerCase();
        const descricao = item["DESCRIÇÃO"] ?? "";

        const totalFabricarItem = normalizarNumero(item["TOTAL À FABRICAR (VALID.)"]);
        const liberadoItem = normalizarNumero(item["LIBERADO PELA ENGENHARIA"]);
        const programarItem = normalizarNumero(item["À Programar (Fabricação)"]);

        const temBase = itemCodigo || ppu || mat || regra || descricao;
        const regraValidaParaFabricar =
            regra.includes("fabricar") || regra.includes("montar");

        if (temBase && regraValidaParaFabricar) {
            totalFabricar += totalFabricarItem;
            totalLiberado += liberadoItem;
        }

        if (temBase) {
            totalProgramar += programarItem;
        }
    });

    const elPesoTotalValidado = document.getElementById("kpiPesoTotalValidado");
    const elIcEmitido = document.getElementById("kpiIcEmitido");
    const elReservadoProgramado = document.getElementById("kpiReservadoProgramado");
    const elEmEstoque = document.getElementById("kpiEmEstoque");
    const elPendRecebimento = document.getElementById("kpiPendRecebimento");
    const elTakeOff = document.getElementById("kpiTakeOff");

    if (elPesoTotalValidado) elPesoTotalValidado.textContent = formatarToneladas(totalFabricar);
    if (elIcEmitido) elIcEmitido.textContent = formatarToneladas(totalLiberado);
    if (elReservadoProgramado) elReservadoProgramado.textContent = formatarToneladas(totalProgramar);
    if (elEmEstoque) elEmEstoque.textContent = "0,00 ton";
    if (elPendRecebimento) elPendRecebimento.textContent = "0,00 ton";
    if (elTakeOff) elTakeOff.textContent = "0,00 ton";

    atualizarGraficoPpu(data, "todos");
    renderizarStatusFabricacaoMontagem(data);
}

function renderizarStatusFabricacaoMontagem(data) {
    if (!Array.isArray(data)) return;

    const dadosFabricacao = {
        contrato: 0,
        baseRem: 0,
        totalValid: 0
    };

    const dadosMontagem = {
        contrato: 0,
        baseRem: 0,
        totalValid: 0
    };

    data.forEach(item => {
        const regra = String(item["REGRA"] ?? "").trim().toUpperCase();

        if (regra === "FABRICAR") {
            dadosFabricacao.contrato += obterValorColunaG(item);
            dadosFabricacao.baseRem += obterValorColunaH(item);
            dadosFabricacao.totalValid += obterValorColunaK(item);
        } else if (regra === "MONTAR") {
            dadosMontagem.contrato += obterValorColunaG(item);
            dadosMontagem.baseRem += obterValorColunaH(item);
            dadosMontagem.totalValid += obterValorColunaK(item);
        }
    });

    const maxEscala = Math.max(
        dadosFabricacao.contrato,
        dadosFabricacao.baseRem,
        dadosFabricacao.totalValid,
        dadosMontagem.contrato,
        dadosMontagem.baseRem,
        dadosMontagem.totalValid
    );

    renderizarLegendaStatus("legendStatusFabricacao", "fabricacao");
    renderizarLegendaStatus("legendStatusMontagem", "montagem");

    renderizarGraficoStatus("statusFabricacaoChart", dadosFabricacao, "fabricacao", maxEscala);
    renderizarGraficoStatus("statusMontagemChart", dadosMontagem, "montagem", maxEscala);
}

function renderizarLegendaStatus(containerId, tipo = "fabricacao") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const labelFinal = tipo === "montagem"
        ? "TOTAL À MONTAR (VALID.)"
        : "TOTAL À FABRICAR (VALID.)";

    const itens = [
        { label: "CONTRATO", cor: "#d9d9d9" },
        { label: "BASE REM. CONTRATO", cor: "#ff7a1a" },
        { label: labelFinal, cor: "#4c7ee8" }
    ];

    container.innerHTML = itens.map(item => `
        <div class="legend-status-item">
            <span class="legend-status-cor" style="background:${item.cor};"></span>
            <span class="legend-status-texto">${item.label}</span>
        </div>
    `).join("");
}

function renderizarGraficoStatus(canvasId, dados, tipo, maxEscala) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (tipo === "fabricacao" && statusFabricacaoChartObj) {
        statusFabricacaoChartObj.destroy();
    }

    if (tipo === "montagem" && statusMontagemChartObj) {
        statusMontagemChartObj.destroy();
    }

    const novoGrafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "CONTRATO",
                "BASE REM. CONTRATO",
                tipo === "montagem" ? "TOTAL À MONTAR (VALID.)" : "TOTAL À FABRICAR (VALID.)"
            ],
            datasets: [
                {
                    data: [
                        dados.contrato,
                        dados.baseRem,
                        dados.totalValid
                    ],
                    backgroundColor: ["#d9d9d9", "#ff7a1a", "#4c7ee8"],
                    borderColor: ["#d9d9d9", "#ff7a1a", "#4c7ee8"],
                    borderWidth: 1,
                    barPercentage: 0.7,
                    categoryPercentage: 0.9
                }
            ]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: {
                padding: {
                    top: 4,
                    right: 30,
                    bottom: 4,
                    left: 0
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatarNumeroBr(context.raw, 0)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: maxEscala,
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false }
                },
                y: {
                    grid: { display: false },
                    ticks: { display: false },
                    border: { display: false }
                }
            }
        },
        plugins: [{
            id: `valueLabelsStatus_${tipo}`,
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                const dataset = chart.data.datasets[0];
                const meta = chart.getDatasetMeta(0);

                meta.data.forEach((bar, index) => {
                    const valor = dataset.data[index];
                    const texto = formatarNumeroBr(valor, 0);

                    ctx.save();
                    ctx.font = "700 15px DM Sans, sans-serif";
                    ctx.fillStyle = "#000000";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";

                    const larguraTexto = ctx.measureText(texto).width;
                    const paddingInterno = 8;
                    const xTexto = bar.x - larguraTexto - paddingInterno;

                    ctx.fillText(texto, xTexto, bar.y);
                    ctx.restore();
                });
            }
        }]
    });

    if (tipo === "fabricacao") {
        statusFabricacaoChartObj = novoGrafico;
    } else {
        statusMontagemChartObj = novoGrafico;
    }
}

function preencherFiltroPpu(data) {
    const select = document.getElementById("filtroPpu");
    if (!select) return;

    select.innerHTML = `<option value="todos">Todos os itens PPU</option>`;

    MAPA_CONCATENACAO_PPU.forEach(grupo => {
        const option = document.createElement("option");
        option.value = grupo.value;
        option.textContent = grupo.value;
        select.appendChild(option);
    });

    ITENS_NAO_CONCATENAR.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });

    const itensMapeados = new Set([
        ...MAPA_CONCATENACAO_PPU.flatMap(grupo => grupo.itens),
        ...ITENS_NAO_CONCATENAR
    ]);
}

function configurarFiltroPpu() {
    const select = document.getElementById("filtroPpu");
    if (!select) return;

    select.addEventListener("change", function () {
        atualizarGraficoPpu(dadosOriginaisDashboard, this.value);
    });
}

function obterItensDoFiltro(itemSelecionado) {
    if (itemSelecionado === "todos") return null;

    const grupo = MAPA_CONCATENACAO_PPU.find(g => g.value === itemSelecionado);
    if (grupo) return grupo.itens;

    return [itemSelecionado];
}

function atualizarTextoCentroGrafico(valor, subtitulo = "Escopo PPU") {
    const elValorCentro =
        document.getElementById("graficoPpuValorCentro") ||
        document.getElementById("valorCentroGrafico") ||
        document.getElementById("donutCenterValue");

    const elSubtituloCentro =
        document.getElementById("graficoPpuSubtituloCentro") ||
        document.getElementById("subtituloCentroGrafico") ||
        document.getElementById("donutCenterLabel");

    if (elValorCentro) {
        elValorCentro.textContent = formatarNumeroBr(valor);
    }

    if (elSubtituloCentro) {
        elSubtituloCentro.textContent = subtitulo;
    }
}

function atualizarGraficoPpu(data, itemSelecionado = "todos") {
    let totalFabricar = 0;
    let totalMontar = 0;

    let fabricarLegenda = 0;
    let montarLegenda = 0;
    let valorCentro = 0;

    let dadosFiltrados = data;

    if (itemSelecionado !== "todos") {
        const itensFiltro = obterItensDoFiltro(itemSelecionado);

        dadosFiltrados = data.filter(item => {
            const itemAtual = (item["ITEM"] ?? "").toString().trim();
            return itensFiltro.includes(itemAtual);
        });
    }

    dadosFiltrados.forEach(item => {
        const regra = (item["REGRA"] ?? "").toString().trim().toUpperCase();
        const valor = obterValorColunaG(item);

        if (regra === "FABRICAR") {
            totalFabricar += valor;
        } else if (regra === "MONTAR") {
            totalMontar += valor;
        }
    });

    fabricarLegenda = totalFabricar;
    montarLegenda = totalMontar;
    valorCentro = totalFabricar + totalMontar;

    atualizarTextoCentroGrafico(valorCentro, "Escopo PPU");
    desenharGrafico(fabricarLegenda, montarLegenda);
}

function pluginTextoCentroGrafico() {
    return {
        id: "textoCentroGrafico",
        afterDraw(chart) {
            const { ctx } = chart;
            const meta = chart.getDatasetMeta(0);

            if (!meta || !meta.data || !meta.data.length) return;

            const x = meta.data[0].x;
            const y = meta.data[0].y;

            const valorCentro = chart.config.options.plugins.textoCentro?.valor ?? "";
            const subtitulo = chart.config.options.plugins.textoCentro?.subtitulo ?? "Escopo PPU";

            ctx.save();
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "#ffffff";
            ctx.font = "700 18px DM Sans, sans-serif";
            ctx.fillText(valorCentro, x, y - 10);

            ctx.fillStyle = "#ffffff";
            ctx.font = "400 12px DM Sans, sans-serif";
            ctx.fillText(subtitulo, x, y + 16);

            ctx.restore();
        }
    };
}

function desenharGrafico(fabricar, montar) {
    const canvas = document.getElementById("meuGrafico");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (meuGraficoObj) {
        meuGraficoObj.destroy();
    }

    meuGraficoObj = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Fabricação", "Montagem"],
            datasets: [{
                data: [fabricar, montar],
                backgroundColor: ["#78a2fd", "#0069fb"],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        plugins: [pluginTextoCentroGrafico()],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            radius: "80%",
            cutout: "55%",
            layout: {
                padding: 0
            },
            plugins: {
                textoCentro: {
                    valor: formatarNumeroBr(fabricar + montar),
                    subtitulo: "Escopo PPU"
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const valor = Number(context.raw || 0);
                            const dataset = context.dataset.data || [];
                            const total = dataset.reduce((acc, val) => acc + Number(val || 0), 0);
                            const percentual = total > 0 ? ((valor / total) * 100) : 0;
                            return `${context.label}: ${formatarNumeroBr(valor)} (${formatarNumeroBr(percentual)}%)`;
                        }
                    }
                }
            }
        }
    });

    renderizarLegendaPpuCustom(fabricar, montar);
}

function renderizarLegendaPpuCustom(fabricar, montar) {
    const container = document.getElementById("legendaPpuCustom");
    if (!container) return;

    const total = Number(fabricar || 0) + Number(montar || 0);

    const itens = [
        { label: "Fabricação", valor: Number(fabricar || 0), cor: "#78a2fd" },
        { label: "Montagem", valor: Number(montar || 0), cor: "#0069fb" }
    ];

    container.innerHTML = itens.map(item => {
        const percentual = total > 0 ? (item.valor / total) * 100 : 0;

        return `
            <div class="legenda-ppu-item">
                <span class="legenda-ppu-cor" style="background:${item.cor};"></span>
                <span class="legenda-ppu-texto">${item.label}</span>
                <span class="legenda-ppu-valor">${formatarNumeroBr(item.valor, 0)}</span>
                <span class="legenda-ppu-pct">${formatarNumeroBr(percentual, 2)}%</span>
            </div>
        `;
    }).join("");
}

preencherDataAtual();
carregarDashboard();