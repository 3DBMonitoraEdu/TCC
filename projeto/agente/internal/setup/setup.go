package setup

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"

	"agente/internal/config"
)

func IsConfigured(cfg config.Config) bool {
	return cfg.AgentUUID != "" && cfg.JoinCode != ""
}

func Run(cfg config.Config) (config.Config, error) {
	fmt.Println("===  Configuração inicial do agente ===")

	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Digite o codigo da sala (join_code): ")
	joinCode, err := reader.ReadString('\n')
	if err != nil {
		return cfg, fmt.Errorf("erro ao ler join_code: %w", err)
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
