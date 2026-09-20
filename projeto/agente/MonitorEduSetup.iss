; ============================================================
; MoniTec Agent - Script de Instalação (Inno Setup)
; ============================================================
; Gera um instalador único (MoniTecSetup.exe) que:
;   - Copia o agente para Program Files
;   - Registra o agente como Windows Service
;   (o próprio agente.exe cria e configura o config.json em
;    ProgramData\MoniTec na primeira execução)
;   - Configura auto-restart em caso de crash
;   - Configura início automático (delayed) no boot
;   - Inicia o serviço
;   - No desinstalador: para, remove o serviço e apaga config/logs
;
; ATUALIZAÇÃO: identidade visual (ícone, imagens do wizard, textos
; customizados, páginas de licença/info) para deixar o instalador
; mais profissional e informativo para quem for instalar nas
; escolas.
; ============================================================

#define MyAppName "MoniTec Agent"
#define MyAppVersion "0.2.0"
#define MyAppPublisher "MonitoraEdu"
#define MyServiceName "MonitorEdu"
#define MyExeName "agente.exe"
#define MyUIExeName "agente-session.exe"
#define MyAppURL "https://github.com/3DBMonitoraEdu/TCC"

[Setup]
AppId={{B6F1E2A0-9C3D-4F2E-8B1A-3E7C1D2F4A9B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\MoniTec\Agent
DefaultGroupName=MoniTec
DisableProgramGroupPage=yes
OutputBaseFilename=MoniTecSetup
OutputDir=dist
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyExeName}
DisableWelcomePage=no
; Não deixa o usuário mudar a pasta de instalação, evita erro de config
; (comente essa linha se quiser permitir customização de path)
DisableDirPage=yes
AlwaysRestart=yes

; ---- Identidade visual do instalador ----
WizardStyle=modern
WizardResizable=no
; Ícone do próprio instalador (.exe) e do desinstalador. Use um .ico
; com múltiplos tamanhos embutidos (16/32/48/256px) pra ficar nítido
; em qualquer lugar do Windows.
SetupIconFile=assets\monitoredu.ico
; Imagem grande lateral, mostrada nas páginas de boas-vindas/conclusão.
; BMP, 164x314px (o Inno usa essa base e busca automaticamente
; variantes de alta resolução se você fornecer, ex: WizardImageFile.bmp
; + WizardImageFile-125.bmp, -150.bmp, -175.bmp, -200.bmp).
WizardImageFile=assets\wizard-side.bmp
; Logo pequeno no canto superior direito das demais páginas.
; BMP, 55x58px (mesma lógica de variantes em alta DPI).
WizardSmallImageFile=assets\wizard-small.bmp
WizardImageStretch=no

; ---- Informações extras (aparecem em "Adicionar ou Remover Programas") ----
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases

; ---- Metadados do executável gerado (aba "Detalhes" nas propriedades do arquivo) ----
VersionInfoVersion=1.0.0.0
VersionInfoCompany={#MyAppPublisher}
VersionInfoProductName={#MyAppName}
VersionInfoDescription=Instalador do agente de monitoramento do projeto MonitoraEdu
VersionInfoCopyright=Projeto MonitoraEdu (TCC) - codigo aberto

; Página de licença (opcional). Se seu repo já tem um arquivo LICENSE,
; copie/renomeie ele pra assets\license.txt. Comente a linha abaixo se
; não quiser essa página.
//LicenseFile=assets\license.txt
; Texto exibido ANTES da instalação começar - ótimo lugar pra explicar
; o que o agente faz (inclusive a mudança de DNS local), já que isso
; ajuda a reduzir a desconfiança de quem estiver instalando.
InfoBeforeFile=assets\antes-de-instalar.txt

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

; ---- Textos customizados do assistente (sobrescreve os padrões do Inno) ----
[Messages]
brazilianportuguese.WelcomeLabel1=Bem-vindo à instalação do %1
brazilianportuguese.WelcomeLabel2=Este assistente vai instalar o %1 (versão {#MyAppVersion}) neste computador.%n%nO MoniTec Agent é o componente cliente do projeto %2 - um software de monitoramento e controle de salas de aula para escolas públicas, desenvolvido como Trabalho de Conclusão de Curso e 100%% de código aberto.%n%nRecomendamos fechar os outros programas antes de continuar.
brazilianportuguese.FinishedHeadingLabel=Concluindo a instalação do %1
brazilianportuguese.FinishedLabel=A instalação do %1 foi concluída com sucesso. O serviço já está em execução em segundo plano.
brazilianportuguese.ClickFinish=Clique em Concluir para sair do instalador.

[Files]
    Source: "build\{#MyExeName}"; DestDir: "{app}"; Flags: ignoreversion
    Source: "build\{#MyUIExeName}"; DestDir: "{app}"; Flags: ignoreversion
    Source: "build\config.json"; DestDir: "{commonappdata}\MonitorEdu"; Flags: onlyifdoesntexist; Permissions: users-modify

; ============================================================
; INICIALIZAÇÃO NO LOGON (REGISTRY)
; Registra o agente de sessão para inicializar em todos os logons
; ============================================================
[Registry]
Root: HKLM; Subkey: "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "MoniTecAgentUI"; ValueData: """{app}\{#MyUIExeName}"""; Flags: uninsdeletevalue

; ============================================================
; INSTALAÇÃO
; Ordem importa: instalar -> configurar recovery -> configurar
; start automático -> iniciar
; ============================================================
[Run]
Filename: "{app}\{#MyExeName}"; Parameters: "install"; \
    Flags: runhidden waituntilterminated; StatusMsg: "Registrando serviço MoniTec Agent..."

Filename: "{sys}\sc.exe"; \
    Parameters: "failure {#MyServiceName} reset= 86400 actions= restart/5000/restart/5000/restart/5000"; \
    Flags: runhidden waituntilterminated; StatusMsg: "Configurando recuperação automática..."

Filename: "{sys}\sc.exe"; Parameters: "config {#MyServiceName} start= auto"; \
    Flags: runhidden waituntilterminated; StatusMsg: "Configurando início automático..."

Filename: "{app}\{#MyExeName}"; Parameters: "start"; \
    Flags: runhidden waituntilterminated; StatusMsg: "Iniciando serviço MoniTec Agent..."

Filename: "powershell.exe"; \
    Parameters: "-ExecutionPolicy Bypass -Command ""Get-NetAdapter | Where-Object {{$_.Status -eq 'Up'} | ForEach-Object {{ Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ('127.0.0.1') }"""; \
    Flags: runhidden waituntilterminated; StatusMsg: "Configurando DNS local..."

; ============================================================
; DESINSTALAÇÃO
; Ordem importa: parar -> desregistrar -> (depois o Inno remove os
; arquivos automaticamente, e o [UninstallDelete] cuida do ProgramData)
; ============================================================
[UninstallRun]
; Remove eventual tarefa agendada antiga se existir
Filename: "{sys}\schtasks.exe"; Parameters: "/Delete /TN ""MoniTecAgentUI"" /F"; \
    Flags: runhidden waituntilterminated; RunOnceId: "DeleteMoniTecAgentUI"

Filename: "{app}\{#MyExeName}"; Parameters: "stop"; \
    Flags: runhidden waituntilterminated; RunOnceId: "StopMoniTecAgent"

Filename: "{app}\{#MyExeName}"; Parameters: "uninstall"; \
    Flags: runhidden waituntilterminated; RunOnceId: "UninstallMoniTecAgent"

Filename: "powershell.exe"; \
    Parameters: "-ExecutionPolicy Bypass -Command ""Get-NetAdapter | Where-Object {{$_.Status -eq 'Up'} | ForEach-Object {{ Set-DnsClientServerAddress -InterfaceAlias $_.Name -ResetServerAddresses }"""; \
    Flags: runhidden waituntilterminated; RunOnceId: "ResetDnsMoniTecAgent"

; Remove config.json e logs em ProgramData na desinstalação
[UninstallDelete]
Type: filesandordirs; Name: "{commonappdata}\MoniTec"

[Icons]
Name: "{group}\Desinstalar {#MyAppName}"; Filename: "{uninstallexe}"

[Dirs]
Name: "{commonappdata}\MoniTec"; Permissions: users-modify
