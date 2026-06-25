# 🖥️ MoniTec

> Sistema de monitoramento e apoio à gestão de computadores em laboratórios escolares.

MoniTec é um protótipo de sistema de monitoramento desenvolvido como Trabalho de Conclusão de Curso do **Técnico em Desenvolvimento de Sistemas** da ETEC Prof. Camargo Aranha (Centro Estadual de Educação Tecnológica Paula Souza), com foco em escolas públicas de São Paulo.

Inspirado no [Veyon](https://veyon.io/en/), o MoniTec busca oferecer uma alternativa mais simples e acessível para que professores possam acompanhar o uso dos computadores durante as aulas, sem necessidade de conhecimentos técnicos avançados.

---

## 📋 Sumário

- [Sobre o Projeto](#sobre-o-projeto)
- [Problema](#problema)
- [Objetivos](#objetivos)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Como Funciona](#como-funciona)
- [Resultados Esperados](#resultados-esperados)
- [Trabalhos Futuros](#trabalhos-futuros)
- [Autores](#autores)
- [Orientadores](#orientadores)

---

## 📖 Sobre o Projeto

Em laboratórios de informática, professores frequentemente precisam circular pela sala para verificar o andamento das atividades e identificar usos indevidos dos computadores. Essa dinâmica reduz o tempo dedicado à orientação pedagógica e dificulta a gestão da turma — especialmente em escolas públicas, onde suporte técnico e infraestrutura podem ser limitados.

O MoniTec propõe uma solução centralizada que permite ao professor:

- Visualizar todos os computadores conectados em tempo real
- Acompanhar informações básicas de uso de cada máquina
- Enviar comandos básicos remotamente
- Configurar o ambiente de forma simples e acessível

---

## 🔍 Problema

A dificuldade central abordada pelo projeto é o **controle do uso de computadores em laboratórios de informática** de forma simples e eficiente. Ferramentas já existentes, como o Veyon, apresentam barreiras de adoção relacionadas a:

- Configuração inicial complexa
- Interface considerada pouco intuitiva
- Dependência de rede local e problemas de autenticação
- Dificuldade de uso por professores sem perfil técnico

> *"Como desenvolver um sistema de monitoramento de computadores para laboratórios escolares que seja simples de configurar, tenha interface acessível e permita comunicação eficiente entre professor, servidor e computadores monitorados?"*

---

## 🎯 Objetivos

### Objetivo Geral

Desenvolver um protótipo de sistema de monitoramento de computadores para laboratórios escolares, priorizando simplicidade de configuração, interface acessível e comunicação eficiente entre professor, servidor central e computadores monitorados.

### Objetivos Específicos

- Criar uma **interface web** para listagem dos computadores conectados e acesso às principais ações do sistema
- Implementar um **servidor central** responsável por autenticação, gerenciamento de sessões, armazenamento de informações e roteamento de comandos
- Utilizar **comunicação HTTP com polling** para troca de informações entre servidor e agentes, com intervalos configuráveis
- Desenvolver um **agente local** para coletar dados básicos do computador e executar comandos autorizados
- Projetar uma **interface de configuração inicial simples** para reduzir a dificuldade de instalação
- Validar o funcionamento do protótipo por meio de **testes em ambiente controlado**

---

## 🏗️ Arquitetura

O MoniTec é dividido em três camadas principais:


![Diagrama-de-camadas](diagrama-camadas.png)

A comunicação ocorre em dois fluxos via HTTP:
1. **Front-end ↔ Servidor**: consulta periódica do estado da interface e envio de comandos pelo professor
2. **Servidor ↔ Agentes**: os agentes verificam regularmente se há comandos pendentes e enviam informações de status

---

## 🛠️ Tecnologias

| Camada | Tecnologia | Motivo da escolha |
|---|---|---|
| Front-end | [React](https://react.dev/) | Interface moderna e componentizada |
| Back-end | [Express](https://expressjs.com/) | Framework leve para Node.js |
| Banco de dados | [SQLite](https://www.sqlite.org/) | Armazenamento local simples, sem servidor externo |
| Agente local | [Golang](https://go.dev/) | Alto desempenho, baixo consumo de memória, compilação em executável único |
| Comunicação | HTTP (Polling) | Simples, compatível com qualquer infraestrutura de rede |

> O Golang foi escolhido para o agente por ser especialmente eficiente em computadores mais antigos, comuns em escolas públicas. A compilação em um único executável também facilita a distribuição e instalação nas máquinas monitoradas.

---

## ⚙️ Funcionalidades

- **Código de sala**: identificação e agrupamento dos computadores por sala
- **Lista de computadores conectados**: visualização em tempo real das máquinas na rede
- **Painel de informações**: dados básicos de cada computador monitorado
- **Painel de ações**: envio de comandos básicos remotamente
- **Configuração simplificada**: interface gráfica no agente para informar dados como código da sala e endereço do servidor, sem necessidade de edição manual de arquivos

---

## 🔄 Como Funciona

1. O professor acessa a **interface web** e cria ou usa um código de sala
2. O **agente** é instalado nos computadores dos alunos e configurado com o código da sala e o endereço do servidor
3. O agente realiza **polling periódico** ao servidor, enviando informações de status e verificando comandos pendentes
4. O servidor **centraliza** as sessões, autentica as máquinas e roteia os comandos
5. O professor visualiza os computadores conectados e pode **enviar comandos** pela interface

---

## ✅ Resultados Esperados

- Protótipo funcional demonstrando a comunicação entre professor, servidor e computadores monitorados
- Criação e uso de código de sala
- Conexão de agentes e visualização dos computadores conectados
- Envio de comandos básicos a partir da interface do professor
- Configuração mais simples do que ferramentas equivalentes já existentes
- Integração das tecnologias estudadas no curso: front-end, back-end, banco de dados e comunicação em rede

---

## 🔮 Trabalhos Futuros

- Visualização de tela em tempo real
- Bloqueio temporário de estação
- Envio de mensagens para os alunos
- Relatórios de uso
- Instalador automatizado
- Avaliação de segurança, privacidade e autorização para uso institucional

---

## 👨‍💻 Autores

- **Rubens Gabriel Policeno**
- **Nathan Henrique Peres Cota**
- **Matheus Marchese Calabro**
- **Leonardo Verderame**
- **Lorenzo Salvatore Bizuli Chiantelli**
- **Vinícius Angelus**

---

## 🎓 Orientadores

| Papel | Nome |
|---|---|
| Orientador | Luiz Lima |
| Coorientador | Ricardo Palhares |
| Coorientador | Davi Vilar |

---

*Trabalho de Conclusão de Curso — Técnico em Desenvolvimento de Sistemas*  
*ETEC Prof. Camargo Aranha — Centro Estadual de Educação Tecnológica Paula Souza*  
*São Paulo, 2026*
