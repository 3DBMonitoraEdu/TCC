//go:build linux

package executor

import (
	"context"
	"fmt"

	"os/exec"
)

func disableMonitor() {
	exec.Command("xset", "dpms", "force", "off").Output()
	fmt.Println("video desligado!!!")
}
func EnableMonitor() {
	exec.Command("xset", "dpms", "force", "on").Output()
	fmt.Println("video ligado!!!")
}

func setMonitor(block bool) error {
	if block {
		///bloquear monitor
		disableMonitor()

	}
	if !block {
		//desbloquear monitor
		EnableMonitor()
	}
	return nil
}

func blockMonitor(ctx context.Context) error   { return setMonitor(true) }
func unBlockMonitor(ctx context.Context) error { return setMonitor(false) }
