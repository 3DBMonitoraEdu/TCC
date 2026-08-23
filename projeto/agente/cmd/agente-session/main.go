package main

import (
	"agente/internal/collector"
	"agente/internal/executor"
	"agente/internal/ipc"
	"agente/internal/setup"

	"context"
	"log"
	"runtime"
	"time"
)

func main() {
	var configPath string
	switch runtime.GOOS {
	case "windows":
		configPath = "C:\\ProgramData\\MoniTec\\config.json"

	case "linux":
		configPath = "/tmp/MoniTec"

	}
	_, err := setup.CheckJoinCode(configPath)
	if err != nil {
		log.Fatalf("Erro ao configurar o agente: %v", err)
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
				log.Printf("erro ao coletar processos do usuário: %v", err)
				continue
			}
			pids := make([]uint32, len(procs))
			for i, p := range procs {
				pids[i] = uint32(p.PID)
			}
			report := ipc.ProcessReport{PIDs: pids}
			if err := ipc.SendReport(report); err != nil {
				log.Printf("erro ao enviar relatório: %v", err)
			} else {
				log.Printf("enviado %d processos do usuário", len(pids))
			}
		}
	}()

	log.Println("Agente de sessão iniciado. Aguardando comandos...")

	// Main loop to execute commands as they arrive
	for cmd := range cmdChan {
		log.Printf("Comando recebido por Named Pipe: %s", cmd.Data)
		execCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		if err := exe.Execute(execCtx, cmd.Data); err != nil {
			log.Printf("erro ao executar comando %s: %v", cmd.Data, err)
		}
		cancel()
	}
}
