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
const idVoltar = document.getElementById("voltar");
const botaoNovaCategoria = document.getElementById("botaoNovaCategoria");
const painelCategoria = document.getElementById("painelCategoria");
const formularioCategoria = document.getElementById("formularioCategoria");
const secaoCategoriaCadastradas = document.getElementById("secaoListagemCategorias");

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
  abrirFormulario();
  categoriaIdInput.value = categoria.categoriaprodutoid;
  descricaoCategoriaInput.value = categoria.ds_categoria_produto;
  btnSalvar.textContent = "Atualizar";
  btnSalvar.classList.add("btn-editar");
  btnCancelarEdicao.style.display = "inline-block";
  idVoltar.style.display = "none";
  mostrarMensagem("Editando a categoria: " + categoria.ds_categoria_produto, "sucesso");
}

function cancelarEdicao() {
  formCategoria.reset();
  categoriaIdInput.value = "";
  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");
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
  formCategoria.reset();
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
    limparFormulario();
  }

  mostrarMensagem("Categoria excluída com sucesso!", "sucesso");
  await carregarCategorias();
}

function limparFormulario() {
  formCategoria.reset();
  btnSalvar.textContent = "Cadastrar";
  btnSalvar.classList.remove("btn-editar");
  btnCancelarEdicao.textContent = "Cancelar cadastro";
  idVoltar.style.display = "block";
}

function abrirFormulario() {
  painelCategoria.style.display = "block";
  botaoNovaCategoria.style.display = "none";
  idVoltar.style.display = "none";
  secaoCategoriaCadastradas.style.display = "none";
  btnCancelarEdicao.style.display = "none";
  btnCancelarEdicao.textContent = "Cancelar cadastro"
}

function fecharFormulario() {
  limparFormulario();
  painelCategoria.style.display = "none";
  botaoNovaCategoria.style.display = "block";
  idVoltar.style.display = "block";
  secaoCategoriaCadastradas.style.display = "block";
  mensagem.textContent = "";
  mensagem.className = "mensagem";

}

formCategoria.addEventListener("submit", async function(evento) {
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

carregarCategorias();
