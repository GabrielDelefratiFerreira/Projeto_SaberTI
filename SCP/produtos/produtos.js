const SUPABASE_URL = "https://bbphzdnivlifviemxgff.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5DZjx6V6Cp68QRaFp-xE3g_u_lGR-CC";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

let categorias = [];

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

  categorias.forEach(function(categoria) {
    const option = document.createElement("option");
    option.value = categoria.categoriaprodutoid;
    option.textContent = categoria.ds_categoria_produto;
    categoriaProdutoInput.appendChild(option);
  });
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, categoriaprodutoid, ds_produto, obs_produto, vl_venda_produto, dt_cadastro_produto, status_produto")
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Erro ao carregar produtos.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Nenhum produto cadastrado.</td>
      </tr>
    `;
    return;
  }

  tabelaProdutos.innerHTML = "";

  data.forEach(function(produto) {
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

function prepararEdicao(produto) {
  produtoIdInput.value = produto.produtoid;
  categoriaProdutoInput.value = produto.categoriaprodutoid;
  descricaoProdutoInput.value = produto.ds_produto;
  observacaoProdutoInput.value = produto.obs_produto || "";
  valorVendaProdutoInput.value = produto.vl_venda_produto;
  dataCadastroProdutoInput.value = formatarDataInput(produto.dt_cadastro_produto);
  statusProdutoInput.value = produto.status_produto;
  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Editando o produto: " + produto.ds_produto, "sucesso");
}

function cancelarEdicao() {
  formProduto.reset();
  produtoIdInput.value = "";
  btnSalvar.textContent = "Cadastrar";
  btnCancelarEdicao.style.display = "none";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

function montarProduto() {
  return {
    categoriaprodutoid: categoriaProdutoInput.value,
    ds_produto: descricaoProdutoInput.value.trim(),
    obs_produto: observacaoProdutoInput.value.trim(),
    vl_venda_produto: Number(valorVendaProdutoInput.value),
    dt_cadastro_produto: dataCadastroProdutoInput.value,
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

  if (!produto.vl_venda_produto || produto.vl_venda_produto <= 0) {
    mostrarMensagem("Informe um valor de venda válido.", "erro");
    return false;
  }

  if (!produto.dt_cadastro_produto) {
    mostrarMensagem("Informe a data de cadastro.", "erro");
    return false;
  }

  return true;
}

async function salvarProduto() {
  const novoProduto = montarProduto();

  if (!validarProduto(novoProduto)) {
    return;
  }

  const { error } = await supabaseClient
    .from("produto")
    .insert(novoProduto);

  if (error) {
    mostrarMensagem("Erro ao salvar produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  formProduto.reset();
  carregarProdutos();
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

  mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  cancelarEdicao();
  carregarProdutos();
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
    mostrarMensagem("Erro ao excluir produto: " + error.message, "erro");
    return;
  }

  if (produtoIdInput.value == produto.produtoid) {
    cancelarEdicao();
  }

  mostrarMensagem("Produto excluído com sucesso!", "sucesso");
  carregarProdutos();
}

formProduto.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (produtoIdInput.value !== "") {
    await atualizarProduto();
  } else {
    await salvarProduto();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

async function iniciarPagina() {
  await carregarCategorias();
  await carregarProdutos();
}

iniciarPagina();
