const mensagem = document.getElementById("mensagem");
const formularioCategoria = document.getElementById("formularioCategoria");
const tabelaCategorias = document.getElementById("corpoTabelaCategorias");
const categoriaIdInput = document.getElementById("codigoCategoria");
const descricaoCategoriaInput = document.getElementById("descricaoCategoria");
const btnSalvar = document.getElementById("botaoSalvar");
const btnCancelarEdicao = document.getElementById("botaoCancelarEdicao");
const idVoltar = document.getElementById("voltar");
const botaoNovaCategoria = document.getElementById("botaoNovaCategoria");
const painelCategoria = document.getElementById("painelCategoria");
const secaoCategoriaCadastradas = document.getElementById("secaoListagemCategorias");
const pesqCodigo = document.getElementById("pesquisaCodigo");
const pesqDescricao = document.getElementById("pesquisaDescricao");
const btnPesquisarFiltros = document.getElementById("btnPesquisarFiltros");

let listaCategoriasGlobal = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function buscarProximoCodigoCategoria() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid")
    .order("categoriaprodutoid", { ascending: false })
    .limit(1);

  if (error) {
    return { codigo: null, error };
  }

  const maiorCodigo = data.length > 0 ? Number(data[0].categoriaprodutoid) : 0;

  return { codigo: maiorCodigo + 1, error: null };
}

async function inserirCategoria(categoria) {
  const { error } = await supabaseClient
    .from("categoria_produto")
    .insert(categoria);

  return error;
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Erro ao carregar categorias.</td></tr>`;
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  listaCategoriasGlobal = data;

  if (data.length === 0) {
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Nenhuma categoria cadastrada.</td></tr>`;
    return;
  }

  renderizarTabelaCategorias(listaCategoriasGlobal);
}

function renderizarTabelaCategorias(categorias) {
  tabelaCategorias.innerHTML = "";

  if (categorias.length === 0) {
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Nenhuma categoria encontrada para esta busca.</td></tr>`;
    return;
  }

  categorias.forEach(function(categoria) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${categoria.categoriaprodutoid}</td>
      <td>${categoria.ds_categoria_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(categoria);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirCategoria(categoria);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaCategorias.appendChild(linha);
  });
}

function prepararEdicao(categoria) {
  abrirFormulario();

  categoriaIdInput.value = categoria.categoriaprodutoid;
  descricaoCategoriaInput.value = categoria.ds_categoria_produto;

  btnSalvar.textContent = "Atualizar";
  btnSalvar.classList.add("btn-editar");

  btnCancelarEdicao.textContent = "Cancelar edição";
  btnCancelarEdicao.className = "btn-cancelar";
  btnCancelarEdicao.style.display = "inline-block";
  idVoltar.style.display = "none";
  
  mostrarMensagem("Editando a categoria: " + categoria.ds_categoria_produto, "sucesso");
}

function cancelarEdicao() {
  formularioCategoria.reset();
  categoriaIdInput.value = "";

  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");

  btnCancelarEdicao.style.display = "none";
  idVoltar.style.display = "block"

  mensagem.textContent = "";
  mensagem.className = "mensagem";

  pesqCodigo.value = "";
  pesqDescricao.value = "";
}

async function salvarCategoria() {
  const descricaoCategoria = descricaoCategoriaInput.value.trim();

  if (descricaoCategoria === "") {
    mostrarMensagem("Informe a descrição da categoria.", "erro");
    return;
  }

  let error = await inserirCategoria({
    ds_categoria_produto: descricaoCategoria
  });

  if (error && error.message.includes("duplicate key value")) {
    const resultadoCodigo = await buscarProximoCodigoCategoria();

    if (resultadoCodigo.error) {
      mostrarMensagem("Erro ao buscar prÃ³ximo cÃ³digo da categoria: " + resultadoCodigo.error.message, "erro");
      return;
    }

    error = await inserirCategoria({
      categoriaprodutoid: resultadoCodigo.codigo,
      ds_categoria_produto: descricaoCategoria
    });
  }

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria salva com sucesso!", "sucesso");
  formularioCategoria.reset();
  fecharFormulario();
  await carregarCategorias();
}

async function atualizarCategoria() {
  const categoriaId = categoriaIdInput.value;
  const descricaoCategoria = descricaoCategoriaInput.value.trim();

  if (descricaoCategoria === "") {
    mostrarMensagem("Informe a descrição da categoria.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .update({
      ds_categoria_produto: descricaoCategoria
    })
    .eq("categoriaprodutoid", categoriaId);

  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  cancelarEdicao();
  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
  fecharFormulario();
  await carregarCategorias();
}

async function excluirCategoria(categoria) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir a categoria " + categoria.ds_categoria_produto + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .delete()
    .eq("categoriaprodutoid", categoria.categoriaprodutoid);

  if (error) {
    if (error.message.includes("produto_categoriaprodutoid_fkey")) {
    mostrarMensagem("Não é possível excluir esta categoria, existe produto(s) vinculado(s) a ela.", "erro");
  } else {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
  }
    return;
  }

  if (categoriaIdInput.value == categoria.categoriaprodutoid) {
    cancelarEdicao();
  }

  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");
  await carregarCategorias();
}

function abrirFormulario() {
  painelCategoria.style.display = "block";
  botaoNovaCategoria.style.display = "none";
  idVoltar.style.display = "none";
  secaoCategoriaCadastradas.style.display = "none";

  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");

  btnCancelarEdicao.textContent = "Cancelar cadastro";
  btnCancelarEdicao.className = "btn-cancelar";
  btnCancelarEdicao.style.display = "inline-block";
}

function fecharFormulario() {
  cancelarEdicao();
  painelCategoria.style.display = "none";
  botaoNovaCategoria.style.display = "block";
  idVoltar.style.display = "block";
  secaoCategoriaCadastradas.style.display = "block";
  mensagem.textContent = "";
  mensagem.className = "mensagem";

}

formularioCategoria.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (categoriaIdInput.value !== "") {
    await atualizarCategoria();
  } else {
    await salvarCategoria();
  }
});

botaoNovaCategoria.addEventListener("click", function() {
  abrirFormulario();
});

btnCancelarEdicao.addEventListener("click", function() {
  fecharFormulario();;
});

btnPesquisarFiltros.addEventListener("click", function() {
  const codigoFiltro = pesqCodigo.value.trim();
  const descricaoFiltro = pesqDescricao.value.toLowerCase().trim();

  if (descricaoFiltro !== "" && descricaoFiltro.length < 3) {
    alert("Para pesquisar por descrição, digite pelo menos 3 caracteres.");
    return;
  }

  if (codigoFiltro === "" && descricaoFiltro === "") {
    renderizarTabelaCategorias(listaCategoriasGlobal);
    return;
  }

  const resultadoFiltrado = listaCategoriasGlobal.filter(function(categoria) {
    const bateCodigo = codigoFiltro === "" || String(categoria.categoriaprodutoid) === codigoFiltro;
    const bateDescricao = descricaoFiltro === "" || categoria.ds_categoria_produto.toLowerCase().includes(descricaoFiltro);

    return bateCodigo && bateDescricao;
  });

  renderizarTabelaCategorias(resultadoFiltrado);
});

carregarCategorias();