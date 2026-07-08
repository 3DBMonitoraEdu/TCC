package main

import (
	"log"

	"agente/internal/agent"
	"agente/internal/updater"
)

var AppVersion = "v0.0.0"

const configPath = "config.json"

func main() {

	log.Printf("Iniciando MyApp %s", AppVersion)

	if err := updater.CheckAndUpdate(AppVersion); err != nil {
		log.Printf("⚠️  Não foi possível verificar atualizações: %v", err)
	}

	a, err := agent.New(configPath)
	if err != nil {
		log.Fatalf("erro ao inicializar agente: %v", err)
	}

	a.Run()
}
