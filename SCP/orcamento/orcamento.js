const SUPABASE_URL = "https://bbphzdnivlifviemxgff.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5DZjx6V6Cp68QRaFp-xE3g_u_lGR-CC";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mensagem = document.getElementById("mensagem");
const formOrcamento = document.getElementById("formularioOrcamento");
const tabelaItensOrcamento = document.getElementById("corpoTabelaItensOrcamento");
const tabelaOrcamentos = document.getElementById("corpoTabelaOrcamentos");
const codigoOrcamentoInput = document.getElementById("codigoOrcamento");
const clienteOrcamentoInput = document.getElementById("clienteOrcamento");
const dataOrcamentoInput = document.getElementById("dataOrcamento");
const dataValidadeOrcamentoInput = document.getElementById("dataValidadeOrcamento");
const valorTotalOrcamentoInput = document.getElementById("valorTotalOrcamento");
const produtoItemOrcamentoInput = document.getElementById("produtoItemOrcamento");
const descricaoProdutoItemOrcamentoInput = document.getElementById("descricaoProdutoItemOrcamento");
const quantidadeItemOrcamentoInput = document.getElementById("quantidadeItemOrcamento");
const valorUnitarioItemOrcamentoInput = document.getElementById("valorUnitarioItemOrcamento");
const valorTotalItemOrcamentoInput = document.getElementById("valorTotalItemOrcamento");
const btnAdicionarItem = document.getElementById("botaoAdicionarItem");
const btnSalvar = document.getElementById("botaoSalvar");
const btnCancelarEdicao = document.getElementById("botaoCancelarEdicao");

