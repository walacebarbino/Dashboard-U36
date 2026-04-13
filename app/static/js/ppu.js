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

function formatarNumero(valor) {
    const numero = normalizarNumero(valor);
    return numero.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    });
}

function texto(v) {
    return String(v ?? "").trim();
}

function ehLinhaVazia(item) {
    const campos = [
        texto(item["ITEM"]),
        texto(item["DESCRIÇÃO"]),
        texto(item["QTD CONTRATO"]),
        texto(item["BASE REM. CONTRATO"]),
        texto(item["REMANESCENTE (VALID.)"]),
        texto(item["TOTAL À FABRICAR (VALID.)"]),
        texto(item["LIBERADO PELA ENGENHARIA"]),
        texto(item["À Programar (Fabricação)"])
    ];

    return campos.every(c => c === "" || c === "0" || c === "0,0" || c === "0.0");
}

function ehTotal(item) {
    const itemTxt = texto(item["ITEM"]).toUpperCase();
    const descTxt = texto(item["DESCRIÇÃO"]).toUpperCase();
    return itemTxt.includes("TOTAL") || descTxt.includes("TOTAL");
}

function ehSemanaAnterior(item) {
    const itemTxt = texto(item["ITEM"]).toUpperCase();
    const descTxt = texto(item["DESCRIÇÃO"]).toUpperCase();
    return itemTxt.includes("SEMANA ANTERIOR") || descTxt.includes("SEMANA ANTERIOR");
}

function classificarBloco(item) {
    const codigo = texto(item["ITEM"]);
    const desc = texto(item["DESCRIÇÃO"]).toUpperCase();

    if (
        codigo.startsWith("4.3.5.1") ||
        codigo.startsWith("4.3.5.2") ||
        codigo.startsWith("4.3.5.3") ||
        desc.includes("TOTAL FABR") ||
        desc.includes("SEMANA ANTERIOR")
    ) {
        return "FABRICAÇÃO";
    }

    if (
        codigo.startsWith("4.3.5.4") ||
        codigo.startsWith("4.3.5.5") ||
        codigo.startsWith("4.3.5.6") ||
        desc.includes("TOTAL MONT")
    ) {
        return "MONTAGEM";
    }

    return "OUTROS";
}

function montarLinha(item) {
    let classe = "";

    if (ehTotal(item)) classe = "ppu-row-total";
    if (ehSemanaAnterior(item)) classe = "ppu-row-semana";

    const um                  = texto(item["U. M."] || item["UNIDADE DE MEDIDA"]);
    const qtdContrato         = normalizarNumero(item["QTD CONTRATO"]);
    const baseRemContrato     = normalizarNumero(item["BASE REM. CONTRATO"]);
    const remanescente        = normalizarNumero(item["REMANESCENTE (VALID.)"]);
    const reparo              = normalizarNumero(item["REPARO"]);
    let   totalFabricar       = normalizarNumero(item["TOTAL À FABRICAR (VALID.)"]);
    const liberadoEngenharia  = normalizarNumero(item["LIBERADO PELA ENGENHARIA"]);
    const aProgramar          = normalizarNumero(item["À Programar (Fabricação)"]);
    const spoolBloq           = normalizarNumero(item["Spool Bloq."]);
    const pendReceb           = normalizarNumero(item["Pend. Receb."]);
    const takeOff             = normalizarNumero(item["Take Off"]);

    if (!totalFabricar || totalFabricar === 0) {
        totalFabricar = remanescente + reparo;
    }

    return `
        <tr class="${classe}">
            <td class="col-item">${texto(item["ITEM"])}</td>
            <td class="col-desc">${texto(item["DESCRIÇÃO"])}</td>
            <td class="col-um">${um}</td>
            <td class="col-num">${formatarNumero(qtdContrato)}</td>
            <td class="col-num">${formatarNumero(baseRemContrato)}</td>
            <td class="col-num">${formatarNumero(remanescente)}</td>
            <td class="col-num">${formatarNumero(reparo)}</td>
            <td class="col-num">${formatarNumero(totalFabricar)}</td>
            <td class="col-num">${formatarNumero(liberadoEngenharia)}</td>
            <td class="col-num">${formatarNumero(aProgramar)}</td>
            <td class="col-num">${formatarNumero(spoolBloq)}</td>
            <td class="col-num">${formatarNumero(pendReceb)}</td>
            <td class="col-num">${formatarNumero(takeOff)}</td>
        </tr>
    `;
}

function montarTabela(titulo, dados) {
    return `
        <div class="ppu-block">
            <div class="ppu-section-title">${titulo}</div>
            <div class="ppu-table-wrap">
                <table class="ppu-table">
                    <thead>
                        <tr>
                            <th>ITEM</th>
                            <th>DESCRIÇÃO</th>
                            <th>U. M.</th>
                            <th>QTD CONTRATO</th>
                            <th>BASE REM. CONTRATO</th>
                            <th>REMANESCENTE (VALID.)</th>
                            <th>REPARO</th>
                            <th>TOTAL À FABRICAR (VALID.)</th>
                            <th>LIBERADO PELA ENGENHARIA</th>
                            <th>À Programar (Fabricação)</th>
                            <th>Spool Bloq.</th>
                            <th>Pend. Receb.</th>
                            <th>Take Off</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(montarLinha).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function carregarPPU() {
    fetch("/api/ppu")
        .then(res => res.json())
        .then(data => {
            if (data.erro) {
                alert(data.erro);
                return;
            }

            const dadosFiltrados = data.filter(item => {
                const itemTxt = texto(item["ITEM"]);
                const descTxt = texto(item["DESCRIÇÃO"]);

                if (!itemTxt && !descTxt) return false;
                if (ehLinhaVazia(item)) return false;

                return true;
            });

            const fabricacao = [];
            const montagem = [];

            let blocoAtual = "";

            dadosFiltrados.forEach(item => {
                const codigo = texto(item["ITEM"]);

                if (
                    codigo.startsWith("4.3.5.1") ||
                    codigo.startsWith("4.3.5.2") ||
                    codigo.startsWith("4.3.5.3")
                ) {
                    blocoAtual = "FABRICAÇÃO";
                    fabricacao.push(item);
                    return;
                }

                if (
                    codigo.startsWith("4.3.5.4") ||
                    codigo.startsWith("4.3.5.5") ||
                    codigo.startsWith("4.3.5.6")
                ) {
                    blocoAtual = "MONTAGEM";
                    montagem.push(item);
                    return;
                }

                if (ehTotal(item) || ehSemanaAnterior(item)) {
                    if (blocoAtual === "FABRICAÇÃO") {
                        fabricacao.push(item);
                    } else if (blocoAtual === "MONTAGEM") {
                        montagem.push(item);
                    }
                }
            });

            const html = `
                ${montarTabela("FABRICAÇÃO", fabricacao)}
                ${montarTabela("MONTAGEM", montagem)}
            `;

            document.getElementById("blocosPPU").innerHTML = html;
            ativarFiltroPPU();
        })
        .catch(err => {
            console.error(err);
            alert("Erro ao carregar os dados da aba PPU.");
        });
}

function ativarFiltroPPU() {
    const filtro = document.getElementById("filtroPPU");
    if (!filtro) return;

    filtro.addEventListener("input", function (e) {
        const busca = e.target.value.toLowerCase();

        document.querySelectorAll(".ppu-table tbody tr").forEach(tr => {
            const textoLinha = tr.innerText.toLowerCase();
            tr.style.display = textoLinha.includes(busca) ? "" : "none";
        });
    });
}

preencherDataAtual();
carregarPPU();