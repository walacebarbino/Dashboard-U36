let meuGraficoObj = null;

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

function carregarDashboard() {
    fetch("/api/ppu")
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                alert(data.erro);
                return;
            }

            processarDashboard(data);
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao carregar os dados da API /api/ppu.");
        });
}

function processarDashboard(data) {
    // Acumuladores básicos
    let totalFabricar = 0;
    let totalLiberado = 0;
    let totalProgramar = 0;
    let itensValidos = 0;

    data.forEach(item => {
        const itemCodigo = item["ITEM"] ?? "";
        const ppu = item["PPU"] ?? "";
        const mat = item["MAT"] ?? "";
        const regra = item["REGRA"] ?? "";
        const descricao = item["DESCRIÇÃO"] ?? "";

        const totalFabricarItem = normalizarNumero(item["TOTAL À FABRICAR (VALID.)"]);
        const liberadoItem = normalizarNumero(item["LIBERADO PELA ENGENHARIA"]);
        const programarItem = normalizarNumero(item["À Programar (Fabricação)"]);

        const temBase = itemCodigo || ppu || mat || regra || descricao;

        if (temBase) {
            itensValidos += 1;
            totalFabricar += totalFabricarItem;
            totalLiberado += liberadoItem;
            totalProgramar += programarItem;
        }
    });

    // Mapeando para os novos IDs dos cards KPI
    const elPesoTotalValidado = document.getElementById("kpiPesoTotalValidado");
    const elIcEmitido = document.getElementById("kpiIcEmitido");
    const elReservadoProgramado = document.getElementById("kpiReservadoProgramado");
    const elEmEstoque = document.getElementById("kpiEmEstoque");
    const elPendRecebimento = document.getElementById("kpiPendRecebimento");
    const elTakeOff = document.getElementById("kpiTakeOff");

    // Aqui eu estou só preenchendo com base nos 3 números que já tínhamos;
    // depois, se você quiser, a gente detalha melhor a lógica de cada card

    if (elPesoTotalValidado) {
        elPesoTotalValidado.textContent = formatarToneladas(totalFabricar);
    }
    if (elIcEmitido) {
        elIcEmitido.textContent = formatarToneladas(totalLiberado);
    }
    if (elReservadoProgramado) {
        elReservadoProgramado.textContent = formatarToneladas(totalProgramar);
    }

    // Por enquanto vamos zerar estes 3 até você definir a regra:
    if (elEmEstoque) {
        elEmEstoque.textContent = "0,00 ton";
    }
    if (elPendRecebimento) {
        elPendRecebimento.textContent = "0,00 ton";
    }
    if (elTakeOff) {
        elTakeOff.textContent = "0,00 ton";
    }

    // Percentual geral para o gráfico (mesma lógica de antes)
    const percGeral = totalFabricar > 0 ? (totalLiberado / totalFabricar) * 100 : 0;

    desenharGrafico(totalLiberado, totalProgramar);
    ativarFiltro();
}

function desenharGrafico(liberado, programar) {
    const canvas = document.getElementById("meuGrafico");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (meuGraficoObj) {
        meuGraficoObj.destroy();
    }

    meuGraficoObj = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Liberado pela Engenharia", "À Programar (Fabricação)"],
            datasets: [{
                data: [liberado, programar],
                backgroundColor: ["#2ea043", "#d29922"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#c9d1d9",
                        padding: 16
                    }
                }
            }
        }
    });
}

function ativarFiltro() {
    // No layout novo não existe mais #filtro nem #corpoTabela;
    // então, por enquanto, vamos só garantir que isso não quebre o script.

    const filtro = document.getElementById("filtro");
    if (!filtro) return;

    filtro.addEventListener("input", function (e) {
        const busca = e.target.value.toLowerCase();
        document.querySelectorAll("#corpoTabela tr").forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(busca) ? "" : "none";
        });
    });
}

preencherDataAtual();
carregarDashboard();