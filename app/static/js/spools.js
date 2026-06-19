let dadosOriginais = [];
let dadosFiltrados = [];

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
            <td><span class="status-chip">${item.status ?? ""}</span></td>
            <td>${item.data_prevista ?? ""}</td>
        </tr>
    `).join("");
}

function atualizarCards(dados) {
    const lista = Array.isArray(dados) ? dados : [];

    const tagsUnicas = new Set();
    let pesoTotal = 0;

    lista.forEach(item => {
        const tag = String(item.tag ?? "").trim();
        if (tag) tagsUnicas.add(tag);
        pesoTotal += normalizarNumero(item.peso ?? 0);
    });

    const totalSpools = tagsUnicas.size;

    const elTotal = document.getElementById("kpiSpoolsTotal");
    const elProgramados = document.getElementById("kpiSpoolsProgramados");
    const elBloqueados = document.getElementById("kpiSpoolsBloqueados");
    const elHeader = document.getElementById("spoolsTotalHeader");
    const elPesoFiltrado = document.getElementById("pesoFiltradoTotal");

    if (elTotal) {
        elTotal.innerHTML = `${formatarNumeroBR(totalSpools, 0)} <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">${formatarPesoTon(pesoTotal)}</span>`;
    }

    if (elProgramados) {
        elProgramados.innerHTML = `0 <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">0,00 ton</span>`;
    }

    if (elBloqueados) {
        elBloqueados.innerHTML = `0 <span class="kpi-inline-sep">|</span> <span class="kpi-inline-extra">0,00 ton</span>`;
    }

    if (elHeader) elHeader.textContent = formatarNumeroBR(totalSpools, 0);
    if (elPesoFiltrado) elPesoFiltrado.textContent = formatarNumeroBR(pesoTotal, 2);
}

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function obterFiltros() {
    return {
        tag: (document.getElementById("filtroTag")?.value || "").toLowerCase().trim(),
        material: (document.getElementById("filtroMaterial")?.value || "").toLowerCase().trim(),
        status: (document.getElementById("filtroStatus")?.value || "").toLowerCase().trim(),
        data: (document.getElementById("filtroData")?.value || "").toLowerCase().trim()
    };
}

function aplicarFiltros() {
    const filtros = obterFiltros();

    dadosFiltrados = dadosOriginais.filter(item => {
        const tag = String(item.tag ?? "").toLowerCase();
        const material = String(item.material ?? "").toLowerCase();
        const status = String(item.status ?? "").toLowerCase();
        const data = String(item.data_prevista ?? "").toLowerCase();

        const matchTag = !filtros.tag || tag.includes(filtros.tag);
        const matchMaterial = !filtros.material || material.includes(filtros.material);
        const matchStatus = !filtros.status || status.includes(filtros.status);
        const matchData = !filtros.data || data.includes(filtros.data);

        return matchTag && matchMaterial && matchStatus && matchData;
    });

    renderTabela(dadosFiltrados);
    atualizarCards(dadosFiltrados);
}

function ativarFiltroSpools() {
    const filtroTag = document.getElementById("filtroTag");
    const filtroMaterial = document.getElementById("filtroMaterial");
    const filtroStatus = document.getElementById("filtroStatus");
    const filtroData = document.getElementById("filtroData");

    const aplicarComDebounce = debounce(aplicarFiltros, 300);

    [filtroTag, filtroMaterial, filtroStatus, filtroData].forEach(campo => {
        if (campo) {
            campo.addEventListener("input", aplicarComDebounce);
        }
    });
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

        dadosOriginais = Array.isArray(dados) ? dados : [];
        dadosFiltrados = [...dadosOriginais];

        renderTabela(dadosFiltrados);
        atualizarCards(dadosFiltrados);
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