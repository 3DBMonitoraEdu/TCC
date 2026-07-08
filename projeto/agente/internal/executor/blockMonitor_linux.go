//go:build linux


package executor

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
)

// setMonitorBlock desliga ou liga todos os monitores ativos via xrandr
func setMonitorBlock(ctx context.Context, block bool) error {
	// 1. Descobrir os nomes das saídas ativas
	outputs, err := getActiveOutputs(ctx)
	if err != nil {
		return fmt.Errorf("falha ao listar saídas: %w", err)
	}
	if len(outputs) == 0 {
		return fmt.Errorf("nenhuma saída ativa encontrada")
	}

	// 2. Montar comando xrandr
	var args []string
	if block {
		// Desligar: --off para cada saída
		for _, out := range outputs {
			args = append(args, "--output", out, "--off")
		}
	} else {
		// Ligar: --auto para cada saída (restaura configuração automática)
		for _, out := range outputs {
			args = append(args, "--output", out, "--auto")
		}
	}

	// 3. Executar xrandr
	cmd := exec.CommandContext(ctx, "xrandr", args...)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("falha ao executar xrandr: %w", err)
	}
	return nil
}

// getActiveOutputs retorna uma lista de nomes de saídas conectadas e ativas
func getActiveOutputs(ctx context.Context) ([]string, error) {
	// Executa xrandr --query
	cmd := exec.CommandContext(ctx, "xrandr", "--query")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("erro ao executar xrandr --query: %w", err)
	}

	lines := strings.Split(string(output), "\n")
	var activeOutputs []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		// Procura por linhas que contenham " connected" (ou " connected primary")
		if strings.Contains(line, " connected") {
			// O nome da saída é a primeira palavra da linha
			fields := strings.Fields(line)
			if len(fields) > 0 {
				// Verifica se a saída está realmente ativa: pode ter resolução com "*" ou "+"
				// Exemplo: "eDP-1 connected primary 1920x1080+0+0"
				// Se tiver uma resolução (contém "x" ou "+"), consideramos ativa
				// Para simplificar, qualquer "connected" é considerado ativo (pode ser que esteja desligado, mas "connected" significa fisicamente conectado)
				// Se quisermos apenas os que estão realmente com vídeo, procuramos por padrões como "x" e "+" na linha
				if strings.Contains(line, "x") && (strings.Contains(line, "+") || strings.Contains(line, " ")) {
					// Está ativo (tem resolução)
					activeOutputs = append(activeOutputs, fields[0])
				} else {
					// Pode estar conectado mas desligado (ex: "HDMI-1 disconnected" não pega)
					// Mas como filtramos "connected", deve estar ligado, porém sem resolução? pode ser modo clone? vamos incluir
					// Para ser seguro, incluímos tudo que é "connected" e não tem "disconnected" (já filtrado)
					// Vamos incluir, pois pode ser um monitor com resolução padrão.
					// Apenas para garantir, evitamos linhas com "disconnected" (já não estão).
					// Vamos incluir, pois se a saída está connected, o comando --off funcionará.
					activeOutputs = append(activeOutputs, fields[0])
				}
			}
		}
	}

	return activeOutputs, nil
}

// BlockMonitor desliga o monitor
func BlockMonitor(ctx context.Context) error {
	return setMonitorBlock(ctx, true)
}

// UnBlockMonitor liga o monitor
func UnBlockMonitor(ctx context.Context) error {
	return setMonitorBlock(ctx, false)
}
