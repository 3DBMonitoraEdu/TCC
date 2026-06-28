//go:build windows

package executor

import (
	"context"
	"fmt"
)

var (
	procSendMessageW = user32.NewProc("SendMessageW")
)

const (
	HWND_BROADCAST   = uintptr(0xFFFF)
	WM_SYSCOMMAND    = uintptr(0x0112)
	SC_MONITORPOWER  = uintptr(0xF170)
	MONITOR_OFF      = uintptr(2)  // desliga o monitor
	MONITOR_ON       = uintptr(^uint(0)) // liga o monitor
)

func disableMonitor() {
	procSendMessageW.Call(
		HWND_BROADCAST,
		WM_SYSCOMMAND,
		SC_MONITORPOWER,
		MONITOR_OFF,
	)
	fmt.Println("video desligado!!!")
}

func EnableMonitor() {
	procSendMessageW.Call(
		HWND_BROADCAST,
		WM_SYSCOMMAND,
		SC_MONITORPOWER,
		MONITOR_ON,
	)
	fmt.Println("video ligado!!!")
}

func setMonitor(block bool) error {
	if block {
		disableMonitor()
	} else {
		EnableMonitor()
	}
	return nil
}

func blockMonitor(ctx context.Context) error   { return setMonitor(true) }
func unBlockMonitor(ctx context.Context) error { return setMonitor(false) }
