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

function carregarSpoolsTotal() {
    fetch("/api/spools-total")
        .then(async res => {
            if (!res.ok) {
                const textoErro = await res.text();
                throw new Error(`Erro ${res.status}: ${textoErro}`);
            }
            return res.json();
        })
        .then(data => {
            const elSpools = document.getElementById("spoolsTotalHeader");
            if (elSpools) {
                elSpools.textContent = normalizarNumero(data.spools_total).toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            }
        })
        .catch(() => {
            const elSpools = document.getElementById("spoolsTotalHeader");
            if (elSpools) elSpools.textContent = "0";
        });
}

preencherDataAtual();
carregarSpoolsTotal();