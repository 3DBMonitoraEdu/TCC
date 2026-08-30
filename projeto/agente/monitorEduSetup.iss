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
; ============================================================

#define MyAppName "MoniTec Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "MoniTec"
#define MyServiceName "MonitorEdu"
#define MyExeName "agente.exe"
#define MyUIExeName "agente-session.exe"

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

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\BrazilianPortuguese.isl"

[Files]
    Source: "build\{#MyExeName}"; DestDir: "{app}"; Flags: ignoreversion
    Source: "build\{#MyUIExeName}"; DestDir: "{app}"; Flags: ignoreversion
    Source: "build\config.json"; DestDir: "{commonappdata}\MoniTec"; Flags: onlyifdoesntexist; Permissions: users-modify

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
