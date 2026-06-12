const mensagem = document.getElementById("mensagem");
const formProduto = document.getElementById("formularioProduto");
const tabelaProdutos = document.getElementById("corpoTabelaProdutos");
const produtoIdInput = document.getElementById("codigoProduto");
const categoriaProdutoInput = document.getElementById("categoriaProduto");
const descricaoProdutoInput = document.getElementById("descricaoProduto");
const observacaoProdutoInput = document.getElementById("observacaoProduto");
const valorVendaProdutoInput = document.getElementById("valorVendaProduto");
const dataCadastroProdutoInput = document.getElementById("dataCadastroProduto");
const statusProdutoInput = document.getElementById("statusProduto");
const btnSalvar = document.getElementById("botaoSalvar");
const btnCancelarEdicao = document.getElementById("botaoCancelarEdicao");
const idVoltar = document.getElementById("voltar");
const botaoNovoProduto = document.getElementById("botaoNovoProduto");
const painelProduto = document.getElementById("painelProduto");
const secaoListagemProdutos = document.getElementById("secaoListagemProdutos");
const pesqCodigo = document.getElementById("pesquisaCodigo");
const pesqCategoria = document.getElementById("pesquisaCategoria");
const pesqStatus = document.getElementById("pesquisaStatus");
const pesqDescricao = document.getElementById("pesquisaDescricao");
const btnPesquisarFiltros = document.getElementById("btnPesquisarFiltros");

let listaProdutosGlobal = [];
let categorias = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function buscarProximoCodigoProduto() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid")
    .order("produtoid", { ascending: false })
    .limit(1);

  if (error) {
    return { codigo: null, error };
  }

  const maiorCodigo = data.length > 0 ? Number(data[0].produtoid) : 0;

  return { codigo: maiorCodigo + 1, error: null };
}

