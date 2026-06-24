//go:build linux

package executor

import (
	"context"
	"fmt"

	"os/exec"
)

func setMouse(block bool) error {
	if block {
		exec.Command("xinput", "disable", "11").Run()
		fmt.Println("disativando o mouse")
	}
	if !block {
		exec.Command("xinput", "enable", "11").Run()
		fmt.Println("ativando o mouse")
	}
	return nil
}
func blockMouse(ctx context.Context) error   { return setMouse(true) }
func unBlockMouse(ctx context.Context) error { return setMouse(false) }
