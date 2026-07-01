//go:build windows

package executor

import (
	"log"
	"runtime"
	"syscall"
	"unsafe"

	"context"

	"golang.org/x/sys/windows"
)

var (
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")

	registerClassEx  = user32.NewProc("RegisterClassExW")
	createWindowEx   = user32.NewProc("CreateWindowExW")
	defWindowProc    = user32.NewProc("DefWindowProcW")
	showWindow       = user32.NewProc("ShowWindow")
	updateWindow     = user32.NewProc("UpdateWindow")
	getMessage       = user32.NewProc("GetMessageW")
	dispatchMessage  = user32.NewProc("DispatchMessageW")
	translateMessage = user32.NewProc("TranslateMessage")
	postQuitMessage  = user32.NewProc("PostQuitMessage")
	getModuleHandle  = kernel32.NewProc("GetModuleHandleW")

	getSystemMetric  = user32.NewProc("GetSystemMetrics")
	setWindowLongPtr = user32.NewProc("SetWindowLongPtrW")
	setWindowPos     = user32.NewProc("SetWindowPos")
	destroyWindow    = user32.NewProc("DestroyWindow")

	sendMessage = user32.NewProc("SendMessageW")
)

const (
	WS_OVERLAPPEDWINDOW = 0x00CF0000
	CW_USEDEFAULT       = 0x80000000
	SW_SHOW             = 5
	WM_DESTROY          = 2

	gwlStyle      = -16
	wsCaption     = 0x00C00000
	wsPopup       = 0x80000000
	wsMinimizeBox = 0x00020000
	wsMaximizeBox = 0x00010000
	wsSysMenu     = 0x00080000
	wsThickFrame  = 0x00040000

	swpNoZOrder     = 0x0004
	swpFrameChanged = 0x0020
	swpShowWindow   = 0x0040

	smCxScreen = 0
	smCyScreen = 1

	WM_CLOSE = 0x0010
)

type wndClassEx struct {
	CbSize        uint32
	Style         uint32
	LpfnWmProc    uintptr
	CbClsExtra    int32
	CbWndExtra    int32
	HInstance     windows.Handle
	HIcon         windows.Handle
	HCursor       windows.Handle
	HbrBackground windows.Handle
	MenuName      *uint16
	ClassName     *uint16
	HIconSm       windows.Handle
}

func wndProc(hwnd uintptr, msg uint32, wParam, lParam uintptr) uintptr {
	if msg == WM_DESTROY {
		postQuitMessage.Call(0)
		return 0
	}

	ret, _, _ := defWindowProc.Call(hwnd, uintptr(msg), wParam, lParam)
	return ret
}

var blockHwnd uintptr

func createWindow() {
	screenW, _, _ := getSystemMetric.Call(0)
	screenH, _, _ := getSystemMetric.Call(1)

	runtime.LockOSThread()

	instace, _, _ := getModuleHandle.Call(0)
	title, _ := windows.UTF16PtrFromString("BLOQUEADO")
	className, _ := windows.UTF16PtrFromString("blockWindow")
	wndProcCallback := syscall.NewCallback(wndProc)

	wc := wndClassEx{
		CbSize:     uint32(unsafe.Sizeof(wndClassEx{})),
		LpfnWmProc: wndProcCallback,
		HInstance:  windows.Handle(instace),
		ClassName:  className,
	}
	registerClassEx.Call(uintptr(unsafe.Pointer(&wc)))

	hwnd, _, _ := createWindowEx.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		WS_OVERLAPPEDWINDOW,
		CW_USEDEFAULT, CW_USEDEFAULT, (screenW + 100), (screenH + 100),
		0, 0, instace, 0,
	)
	blockHwnd = hwnd
	newStyle := uint32(wsPopup | wsSysMenu | wsThickFrame | wsMaximizeBox | wsMinimizeBox)
	gwlStyleVar := int32(gwlStyle)

	showWindow.Call(hwnd, SW_SHOW)
	updateWindow.Call(hwnd)
	//fullScreen(hwnd)
	setWindowLongPtr.Call(blockHwnd, uintptr(gwlStyleVar), uintptr(newStyle))

	var m msg
	for {
		ret, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if ret == 0 || int32(ret) == -1 {
			break
		}
		translateMessage.Call(uintptr(unsafe.Pointer(&m)))
		dispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}
}

func closeWindow() uintptr {
	ret, _, _ := sendMessage.Call(blockHwnd, WM_CLOSE, 0, 0)
	return ret
}

func blockMonitorByWindow(ctx context.Context) error {
	log.Println("bloquear monitor")
	go createWindow()
	BlockMouseAndKeyboard(ctx)
	return nil
}

func unBlockMonitorByWindow(ctx context.Context) error {
	log.Println("desbloquear monitor")
	if blockHwnd != 0 {
		closeWindow()
		blockHwnd = 0
	}
	UnBlockMouseAndKeyboard(ctx)
	return nil
}
func BlockMonitor(ctx context.Context) error   { return blockMonitorByWindow(ctx) }
func UnBlockMonitor(ctx context.Context) error { return unBlockMonitorByWindow(ctx) }
