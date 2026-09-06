package main

import (
	"agente/internal/collector"
	"agente/internal/executor"
	"agente/internal/ipc"
	"agente/internal/setup"

	//"log"
	"agente/internal/logger"

	"context"
	"runtime"
	"time"
)

func main() {
	logger.InitLogger()

	var configPath string
	switch runtime.GOOS {
	case "windows":
		configPath = "C:\\ProgramData\\MonitorEdu\\config.json"

	case "linux":
		configPath = "/tmp/MoniTec/config.json"

	}
	_, err := setup.CheckJoinCode(configPath)
	if err != nil {
		//log.Fatalf("Erro ao configurar o agente: %v", err)
		logger.Logger("error", "ERRO AO CONFIGURAR O AGENTE", "agente-session/main.go:main", err)
	}

	exe := executor.New()
	cmdChan := make(chan ipc.Command)
	ctx := context.Background()

	// Start listening for commands in the background
	go ipc.ListenForCommands(ctx, cmdChan)

	go func() {
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			procs, err := collector.CollectProcesses()
			if err != nil {
				//log.Printf("erro ao coletar processos do usuário: %v", err)
				logger.Logger("error", "erro ao coletar processos do usuário", "agente-session/main.go:main", err)
				continue
			}
			pids := make([]uint32, len(procs))
			for i, p := range procs {
				pids[i] = uint32(p.PID)
			}
			report := ipc.ProcessReport{PIDs: pids}
			if err := ipc.SendReport(report); err != nil {
				//log.Printf("erro ao enviar relatório: %v", err)
				logger.Logger("error", "erro ao enviar relatório", "agente-session/main.go:main", err)
			}
		}
	}()

	//log.Println("Agente de sessão iniciado. Aguardando comandos...")
	logger.Logger("info", "Agente de sessão iniciado. Aguardando comandos...", "agente-session/main.go:main", nil)

	// Main loop to execute commands as they arrive
	for cmd := range cmdChan {
		//log.Printf("Comando recebido por Named Pipe: %s", cmd.Data)
		logger.Logger("info", ("Comando recebido: " + cmd.Data), "agente-session/main.go:main", nil)
		execCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		if err := exe.Execute(execCtx, cmd.Data); err != nil {
			//log.Printf("erro ao executar comando %s: %v", cmd.Data, err)
			logger.Logger("error", ("erro ao executar comando: " + cmd.Data), "agente-session/main.go:main", err)
		}
		cancel()
	}
}
