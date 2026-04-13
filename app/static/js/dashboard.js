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
    return `${(valorKg / 1000).toFixed(2)} t`;
}

function formatarKg(valor) {
    return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
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
    const corpoTabela = document.getElementById("corpoTabela");

    let totalFabricar = 0;
    let totalLiberado = 0;
    let totalProgramar = 0;
    let itensValidos = 0;

    let html = "";

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

            let percentual = totalFabricarItem > 0
                ? (liberadoItem / totalFabricarItem) * 100
                : 0;

            if (percentual > 100) percentual = 100;
            if (percentual < 0) percentual = 0;

            html += `
                <tr>
                    <td class="text-highlight">${itemCodigo}</td>
                    <td><span class="badge-mat">${mat}</span></td>
                    <td>
                        <strong>${ppu}</strong><br>
                        <span>${descricao}</span><br>
                        <small style="color:#8b949e;">${regra}</small>
                    </td>
                    <td>${formatarKg(totalFabricarItem)}</td>
                    <td>${formatarKg(liberadoItem)}</td>
                    <td class="progress-cell">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${percentual.toFixed(1)}%;"></div>
                        </div>
                        <small>${percentual.toFixed(1)}%</small>
                    </td>
                </tr>
            `;
        }
    });

    corpoTabela.innerHTML = html;

    document.getElementById("kpiTotal").innerText = formatarToneladas(totalFabricar);
    document.getElementById("kpiInspecionado").innerText = formatarToneladas(totalLiberado);
    document.getElementById("kpiPendente").innerText = formatarToneladas(totalProgramar);
    document.getElementById("kpiItens").innerText = itensValidos;

    const percGeral = totalFabricar > 0 ? (totalLiberado / totalFabricar) * 100 : 0;
    document.getElementById("percConcluido").innerText = `${percGeral.toFixed(1)}%`;

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