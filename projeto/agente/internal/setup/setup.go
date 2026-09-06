package setup

import (

	//"log"
	"agente/internal/logger"
	"fmt"

	//"log"
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
	joinCode, err := zenity.Entry("Digite o codigo da sala (join_code): ",
		zenity.Title("Configuração inicial"),
		zenity.Width(600),
	)

	if err == zenity.ErrCanceled {
		//log.Println("user cancelou a operação")
		logger.Logger("info", "user cancelou a operação", "setup:Run", nil)
		return cfg, fmt.Errorf("configuração cancelada pelo usuário")
	} else if err != nil {
		//log.Fatal(err)
		logger.Logger("error", "erro fatal", "setup:Run", nil)
	}
	joinCode = strings.TrimSpace(joinCode)

	if joinCode == "" {
		logger.Logger("error", "join_code não pode ser vazio", "setup:Run", fmt.Errorf("join_code não pode ser vazio"))
		return cfg, fmt.Errorf("join_code não pode ser vazio")
	}

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "Desconhecido"
	}

	cfg.JoinCode = joinCode
	cfg.AgentUUID = uuid.NewString()

	//fmt.Printf("Hostname detectado: %s\n", hostname)
	//fmt.Printf("UUID do agente gerado: %s\n", cfg.AgentUUID)
	logger.Logger("info", fmt.Sprintf("Hostname: %s ; UUID: %s", hostname, cfg.AgentUUID), "setup:Run", nil)

	//fmt.Println("=== Configuracao concluida ===")

	return cfg, nil
}

func CheckJoinCode(configPath string) (string, error) {
	//log.Println("iniciando configurador do agente....")
	logger.Logger("info", "iniciando configurador do agente", "setup:CheckJoinCode", nil)

	cfg, err := config.Load(configPath)
	if err != nil {
		//log.Printf("Erro ao carregar config: %v", err)
		logger.Logger("error", "Erro ao carregar config", "setup:CheckJoinCode", err)
	}

	if IsConfigured(cfg) {
		//log.Println("Agente já está configurado.")
		logger.Logger("infor", "Agente já está configurado", "setup:CheckJoinCode", nil)
		return "isConfigured", nil
	}

	cfg, err = Run(cfg)
	if err != nil {
		//log.Printf("Erro na configuração inicial: %v", err)
		logger.Logger("error", "Erro na configuração inicial", "setup:CheckJoinCode", err)
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
		//log.Printf("Erro ao registrar agente no servidor: %v", err)
		logger.Logger("error", "Erro ao registrar agente no servidor", "setup:CheckJoinCode", err)
		return "erro ao registrar", err
	}

	if err := config.Save(configPath, cfg); err != nil {
		//log.Printf("Erro ao salvar config: %v", err)
		logger.Logger("error", "Erro ao salvar config", "setup:CheckJoinCode", err)
		return "erro ao salvar config", err
	}

	//log.Printf("Agente registrado com sucesso! ID=%d, RoomID=%d\n", resp.ID, resp.RoomID)
	logger.Logger("info", fmt.Sprintf("agente registrado com sucesso! ID=%d, Room=%d", resp.ID, resp.RoomID), "setup:CheckJoinCode", nil)
	return "", nil
}
