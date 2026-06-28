//go:build windows

package executor

import (
	"context"
	"fmt"

	"golang.org/x/sys/windows"
)

var (
	user32                  = windows.NewLazySystemDLL("user32.dll")
	procSetWindowsHookExW   = user32.NewProc("SetWindowsHookExW")
	procUnhookWindowsHookEx = user32.NewProc("UnhookWindowsHookEx")
	procCallNextHookEx      = user32.NewProc("CallNextHookEx")
)

const (
	WH_KEYBOARD_LL = 13
)

var keyboardHook windows.Handle

func blockKeyboard(ctx context.Context) error {
	cb := windows.NewCallback(func(nCode int32, wParam, lParam uintptr) uintptr {
		if nCode >= 0 {
			return 1 // consome o evento, bloqueando a tecla
		}
		ret, _, _ := procCallNextHookEx.Call(uintptr(keyboardHook), uintptr(nCode), wParam, lParam)
		return ret
	})

	h, _, err := procSetWindowsHookExW.Call(
		WH_KEYBOARD_LL,
		cb,
		0,
		0,
	)
	if h == 0 {
		return fmt.Errorf("SetWindowsHookEx falhou: %w", err)
	}
	keyboardHook = windows.Handle(h)
	fmt.Println("desativando teclado")

	// Mantém o hook ativo até o contexto cancelar
	go func() {
		<-ctx.Done()
		unBlockKeyboard(context.Background())
	}()

	return nil
}

func unBlockKeyboard(ctx context.Context) error {
	if keyboardHook != 0 {
		ret, _, err := procUnhookWindowsHookEx.Call(uintptr(keyboardHook))
		if ret == 0 {
			return fmt.Errorf("UnhookWindowsHookEx falhou: %w", err)
		}
		keyboardHook = 0
	}
	fmt.Println("ativando teclado")
	return nil
}
