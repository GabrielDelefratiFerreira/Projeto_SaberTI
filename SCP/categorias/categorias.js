const SUPABASE_URL = "https://bbphzdnivlifviemxgff.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5DZjx6V6Cp68QRaFp-xE3g_u_lGR-CC";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const mensagem = document.getElementById("mensagem");
const formCategoria = document.getElementById("formularioCategoria");
const tabelaCategorias = document.getElementById("corpoTabelaCategorias");
const categoriaIdInput = document.getElementById("codigoCategoria");
const descricaoCategoriaInput = document.getElementById("descricaoCategoria");
const btnSalvar = document.getElementById("botaoSalvar");
const btnCancelarEdicao = document.getElementById("botaoCancelarEdicao");

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Erro ao carregar categorias.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar categorias: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma categoria cadastrada.</td>
      </tr>
    `;
    return;
  }

  tabelaCategorias.innerHTML = "";

  data.forEach(function(categoria) {
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
  categoriaIdInput.value = categoria.categoriaprodutoid;
  descricaoCategoriaInput.value = categoria.ds_categoria_produto;
  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";
  mostrarMensagem("Editando a categoria: " + categoria.ds_categoria_produto, "sucesso");
}

function cancelarEdicao() {
  formCategoria.reset();
  categoriaIdInput.value = "";
  btnSalvar.textContent = "Cadastrar";
  btnCancelarEdicao.style.display = "none";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

async function salvarCategoria() {
  const descricaoCategoria = descricaoCategoriaInput.value.trim();

  if (descricaoCategoria === "") {
    mostrarMensagem("Informe a descrição da categoria.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .insert({
      ds_categoria_produto: descricaoCategoria
    });

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria salva com sucesso!", "sucesso");
  formCategoria.reset();
  carregarCategorias();
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

  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
  cancelarEdicao();
  carregarCategorias();
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
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  if (categoriaIdInput.value == categoria.categoriaprodutoid) {
    cancelarEdicao();
  }

  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");
  carregarCategorias();
}

formCategoria.addEventListener("submit", async function(evento) {
  evento.preventDefault();

  if (categoriaIdInput.value !== "") {
    await atualizarCategoria();
  } else {
    await salvarCategoria();
  }
});

btnCancelarEdicao.addEventListener("click", function() {
  cancelarEdicao();
});

carregarCategorias();
