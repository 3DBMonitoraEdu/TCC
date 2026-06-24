//go:build linux

package executor

import (
	"context"
	"fmt"

	"os/exec"
)

func setKeyboard(block bool) error {
	if block {
		exec.Command("xinput", "disable", "8").Run()
		fmt.Println("desativando teclado")
	}
	if !block {
		exec.Command("xinput", "enable", "8").Run()
		fmt.Println("ativando teclado")
	}
	return nil
}

func blockKeyboard(ctx context.Context) error   { return setKeyboard(true) }
func unBlockKeyboard(ctx context.Context) error { return setKeyboard(false) }
