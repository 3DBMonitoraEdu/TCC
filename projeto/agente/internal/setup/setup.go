package setup

import (

	"fmt"
	"log"
	"os"
	"strings"

	"github.com/google/uuid"

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