let clientes = [];
let produtos = [];
let itensOrcamento = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function formatarValor(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  if (!data) {
    return "";
  }

  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarDataInput(data) {
  if (!data) {
    return "";
  }

  return data.substring(0, 10);
}

function buscarCliente(clienteId) {
  return clientes.find(function(cliente) {
    return String(cliente.clienteid) === String(clienteId);
  });
}

function buscarProduto(produtoId) {
  return produtos.find(function(produto) {
    return String(produto.produtoid) === String(produtoId);
  });
}

function calcularValorTotalItem() {
  const quantidade = Number(quantidadeItemOrcamentoInput.value || 0);
  const valorUnitario = Number(valorUnitarioItemOrcamentoInput.value || 0);
  const valorTotal = quantidade * valorUnitario;
  valorTotalItemOrcamentoInput.value = valorTotal.toFixed(2);
  return valorTotal;
}

function calcularValorTotalOrcamento() {
  const valorTotal = itensOrcamento.reduce(function(total, item) {
    return total + Number(item.vl_total || 0);
  }, 0);

  valorTotalOrcamentoInput.value = valorTotal.toFixed(2);
  return valorTotal;
}

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, nome_cliente")
    .order("nome_cliente", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  clientes = data;
  clienteOrcamentoInput.innerHTML = '<option value="">Selecione um cliente</option>';

  clientes.forEach(function(cliente) {
    const option = document.createElement("option");
    option.value = cliente.clienteid;
    option.textContent = cliente.nome_cliente;
    clienteOrcamentoInput.appendChild(option);
  });
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, vl_venda_produto, status_produto")
    .order("ds_produto", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  produtos = data.filter(function(produto) {
    return produto.status_produto === "ATIVO";
  });

  produtoItemOrcamentoInput.innerHTML = '<option value="">Selecione um produto</option>';

  produtos.forEach(function(produto) {
    const option = document.createElement("option");
    option.value = produto.produtoid;
    option.textContent = produto.ds_produto;
    produtoItemOrcamentoInput.appendChild(option);
  });
}

async function carregarOrcamentos() {
  const { data, error } = await supabaseClient
    .from("orcamento")
    .select("orcamentoid, clienteid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento")
    .order("orcamentoid", { ascending: true });

  if (error) {
    tabelaOrcamentos.innerHTML = `
      <tr>
        <td colspan="6">Erro ao carregar orçamentos.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar orçamentos: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaOrcamentos.innerHTML = `
      <tr>
        <td colspan="6">Nenhum orçamento cadastrado.</td>
      </tr>
    `;
    return;
  }

  tabelaOrcamentos.innerHTML = "";

  data.forEach(function(orcamento) {
    const cliente = buscarCliente(orcamento.clienteid);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${orcamento.orcamentoid}</td>
      <td>${cliente ? cliente.nome_cliente : ""}</td>
      <td>${formatarData(orcamento.dt_orcamento)}</td>
      <td>${formatarData(orcamento.dt_validade_orcamento)}</td>
      <td>${formatarValor(orcamento.vl_total_orcamento)}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(orcamento);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirOrcamento(orcamento);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaOrcamentos.appendChild(linha);
  });
}

function limparCamposItem() {
  produtoItemOrcamentoInput.value = "";
  descricaoProdutoItemOrcamentoInput.value = "";
  quantidadeItemOrcamentoInput.value = "";
  valorUnitarioItemOrcamentoInput.value = "";
  valorTotalItemOrcamentoInput.value = "";
}

function renderizarItensOrcamento() {
  if (itensOrcamento.length === 0) {
    tabelaItensOrcamento.innerHTML = `
      <tr>
        <td colspan="6">Nenhum item adicionado.</td>
      </tr>
    `;
    calcularValorTotalOrcamento();
    return;
  }

  tabelaItensOrcamento.innerHTML = "";

  itensOrcamento.forEach(function(item, indice) {
    const produto = buscarProduto(item.produtoid);
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${produto ? produto.ds_produto : item.produtodesc}</td>
      <td>${item.produtodesc}</td>
      <td>${item.qt_produto}</td>
      <td>${formatarValor(item.vl_unitario)}</td>
      <td>${formatarValor(item.vl_total)}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "Remover";
    botaoRemover.className = "btn-excluir";
    botaoRemover.type = "button";
    botaoRemover.addEventListener("click", function() {
      itensOrcamento.splice(indice, 1);
      renderizarItensOrcamento();
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoRemover);
    tabelaItensOrcamento.appendChild(linha);
  });

  calcularValorTotalOrcamento();
}

function adicionarItem() {
  const produtoId = produtoItemOrcamentoInput.value;
  const descricaoProduto = descricaoProdutoItemOrcamentoInput.value.trim();
  const quantidade = Number(quantidadeItemOrcamentoInput.value);
  const valorUnitario = Number(valorUnitarioItemOrcamentoInput.value);
  const valorTotalItem = calcularValorTotalItem();

  if (!produtoId) {
    mostrarMensagem("Selecione um produto.", "erro");
    return;
  }

  if (quantidade <= 0) {
    mostrarMensagem("Informe uma quantidade válida.", "erro");
    return;
  }

  if (valorUnitario <= 0) {
    mostrarMensagem("Informe um valor unitário válido.", "erro");
    return;
  }

  itensOrcamento.push({
    produtoid: produtoId,
    produtodesc: descricaoProduto,
    qt_produto: quantidade,
    vl_unitario: valorUnitario,
    vl_total: valorTotalItem
  });

  limparCamposItem();
  renderizarItensOrcamento();
  mostrarMensagem("Item adicionado ao orçamento.", "sucesso");
}

function validarOrcamento() {
  if (!clienteOrcamentoInput.value) {
    mostrarMensagem("Selecione um cliente.", "erro");
    return false;
  }

  if (!dataOrcamentoInput.value) {
    mostrarMensagem("Informe a data do orçamento.", "erro");
    return false;
  }

  if (!dataValidadeOrcamentoInput.value) {
    mostrarMensagem("Informe a data de validade.", "erro");
    return false;
  }

  if (itensOrcamento.length === 0) {
    mostrarMensagem("Adicione pelo menos um item ao orçamento.", "erro");
    return false;
  }

  return true;
}

function montarOrcamento() {
  return {
    clienteid: clienteOrcamentoInput.value,
    dt_orcamento: dataOrcamentoInput.value,
    dt_validade_orcamento: dataValidadeOrcamentoInput.value,
    vl_total_orcamento: Number(valorTotalOrcamentoInput.value || 0)
  };
}

function montarItensParaSalvar(orcamentoId) {
  return itensOrcamento.map(function(item, indice) {
    return {
      orcamentoid: orcamentoId,
      orcamentoitemid: indice + 1,
      produtoid: item.produtoid,
      produtodesc: item.produtodesc,
      qt_produto: item.qt_produto,
      vl_unitario: item.vl_unitario,
      vl_total: item.vl_total
    };
  });
}

async function salvarOrcamento() {
  if (!validarOrcamento()) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("orcamento")
    .insert(montarOrcamento())
    .select("orcamentoid")
    .single();

  if (error) {
    mostrarMensagem("Erro ao salvar orçamento: " + error.message, "erro");
    return;
  }

  const { error: erroItens } = await supabaseClient
    .from("orcamento_item")
    .insert(montarItensParaSalvar(data.orcamentoid));

  if (erroItens) {
    mostrarMensagem("Erro ao salvar itens do orçamento: " + erroItens.message, "erro");
    return;
  }

  mostrarMensagem("Orçamento salvo com sucesso!", "sucesso");
  limparFormulario();
  carregarOrcamentos();
}

async function prepararEdicao(orcamento) {
  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select("orcamentoitemid, produtoid, produtodesc, qt_produto, vl_unitario, vl_total")
    .eq("orcamentoid", orcamento.orcamentoid)
    .order("orcamentoitemid", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao buscar itens do orçamento: " + error.message, "erro");
    return;
  }

  codigoOrcamentoInput.value = orcamento.orcamentoid;
  clienteOrcamentoInput.value = orcamento.clienteid;
  dataOrcamentoInput.value = formatarDataInput(orcamento.dt_orcamento);
  dataValidadeOrcamentoInput.value = formatarDataInput(orcamento.dt_validade_orcamento);
  valorTotalOrcamentoInput.value = Number(orcamento.vl_total_orcamento || 0).toFixed(2);
  itensOrcamento = data;
  renderizarItensOrcamento();
  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Editando o orçamento: " + orcamento.orcamentoid, "sucesso");
}

async function atualizarOrcamento() {
  if (!validarOrcamento()) {
    return;
  }

  const orcamentoId = codigoOrcamentoInput.value;

  const { error } = await supabaseClient
    .from("orcamento")
    .update(montarOrcamento())
    .eq("orcamentoid", orcamentoId);

  if (error) {
    mostrarMensagem("Erro ao atualizar orçamento: " + error.message, "erro");
    return;
  }

  const { error: erroExcluirItens } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", orcamentoId);

  if (erroExcluirItens) {
    mostrarMensagem("Erro ao atualizar itens do orçamento: " + erroExcluirItens.message, "erro");
    return;
  }

  const { error: erroInserirItens } = await supabaseClient
    .from("orcamento_item")
    .insert(montarItensParaSalvar(orcamentoId));

  if (erroInserirItens) {
    mostrarMensagem("Erro ao salvar itens atualizados: " + erroInserirItens.message, "erro");
    return;
  }

  mostrarMensagem("Orçamento atualizado com sucesso!", "sucesso");
  limparFormulario();
  carregarOrcamentos();
}

async function excluirOrcamento(orcamento) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o orçamento " + orcamento.orcamentoid + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error: erroItens } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", orcamento.orcamentoid);

  if (erroItens) {
    mostrarMensagem("Erro ao excluir itens do orçamento: " + erroItens.message, "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("orcamento")
    .delete()
    .eq("orcamentoid", orcamento.orcamentoid);

  if (error) {
    mostrarMensagem("Erro ao excluir orçamento: " + error.message, "erro");
    return;
  }

  if (codigoOrcamentoInput.value == orcamento.orcamentoid) {
    limparFormulario();
  }

  mostrarMensagem("Orçamento excluído com sucesso!", "sucesso");
  carregarOrcamentos();
}

function limparFormulario() {
  formOrcamento.reset();
  codigoOrcamentoInput.value = "";
  valorTotalOrcamentoInput.value = "";
  itensOrcamento = [];
  limparCamposItem();
  renderizarItensOrcamento();
  btnSalvar.textContent = "Cadastrar";
  btnCancelarEdicao.style.display = "none";
}

produtoItemOrcamentoInput.addEventListener("change", function() {
  const produto = buscarProduto(produtoItemOrcamentoInput.value);

  if (!produto) {
    descricaoProdutoItemOrcamentoInput.value = "";
    valorUnitarioItemOrcamentoInput.value = "";
    valorTotalItemOrcamentoInput.value = "";
    return;
  }

  descricaoProdutoItemOrcamentoInput.value = produto.ds_produto;
  valorUnitarioItemOrcamentoInput.value = Number(produto.vl_venda_produto || 0).toFixed(2);
  calcularValorTotalItem();
});

quantidadeItemOrcamentoInput.addEventListener("input", function() {
  calcularValorTotalItem();
});

valorUnitarioItemOrcamentoInput.addEventListener("input", function() {
  calcularValorTotalItem();
});

btnAdicionarItem.addEventListener("click", function() {
  adicionarItem();
});

formOrcamento.addEventListener("submit", async function(evento) {
  evento.preventDefault();
  calcularValorTotalOrcamento();

  if (codigoOrcamentoInput.value !== "") {
    await atualizarOrcamento();
  } else {
    await salvarOrcamento();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  limparFormulario();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
});

async function iniciarPagina() {
  await carregarClientes();
  await carregarProdutos();
  renderizarItensOrcamento();
  await carregarOrcamentos();
}

iniciarPagina();
