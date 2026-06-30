//go:build windows

package main

import (
	"log"

	"agente/internal/agent"
)

const configPath = "config.json"

func main() {
	a, err := agent.New(configPath)
	if err != nil {
		log.Fatalf("erro ao inicializar agente: %v", err)
	}

	a.Run()
}
