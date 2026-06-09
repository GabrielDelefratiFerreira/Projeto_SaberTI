const usuario = "admin";
const senha = "123";

const inputDoUsuario = document.getElementById("user");
const inputDaSenha = document.getElementById("senha");
const botaoEntrar = document.getElementById("btn-entrar");
const mensagemLogin = document.getElementById("mensagem-login");

function validarLogin() {
    const usuarioDigitado = inputDoUsuario.value.trim();
    const senhaDigitada = inputDaSenha.value.trim();

    if (usuarioDigitado == usuario && senhaDigitada == senha) {
        window.location.href = "../menu/home.html";
        return;
    }

    mensagemLogin.textContent = "Login invalido";
    mensagemLogin.classList.add("erro");
}

botaoEntrar.addEventListener("click", validarLogin);

inputDaSenha.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        validarLogin();
    }
});