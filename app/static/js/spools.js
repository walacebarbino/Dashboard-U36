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

function formatarNumeroBR(valor, casas = 0) {
    return normalizarNumero(valor).toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

function formatarPesoTon(valor) {
    return `${formatarNumeroBR(valor, 2)} ton`;
}

function getClasseStatus(status) {
    const s = String(status || "").trim().toUpperCase();

    if (!s) return "status-neutro";
    if (s.includes("AGUARDANDO")) return "status-pendente";
    if (s.includes("RECEBIDO")) return "status-ok";
    if (s.includes("ENTREGUE")) return "status-ok";
    return "status-neutro";
}

function renderTabela(dados) {
    const tbody = document.getElementById("tbodySpools");
    if (!tbody) return;

    if (!Array.isArray(dados) || dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; opacity:0.7;">Nenhum registro encontrado.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = dados.map(item => `
        <tr>
            <td>${item.tag ?? ""}</td>
            <td>${item.material ?? ""}</td>
            <td>${item.descricao ?? ""}</td>
            <td>${item.diametro ?? ""}</td>
            <td>${formatarNumeroBR(item.qtd ?? 0, 3)}</td>
            <td>${formatarNumeroBR(item.peso ?? 0, 2)}</td>
            <td>
                <span class="status-chip">
                    ${item.status ?? ""}
                </span>
            </td>
            <td>${item.data_prevista ?? ""}</td>
        </tr>
    `).join("");
}

function atualizarCards(dados) {
    const totalItens = Array.isArray(dados) ? dados.length : 0;
    const pesoTotal = Array.isArray(dados)
        ? dados.reduce((acc, item) => acc + normalizarNumero(item.peso), 0)
        : 0;

    const programados = Array.isArray(dados)
        ? dados.filter(item => String(item.status || "").trim() !== "").length
        : 0;

    const pesoProgramados = Array.isArray(dados)
        ? dados
            .filter(item => String(item.status || "").trim() !== "")
            .reduce((acc, item) => acc + normalizarNumero(item.peso), 0)
        : 0;

    const bloqueados = Array.isArray(dados)
        ? dados.filter(item => String(item.status || "").toUpperCase().includes("AGUARDANDO")).length
        : 0;

    const pesoBloqueados = Array.isArray(dados)
        ? dados
            .filter(item => String(item.status || "").toUpperCase().includes("AGUARDANDO"))
            .reduce((acc, item) => acc + normalizarNumero(item.peso), 0)
        : 0;

    const elTotal = document.getElementById("kpiSpoolsTotal");
    const elPesoTotal = document.getElementById("kpiPesoTotalSpools");
    const elProgramados = document.getElementById("kpiSpoolsProgramados");
    const elPesoProgramados = document.getElementById("kpiPesoProgramados");
    const elBloqueados = document.getElementById("kpiSpoolsBloqueados");
    const elPesoBloqueados = document.getElementById("kpiPesoBloqueados");
    const elHeader = document.getElementById("spoolsTotalHeader");

    if (elTotal) {
        elTotal.innerHTML = `${formatarNumeroBR(totalItens, 0)} <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">${formatarPesoTon(pesoTotal)}</span>`;
    }
    if (elPesoTotal) elPesoTotal.textContent = "";

    if (elProgramados) {
        elProgramados.innerHTML = `${formatarNumeroBR(programados, 0)} <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">${formatarPesoTon(pesoProgramados)}</span>`;
    }
    if (elPesoProgramados) elPesoProgramados.textContent = "";

    if (elBloqueados) {
        elBloqueados.innerHTML = `${formatarNumeroBR(bloqueados, 0)} <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">${formatarPesoTon(pesoBloqueados)}</span>`;
    }
    if (elPesoBloqueados) elPesoBloqueados.textContent = "";

    if (elHeader) elHeader.textContent = formatarNumeroBR(totalItens, 0);
}

function ativarFiltroSpools() {
    const filtroTag = document.getElementById("filtroTag");
    const filtroMaterial = document.getElementById("filtroMaterial");
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroData = document.getElementById("filtroData");

    if (!filtroTag || !filtroMaterial || !filtroStatus || !filtroData) return;

    function atualizarPesoFiltrado() {
        const elPesoFiltrado = document.getElementById("pesoFiltradoTotal");
        if (!elPesoFiltrado) return;

        let soma = 0;

        document.querySelectorAll("#tbodySpools tr").forEach(tr => {
            if (tr.style.display === "none") return;

            const tdPeso = tr.children[5]?.innerText || "0";
            soma += normalizarNumero(tdPeso);
        });

        elPesoFiltrado.textContent = formatarNumeroBR(soma, 2);
    }

    function aplicarFiltros() {
        const valorTag = filtroTag.value.toLowerCase().trim();
        const valorMaterial = filtroMaterial.value.toLowerCase().trim();
        const valorStatus = filtroStatus.value.toLowerCase().trim();
        const valorData = filtroData.value.toLowerCase().trim();

        document.querySelectorAll("#tbodySpools tr").forEach(tr => {
            const tdTag = tr.children[0]?.innerText.toLowerCase() || "";
            const tdMaterial = tr.children[1]?.innerText.toLowerCase() || "";
            const tdStatus = tr.children[6]?.innerText.toLowerCase() || "";
            const tdData = tr.children[7]?.innerText.toLowerCase() || "";

            const matchTag = !valorTag || tdTag.includes(valorTag);
            const matchMaterial = !valorMaterial || tdMaterial.includes(valorMaterial);
            const matchStatus = !valorStatus || tdStatus.includes(valorStatus);
            const matchData = !valorData || tdData.includes(valorData);

            tr.style.display = (matchTag && matchMaterial && matchStatus && matchData) ? "" : "none";
        });

        atualizarPesoFiltrado();
    }

    filtroTag.addEventListener("input", aplicarFiltros);
    filtroMaterial.addEventListener("input", aplicarFiltros);
    filtroStatus.addEventListener("input", aplicarFiltros);
    filtroData.addEventListener("input", aplicarFiltros);

    atualizarPesoFiltrado();
}

async function carregarTabelaSpools() {
    const tbody = document.getElementById("tbodySpools");
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; opacity:0.7;">Carregando...</td>
            </tr>
        `;
    }

    try {
        const resposta = await fetch("/api/spools-fabricaveis");
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao carregar dados.");
        }

        if (dados.erro) {
            throw new Error(dados.erro);
        }

        renderTabela(dados);
        atualizarCards(dados);
        ativarFiltroSpools();
    } catch (erro) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; color:#ff6b6b;">
                        ${erro.message || "Erro ao carregar dados."}
                    </td>
                </tr>
            `;
        }
    }
}

preencherDataAtual();
carregarTabelaSpools();