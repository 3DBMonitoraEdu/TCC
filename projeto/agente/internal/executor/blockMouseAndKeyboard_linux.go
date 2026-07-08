//go:build linux

package executor

import (
	"context"
	"fmt"
	"os/exec"
	"strings"
)

func setInputBlock(ctx context.Context, block bool) error {
	cmd := exec.CommandContext(ctx, "xinput", "list", "--short")
	output, err := cmd.Output()
	if err != nil {
		return fmt.Errorf("Erro ao processar inputBlock %v", err)
	}

	lines := strings.Split(string(output), "\n")
	var devices []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		if strings.Contains(line, "keyboard") || strings.Contains(line, "mouse") ||
		   strings.Contains(line, "touchpad") || strings.Contains(line, "slave") {
			parts := strings.Split(line, "id=")
			if len(parts) > 1 {
				id := strings.Fields(parts[1])[0]
				devices = append(devices, id)
			}
		}
	}

	if len(devices) == 0 {
		return fmt.Errorf("não foi encontrado dispositivos")
	}

	action := "disable"
	if !block {
		action = "enable"
	}

	for _, id := range devices {
		cmd := exec.CommandContext(ctx, "xinput", action, id)
		if err := cmd.Run(); err != nil {
			fmt.Printf("erro ao %s dispositivo %s : %v\n", action, id, err)
		}
	}

	return nil
}


func BlockMouseAndKeyboard(ctx context.Context) error {
	return setInputBlock(ctx, true)
}

func UnBlockMouseAndKeyboard(ctx context.Context) error {
	return setInputBlock(ctx, false)
}
