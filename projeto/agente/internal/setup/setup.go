package setup

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"

	"agente/internal/apiclient"
	"agente/internal/config"

	"github.com/ncruces/zenity"
)

func IsConfigured(cfg config.Config) bool {
	return cfg.AgentUUID != "" && cfg.JoinCode != ""
}

func Run(cfg config.Config) (config.Config, error) {
	fmt.Println("===  Configuração inicial do agente ===")

	joinCode, err := zenity.Entry("Digite o codigo da sala (join_code): ",
		zenity.Title("Configuração inicial"),
		zenity.Width(600),
	)

	if err == zenity.ErrCanceled {
		fmt.Println("user cancelou a operação")
		return cfg, fmt.Errorf("configuração cancelada pelo usuário")
	} else if err != nil {
		log.Fatal(err)
	}
	joinCode = strings.TrimSpace(joinCode)

	if joinCode == "" {
		return cfg, fmt.Errorf("join_code não pode ser vazio")
	}

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "Desconhecido"
	}

	cfg.JoinCode = joinCode
	cfg.AgentUUID = uuid.NewString()

	fmt.Printf("Hostname detectado: %s\n", hostname)
	fmt.Printf("UUID do agente gerado: %s\n", cfg.AgentUUID)
	fmt.Println("=== Configuracao concluida ===")

	return cfg, nil
}

func CheckJoinCode(configPath string) (string, error) {
	log.Println("iniciando configurador do agente....")

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Printf("Erro ao carregar config: %v", err)
	}

	if IsConfigured(cfg) {
		log.Println("Agente já está configurado.")
		return "isConfigured", nil
	}

	cfg, err = Run(cfg)
	if err != nil {
		log.Printf("Erro na configuração inicial: %v", err)
		return "erro ao configurar", err
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
		log.Printf("Erro ao registrar agente no servidor: %v", err)
		return "erro ao registrar", err
	}

	if err := config.Save(configPath, cfg); err != nil {
		log.Printf("Erro ao salvar config: %v", err)
		return "erro ao salvar config", err
	}

	log.Printf("Agente registrado com sucesso! ID=%d, RoomID=%d\n", resp.ID, resp.RoomID)
	return "", nil
}
