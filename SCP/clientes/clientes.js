const formCliente = document.getElementById("formularioCliente");
const tabelaClientes = document.getElementById("corpoTabelaClientes");

const clienteIdInput = document.getElementById("codigoCliente");
const tipoClienteInput = document.getElementById("tipoCliente");

const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput = document.getElementById("nomeCliente");

const mensagem = document.getElementById("mensagem");
const btnSalvar = document.getElementById("botaoSalvar");

const btnCancelarEdicao = document.getElementById("botaoCancelarEdicao");
const idVoltar = document.getElementById("voltar");

const botaoNovoCLiente = document.getElementById("botaoNovoCliente");
const painelCliente = document.getElementById("painelCliente");

const secaoListagemClientes = document.getElementById("secaoListagemClientes");

const pesqCodigo = document.getElementById("pesquisaCodigo");
const pesqTipo = document.getElementById("pesquisaTipo");
const pesqNome = document.getElementById("pesquisaNome");
const btnPesquisarFiltros = document.getElementById("btnPesquisarFiltros");

let listaClientesGlobal = [];
/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================

  Essa função recebe:
  - texto: mensagem que será exibida.
  - tipo: classe CSS aplicada na mensagem.

  Exemplo:
  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
  mostrarMensagem("Erro ao salvar cliente.", "erro");
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  FUNÇÃO PARA FORMATAR O TIPO DO CLIENTE
  ============================================

  No banco, o tipo é salvo como:
  F = Pessoa Física
  J = Pessoa Jurídica

  Essa função transforma o valor salvo no banco em um texto amigável.
*/

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") {
    return "Pessoa Física";
  }

  if (tipoCliente === "J") {
    return "Pessoa Jurídica";
  }

  return "Não informado";
}

/*
FORMATAR CPF E CNPJ
*/
  
