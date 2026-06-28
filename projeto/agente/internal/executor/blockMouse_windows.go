//go:build windows

package executor

import (
	"context"
	"fmt"

	"golang.org/x/sys/windows"
)

var (
	procSetSystemCursor = user32.NewProc("SetSystemCursor")
	procShowCursor      = user32.NewProc("ShowCursor")
)

const (
	WH_MOUSE_LL = 14
)

var mouseHook windows.Handle

func blockMouse(ctx context.Context) error {
	cb := windows.NewCallback(func(nCode int32, wParam, lParam uintptr) uintptr {
		if nCode >= 0 {
			return 1 // consome o evento, bloqueando o mouse
		}
		ret, _, _ := procCallNextHookEx.Call(uintptr(mouseHook), uintptr(nCode), wParam, lParam)
		return ret
	})

	h, _, err := procSetWindowsHookExW.Call(
		WH_MOUSE_LL,
		cb,
		0,
		0,
	)
	if h == 0 {
		return fmt.Errorf("SetWindowsHookEx (mouse) falhou: %w", err)
	}
	mouseHook = windows.Handle(h)
	fmt.Println("desativando o mouse")

	// Esconde o cursor visualmente
	procShowCursor.Call(0)

	// Mantém o hook ativo até o contexto cancelar
	go func() {
		<-ctx.Done()
		unBlockMouse(context.Background())
	}()

	return nil
}

func unBlockMouse(ctx context.Context) error {
	if mouseHook != 0 {
		ret, _, err := procUnhookWindowsHookEx.Call(uintptr(mouseHook))
		if ret == 0 {
			return fmt.Errorf("UnhookWindowsHookEx (mouse) falhou: %w", err)
		}
		mouseHook = 0
	}
	// Mostra o cursor novamente
	procShowCursor.Call(1)
	fmt.Println("ativando o mouse")
	return nil
}
