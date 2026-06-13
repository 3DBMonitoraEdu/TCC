package main

import (
	"fmt"
	"log"
	"os"

	"agente/internal/apiclient"
	"agente/internal/collector"
	"agente/internal/config"
	"agente/internal/setup"
)

const configPath = "config.json"

func main() {
	fmt.Println("Agente Iniciado")

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("Erro ao carregar config: %v", err)
	}

	if !setup.IsConfigured(cfg) {
		cfg, err = setup.Run(cfg)
		if err != nil {
			log.Fatalf("erro na configuracao inicial: %v", err)
		}

		if err := config.Save(configPath, cfg); err != nil {
			log.Fatalf("erro ao salvar config: %v", err)
		}

		client := apiclient.New(cfg.ServerURL)

		hostname, err := os.Hostname()
		if err != nil {
			hostname = "Desconhecido"
		}

		resp, err := client.Register(apiclient.RegisterRequest{
			JoinCode:  cfg.JoinCode,
			AgentUUID: cfg.AgentUUID,
			Hostname:  hostname,
		})
		if err != nil {
			log.Fatalf("erro ao registrar agente no servidor: %v", err)
		}

		fmt.Printf("Agente registrado com sucesso! ID=%d, RoomID=%d\n", resp.ID, resp.RoomID)

	}

	fmt.Printf("Configurações carregadas: %+v\n", cfg)

	cpuUsage, err := collector.GetCpuUsage()
	if err != nil {
		log.Fatalf("Erro ao obter uso da CPU: %v", err)
	}

	fmt.Printf("Uso da CPU: %.2f%%\n", cpuUsage)
}
