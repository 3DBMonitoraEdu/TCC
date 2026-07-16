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
	gdi32    = windows.NewLazySystemDLL("gdi32.dll")

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

	createSolidBrush = gdi32.NewProc("CreateSolidBrush")
	setTextColor     = gdi32.NewProc("SetTextColor")
	setBkMode        = gdi32.NewProc("SetBkMode")
	createFont       = gdi32.NewProc("CreateFontW")
	selectObject     = gdi32.NewProc("SelectObject")
	deleteObject     = gdi32.NewProc("DeleteObject")

	beginPaint    = user32.NewProc("BeginPaint")
	endPaint      = user32.NewProc("EndPaint")
	getClientRect = user32.NewProc("GetClientRect")
	drawText      = user32.NewProc("DrawTextW")

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

	WM_PAINT      = 0x000F
	DT_CENTER     = 0x00000001
	DT_VCENTER    = 0x00000004
	DT_SINGLELINE = 0x00000020

	WS_EX_TOPMOST = 0x00000008
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

type rect struct {
	Left   int32
	Top    int32
	Right  int32
	Bottom int32
}

type paintStruct struct {
	Hdc         uintptr
	FErase      int32
	RcPaint     rect
	FRestore    int32
	FIncUpdate  int32
	RgbReserved [32]byte
}

func wndProc(hwnd uintptr, msg uint32, wParam, lParam uintptr) uintptr {
	switch msg {
	case WM_DESTROY:
		postQuitMessage.Call(0)
		return 0

	case WM_PAINT:
		var ps paintStruct
		hdc, _, _ := beginPaint.Call(hwnd, uintptr(unsafe.Pointer(&ps)))
		if hdc != 0 {
			var r rect
			getClientRect.Call(hwnd, uintptr(unsafe.Pointer(&r)))

			// Define a cor do texto para Branco (0x00FFFFFF -> formato COLORREF BBGGRR)
			setTextColor.Call(hdc, 0x00FFFFFF)
			// Define o modo de fundo do texto como Transparente (1)
			setBkMode.Call(hdc, 1)

			// Cria uma fonte personalizada (Segoe UI, 48px de altura, Negrito/FW_BOLD)
			fontName, _ := windows.UTF16PtrFromString("Segoe UI")
			hFont, _, _ := createFont.Call(
				48, // Altura da fonte
				0,  // Largura (0 escolhe automaticamente a proporção)
				0, 0,
				700, // Peso da fonte (700 = FW_BOLD)
				0, 0, 0,
				1,       // DEFAULT_CHARSET
				0, 0, 5, // CLEARTYPE_QUALITY
				0,
				uintptr(unsafe.Pointer(fontName)),
			)

			// Seleciona a fonte recém-criada no Device Context (DC)
			oldFont, _, _ := selectObject.Call(hdc, hFont)

			// Desenha o texto no centro da tela
			text, _ := windows.UTF16PtrFromString("ESTE COMPUTADOR FOI BLOQUEADO")
			drawText.Call(
				hdc,
				uintptr(unsafe.Pointer(text)),
				^uintptr(0), // Calcula o tamanho do texto automaticamente
				uintptr(unsafe.Pointer(&r)),
				DT_CENTER|DT_VCENTER|DT_SINGLELINE, // Alinhamento centralizado
			)

			// Restaura a fonte padrão do sistema e deleta a fonte criada para liberar memória
			selectObject.Call(hdc, oldFont)
			deleteObject.Call(hFont)

			endPaint.Call(hwnd, uintptr(unsafe.Pointer(&ps)))
		}
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

	blueBrush, _, _ := createSolidBrush.Call(0x00D77800)

	wc := wndClassEx{
		CbSize:        uint32(unsafe.Sizeof(wndClassEx{})),
		LpfnWmProc:    wndProcCallback,
		HInstance:     windows.Handle(instace),
		ClassName:     className,
		HbrBackground: windows.Handle(blueBrush),
	}
	registerClassEx.Call(uintptr(unsafe.Pointer(&wc)))

	hwnd, _, _ := createWindowEx.Call(
		WS_EX_TOPMOST,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		WS_OVERLAPPEDWINDOW,
		CW_USEDEFAULT, CW_USEDEFAULT, (screenW + 100), (screenH + 100),
		0, 0, instace, 0,
	)
	blockHwnd = hwnd
	newStyle := uint32(wsPopup)
	gwlStyleVar := int32(gwlStyle)

	setWindowLongPtr.Call(blockHwnd, uintptr(gwlStyleVar), uintptr(newStyle))

	setWindowPos.Call(
		blockHwnd,
		^uintptr(0), // HWND_TOP
		0, 0, screenW, screenH,
		swpFrameChanged|swpShowWindow,
	)

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