function formatarCPFeCNPJ(cpfCnpjCliente){

  if (!cpfCnpjCliente) {
    return '';
  }

  const apenasNumero = String(cpfCnpjCliente).replace(/\D/g, '');

  if (apenasNumero.length === 11) {
    return apenasNumero.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (apenasNumero.length === 14) {
    return apenasNumero.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return apenasNumero;
}
/*
  ============================================
  CARREGAR CLIENTES
  ============================================

  Essa função busca os clientes no Supabase e monta as linhas da tabela.

  Observação importante:
  A tabela foi criada assim:

  CREATE TABLE CLIENTE (...)

  Como não foram usadas aspas no nome da tabela,
  no PostgreSQL o nome normalmente fica em minúsculo: cliente.

  Por isso usamos:
  .from("cliente")
*/

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
    .order("clienteid", { ascending: true });

  if (error) {
    tabelaClientes.innerHTML = `<tr><td colspan="5">Erro ao carregar clientes.</td></tr>`;
    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  listaClientesGlobal = data;

  if (data.length === 0) {
    tabelaClientes.innerHTML = `<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>`;
    return;
  }

  renderizarTabelaClientes(listaClientesGlobal);
}

function renderizarTabelaClientes(clientes){
  tabelaClientes.innerHTML = "";

  if (clientes.length === 0) {
    tabelaClientes.innerHTML = `<tr><td colspan="5">Nenhum cliente encontrado para esta busca.</td></tr>`;
    return;
  }

  clientes.forEach(function(cliente) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${cliente.clienteid}</td>
      <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
      <td>${formatarCPFeCNPJ(cliente.cpf_cnpj_cliente)}</td>
      <td>${cliente.nome_cliente}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function() {
      prepararEdicao(cliente);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function() {
      excluirCliente(cliente);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaClientes.appendChild(linha);
  });
}

function abrirFormulario(){
  painelCliente.style.display = "block";
  botaoNovoCLiente.style.display = "none";
  secaoListagemClientes.style.display = "none";
  idVoltar.style.display = "none";
  btnCancelarEdicao.style.display = "inline-block";
}

function fecharFormulario(){
  cancelarEdicao();
  painelCliente.style.display = "none";
  botaoNovoCLiente.style.display = "block";
  secaoListagemClientes.style.display = "block";
  idVoltar.style.display = "block";
  btnCancelarEdicao.style.display = "none";
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados do cliente selecionado e joga para dentro do formulário.
*/

function prepararEdicao(cliente) {
  abrirFormulario();
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual cliente atualizar.
  */
  clienteIdInput.value = cliente.clienteid;

  /*
    Preenche os demais campos com os dados do cliente.
  */
  tipoClienteInput.value = cliente.tipo_cliente;
  cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
  nomeClienteInput.value = cliente.nome_cliente;

  /*
    Neste exemplo, vamos permitir editar apenas o nome.

    Por isso:
    - bloqueamos o tipo;
    - bloqueamos o CPF/CNPJ.
  */
  tipoClienteInput.disabled = true;
  cpfCnpjClienteInput.readOnly = true;

  /*
    Mudamos o texto do botão principal para "Atualizar".
  */
  btnSalvar.textContent = "Atualizar";
  btnSalvar.classList.add("btn-editar");

  /*
    Mostramos o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "inline-block";
  idVoltar.style.display = "none";
  /*
    Mostramos uma mensagem informando que o usuário está editando.
  */
  mostrarMensagem("Editando o cliente: " + cliente.nome_cliente, "sucesso");
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================

  Essa função limpa o formulário e volta para o modo de cadastro.
*/

function cancelarEdicao() {
  /*
    Limpa os campos do formulário.
  */
  formCliente.reset();

  /*
    Garante que o ID fique vazio.
    Se o ID estiver vazio, o sistema entende que é um novo cadastro.
  */
  clienteIdInput.value = "";

  /*
    Libera os campos que estavam bloqueados durante a edição.
  */
  tipoClienteInput.disabled = false;
  cpfCnpjClienteInput.readOnly = false;

  /*
    Volta o botão principal para "Salvar".
  */
  btnSalvar.textContent = "Cadastrar";

  btnSalvar.classList.remove("btn-editar");
  /*
    Esconde novamente o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "none";
  idVoltar.style.display = "block";
  /*
    Limpa a área de mensagem.
  */
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  pesqCodigo.value = "";
  pesqTipo.value = "";
  pesqNome.value = "";
}

/*
  ============================================
  SALVAR CLIENTE
  ============================================

  Essa função cadastra um novo cliente no Supabase.

  Ela será chamada quando o campo clienteId estiver vazio.
*/

async function salvarCliente() {
  /*
    Pegamos os valores digitados no formulário.
  */
  const tipoCliente = tipoClienteInput.value;
  const nomeCliente = nomeClienteInput.value.trim();
  const inputCpfCnpj = document.getElementById("cpfCnpjCliente");
  const cpfCnpjCliente = cpfCnpjClienteInput.value.trim();
  const apenasNumero = inputCpfCnpj.value.replace(/\D/g, '');

  if (tipoCliente === "" && cpfCnpjCliente === "" && nomeCliente === "") {
    mostrarMensagem("Preencha todos os campos antes de salvar.", "erro");
    return;
  }

  if (tipoCliente === "") {
  mostrarMensagem("Selecione o tipo do cliente.", "erro");
  return;
}

if (cpfCnpjCliente === "") {
  mostrarMensagem("Informe o CPF/CNPJ do cliente.", "erro");
  return;
}

if (nomeCliente === "") {
  mostrarMensagem("Informe o nome do cliente.", "erro");
  return;
}

if (apenasNumero.length != 11 && apenasNumero.length != 14) {
  mostrarMensagem("Verifique a quantidade de números digitados.", "erro");
  return;
}

  /*
    Montamos o objeto que será enviado para o Supabase.

    As propriedades precisam ter o mesmo nome das colunas da tabela.
  */
  const novoCliente = {
    tipo_cliente: tipoCliente,
    cpf_cnpj_cliente: cpfCnpjCliente,
    nome_cliente: nomeCliente
  };

  /*
    Insere o novo cliente na tabela cliente.
  */
  const { error } = await supabaseClient
    .from("cliente")
    .insert(novoCliente);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");

  /*
    Limpamos o formulário.
  */
  formCliente.reset();
  fecharFormulario();

  /*
    Recarregamos a listagem para mostrar o novo cliente na tabela.
  */
  await carregarClientes();
}

/*
  ============================================
  ATUALIZAR NOME DO CLIENTE
  ============================================

  Essa função atualiza apenas o nome do cliente.

  Ela será chamada quando o campo clienteId estiver preenchido.
*/

async function atualizarNomeCliente() {
  /*
    Pegamos o ID do cliente que está sendo editado.
  */
  const clienteId = clienteIdInput.value;

  /*
    Pegamos o novo nome digitado.
  */
  const nomeCliente = nomeClienteInput.value.trim();

  if (nomeCliente === "") {
    mostrarMensagem("Informe o nome do cliente antes de atualizar.", "erro");
    return;
  }

  /*
    Atualizamos somente a coluna nome_cliente.

    O filtro .eq("clienteid", clienteId) é essencial.
    Ele informa qual registro será atualizado.
  */
  const { error } = await supabaseClient
    .from("cliente")
    .update({
      nome_cliente: nomeCliente
    })
    .eq("clienteid", clienteId);

  /*
    Se houver erro, mostramos a mensagem e paramos.
  */
  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */

  mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
  fecharFormulario();

  /*
    Recarregamos a tabela para mostrar o nome atualizado.
  */
  await carregarClientes();
}

/*
  ============================================
  EXCLUIR CLIENTE
  ============================================

  Essa função exclui um cliente do Supabase.

  Ela recebe o objeto cliente inteiro para poder usar:
  - cliente.clienteid
  - cliente.nome_cliente
*/

async function excluirCliente(cliente) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir o cliente " + cliente.nome_cliente + "?"
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela cliente.

    O filtro .eq("clienteid", cliente.clienteid) garante que apenas
    o cliente selecionado será excluído.
  */
  const { error } = await supabaseClient
    .from("cliente")
    .delete()
    .eq("clienteid", cliente.clienteid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    if (error.message.includes("violates foreign key constraint") || error.message.includes("orcamento_clienteid_fkey")) {
    mostrarMensagem("Não é possível excluir este cliente, ele(a) possui orçamento(s) cadastrados.", "erro");
  } else {
    mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
  }
    return;
  }

  /*
    Se o cliente excluído era o mesmo que estava sendo editado,
    cancelamos a edição para limpar o formulário.
  */
  if (clienteIdInput.value == cliente.clienteid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Cliente excluído com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente o cliente excluído.
  */
  await carregarClientes();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formCliente.addEventListener("submit", async function(evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo clienteId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = clienteIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeCliente();
  } else {
    await salvarCliente();
  }
});

/*
  ============================================
  EVENTO DO BOTÃO CANCELAR EDIÇÃO
  ============================================

  Quando o usuário clicar em "Cancelar edição",
  chamamos a função cancelarEdicao.
*/

botaoNovoCLiente.addEventListener("click", function() {
  abrirFormulario();
  btnCancelarEdicao.textContent = "Cancelar cadastro";
});

btnCancelarEdicao.addEventListener("click", function() {
  fecharFormulario();
});

btnPesquisarFiltros.addEventListener("click", function() {
  const codigoFiltro = pesqCodigo.value.trim();
  const tipoFiltro = pesqTipo.value;
  const nomeFiltro = pesqNome.value.toLowerCase().trim();

  if (nomeFiltro !== "" && nomeFiltro.length < 3) {
    alert("Para pesquisar por nome, digite pelo menos 3 caracteres.");
    return;
  }

  if (codigoFiltro === "" && tipoFiltro === "" && nomeFiltro === "") {
    renderizarTabelaClientes(listaClientesGlobal);
    return;
  }

 
  const resultadoFiltrado = listaClientesGlobal.filter(function(cliente) {
  const bateCodigo = codigoFiltro === "" || String(cliente.clienteid) === codigoFiltro;
  const bateTipo = tipoFiltro === "" || cliente.tipo_cliente === tipoFiltro;
  const bateNome = nomeFiltro === "" || cliente.nome_cliente.toLowerCase().includes(nomeFiltro);

    return bateCodigo && bateTipo && bateNome;
  });

  renderizarTabelaClientes(resultadoFiltrado);
});

/*
  ============================================
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================

  Assim que o arquivo JavaScript é carregado,
  buscamos os clientes no Supabase.
*/

carregarClientes();