async function inserirProduto(produto) {
  const { error } = await supabaseClient
    .from("produto")
    .insert(produto);

  return error;
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

function buscarDescricaoCategoria(categoriaId) {
  const categoria = categorias.find(function(item) {
    return String(item.categoriaprodutoid) === String(categoriaId);
  });

  return categoria ? categoria.ds_categoria_produto : "";
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("ds_categoria_produto", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  categorias = data;
  categoriaProdutoInput.innerHTML = '<option value="">Selecione uma categoria</option>';
  pesqCategoria;innerHTML = '<option value = ">Todas</option>';

  categorias.forEach(function(categoria) {
    const option = document.createElement("option");
    option.value = categoria.categoriaprodutoid;
    option.textContent = categoria.ds_categoria_produto;
    categoriaProdutoInput.appendChild(option);
  
    const optionPesq = document.createElement("option");
    optionPesq.value = categoria.categoriaprodutoid;
    optionPesq.textContent = categoria.ds_categoria_produto;
    pesqCategoria.appendChild(optionPesq);
  });
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, categoriaprodutoid, ds_produto, obs_produto, vl_venda_produto, dt_cadastro_produto, status_produto")
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Erro ao carregar produtos.</td></tr>`;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  listaProdutosGlobal = data;

  if (data.length === 0) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  renderizarTabelaProdutos(listaProdutosGlobal);
} 

function renderizarTabelaProdutos(produtos) {
  tabelaProdutos.innerHTML = "";

  if (produtos.length === 0) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Nenhum produto encontrado para esta busca.</td></tr>`;
    return;
  }

  produtos.forEach(function(produto) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${produto.produtoid}</td>
      <td>${buscarDescricaoCategoria(produto.categoriaprodutoid)}</td>
      <td>${produto.ds_produto}</td>
      <td>${produto.obs_produto || ""}</td>
      <td>${formatarValor(produto.vl_venda_produto)}</td>
      <td>${formatarData(produto.dt_cadastro_produto)}</td>
      <td>${produto.status_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(produto);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirProduto(produto);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaProdutos.appendChild(linha);
  });
}

function obterDataAtualLocal(){
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function prepararEdicao(produto) {
  abrirFormulario();
  produtoIdInput.value = produto.produtoid;
  categoriaProdutoInput.value = produto.categoriaprodutoid;
  descricaoProdutoInput.value = produto.ds_produto;
  observacaoProdutoInput.value = produto.obs_produto || "";
  valorVendaProdutoInput.value = produto.vl_venda_produto;
  dataCadastroProdutoInput.value = formatarDataInput(produto.dt_cadastro_produto);
  statusProdutoInput.value = produto.status_produto;
  
  btnSalvar.textContent = "Atualizar";
  btnSalvar.classList.add("btn-editar");

  btnCancelarEdicao.textContent = "Cancelar edição"
  btnCancelarEdicao.className = "btn-cancelar";
  btnCancelarEdicao.style.display = "inline-block";
  
  idVoltar.style.display = "none";
  mostrarMensagem("Editando o produto: " + produto.ds_produto, "sucesso");
}

function cancelarEdicao() {
  formProduto.reset();
  produtoIdInput.value = "";

  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");
  btnCancelarEdicao.style.display = "none";
  
  idVoltar.style.display = "block";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  pesqCodigo.value = "";
  pesqCategoria.value = "";
  pesqStatus.value = "";
  pesqDescricao.value = "";
}

function abrirFormulario(){
  painelProduto.style.display = "block";
  botaoNovoProduto.style.display = "none";
  secaoListagemProdutos.style.display = "none";
  idVoltar.style.display = "none";

  dataCadastroProdutoInput.value = obterDataAtualLocal();

  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");

  btnCancelarEdicao.textContent = "Cancelar cadastro";
  btnCancelarEdicao.className = "btn-cancelar";
  btnCancelarEdicao.style.display = "inline-block"
}

function fecharFormulario(){
  cancelarEdicao();
  painelProduto.style.display = "none";
  botaoNovoProduto.style.display = "block";
  secaoListagemProdutos.style.display = "block";
  idVoltar.style.display = "block";
  btnCancelarEdicao.style.display = "none";
}

function montarProduto() {
  return {
    categoriaprodutoid: categoriaProdutoInput.value,
    ds_produto: descricaoProdutoInput.value.trim(),
    obs_produto: observacaoProdutoInput.value.trim(),
    vl_venda_produto: Number(valorVendaProdutoInput.value),
    dt_cadastro_produto: dataCadastroProdutoInput.value || obterDataAtualLocal(),
    status_produto: statusProdutoInput.value
  };
}

function validarProduto(produto) {
  if (!produto.categoriaprodutoid) {
    mostrarMensagem("Selecione a categoria do produto.", "erro");
    return false;
  }

  if (produto.ds_produto === "") {
    mostrarMensagem("Informe a descrição do produto.", "erro");
    return false;
  }

  if (produto.obs_produto === "") {
    mostrarMensagem("Informe a observação do produto.", "erro");
    return false;
  }

  if (!produto.vl_venda_produto || produto.vl_venda_produto <= 0) {
    mostrarMensagem("Informe um valor de venda válido.", "erro");
    return false;
  }

  if (!produto.dt_cadastro_produto) {
    mostrarMensagem("Informe a data de cadastro.", "erro");
    return false;
  }

  if (!produto.status_produto) {
    mostrarMensagem("Selecione o status do produto.", "erro");
    return false;
  }

  return true;
}

async function salvarProduto() {
  const novoProduto = montarProduto();

  if (!validarProduto(novoProduto)) {
    return;
  }

  let error = await inserirProduto(novoProduto);

  if (error && error.message.includes("duplicate key value")) {
    const resultadoCodigo = await buscarProximoCodigoProduto();

    if (resultadoCodigo.error) {
      mostrarMensagem("Erro ao buscar proximo codigo do produto: " + resultadoCodigo.error.message, "erro");
      return;
    }

    error = await inserirProduto({
      produtoid: resultadoCodigo.codigo,
      ...novoProduto
    });
  }

  if (error) {
    mostrarMensagem("Erro ao salvar produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  formProduto.reset();
  fecharFormulario();
  await carregarProdutos();
}

async function atualizarProduto() {
  const produtoId = produtoIdInput.value;
  const produtoAtualizado = montarProduto();

  if (!validarProduto(produtoAtualizado)) {
    return;
  }

  const { error } = await supabaseClient
    .from("produto")
    .update(produtoAtualizado)
    .eq("produtoid", produtoId);

  if (error) {
    mostrarMensagem("Erro ao atualizar produto: " + error.message, "erro");
    return;
  }

  cancelarEdicao();
  mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  fecharFormulario();
  await carregarProdutos();
}

async function excluirProduto(produto) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o produto " + produto.ds_produto + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("produto")
    .delete()
    .eq("produtoid", produto.produtoid);

  if (error) {
    if (error.message.includes("orcamento_item_produtoid_fkey")) {
    mostrarMensagem("Não é possível excluir este produto, pois ele está vinculado a um ou mais orçamentos.", "erro");
  } else {
    mostrarMensagem("Erro ao excluir produto: " + error.message, "erro");
  }
    return;
  }

  if (produtoIdInput.value == produto.produtoid) {
    cancelarEdicao();
  }

  mostrarMensagem("Produto excluído com sucesso!", "sucesso");
  await carregarProdutos();
}

formProduto.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (produtoIdInput.value !== "") {
    await atualizarProduto();
  } else {
    await salvarProduto();
  }
});

botaoNovoProduto.addEventListener("click", function(){
  abrirFormulario();
});

btnCancelarEdicao.addEventListener("click", function(){
  fecharFormulario();
})

btnPesquisarFiltros.addEventListener("click", function() {
  const codigoFiltro = pesqCodigo.value.trim();
  const categoriaFiltro = pesqCategoria.value;
  const statusFiltro = pesqStatus.value;
  const descricaoFiltro = pesqDescricao.value.toLowerCase().trim();

  if (descricaoFiltro !== "" && descricaoFiltro.length < 3) {
    alert("Para pesquisar por descrição, digite pelo menos 3 caracteres.");
    return;
  }

  if (codigoFiltro === "" && categoriaFiltro === "" && statusFiltro === "" && descricaoFiltro === "") {
    renderizarTabelaProdutos(listaProdutosGlobal);
    return;
  }

  const resultadoFiltrado = listaProdutosGlobal.filter(function(produto) {
    const bateCodigo = codigoFiltro === "" || String(produto.produtoid) === codigoFiltro;
    const bateCategoria = categoriaFiltro === "" || String(produto.categoriaprodutoid) === categoriaFiltro;
    const bateStatus = statusFiltro === "" || produto.status_produto === statusFiltro;
    const bateDescricao = descricaoFiltro === "" || produto.ds_produto.toLowerCase().includes(descricaoFiltro);

    return bateCodigo && bateCategoria && bateStatus && bateDescricao;
  });

  renderizarTabelaProdutos(resultadoFiltrado);
});

async function iniciarPagina() {
  await carregarCategorias();
  await carregarProdutos();
}

iniciarPagina();