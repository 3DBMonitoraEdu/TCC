package main

import (
	"agente/internal/executor"
	"agente/internal/ipc"
	"agente/internal/setup"

	"context"
	"log"
	"time"
)

const configPath = "C:\\ProgramData\\MoniTec\\config.json"

func main() {
	_, err := setup.CheckJoinCode(configPath)
	if err != nil {
		log.Fatalf("Erro ao configurar o agente: %v", err)
	}

	exe := executor.New()
	cmdChan := make(chan ipc.Command)
	ctx := context.Background()

	// Start listening for commands in the background
	go ipc.ListenForCommands(ctx, cmdChan)

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

