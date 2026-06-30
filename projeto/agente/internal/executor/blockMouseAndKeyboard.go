//go:build windows

package executor

import (
	"context"
	"runtime"
	"syscall"

	"sync/atomic"
	"unsafe"

	"log"
)

var (
	user32         = syscall.NewLazyDLL("user32.dll")
	procBlockInput = user32.NewProc("BlockInput")

	inputChannel = make(chan bool)

	procSetWindowsHookEx    = user32.NewProc("SetWindowsHookExW")
	procUnhookWindowsHookEx = user32.NewProc("UnhookWindowsHookEx")
	procCallNextHookEx      = user32.NewProc("CallNextHookEx")
	procGetMessage          = user32.NewProc("GetMessageW")

	winKeyHook     uintptr
	winPressed     atomic.Bool
	blockingActive atomic.Bool
)

const (
	WH_MOUSE_LL    = 14
	WM_MOUSEMOVE   = 0x0200
	WM_LBUTTONDOWN = 0x0201

	WH_KEYBOARD_LL = 13
	wmKeyDown      = 0x0100
	wmKeyUp        = 0x0101
	wmSysKeyDown   = 0x0104
	wmSysKeyUp     = 0x0105

	VK_LBUTTON                         = 0x01
	VK_RBUTTON                         = 0x02
	VK_CANCEL                          = 0x03
	VK_MBUTTON                         = 0x04
	VK_XBUTTON1                        = 0x05
	VK_XBUTTON2                        = 0x06
	VK_BACK                            = 0x08
	VK_TAB                             = 0x09
	VK_CLEAR                           = 0x0C
	VK_RETURN                          = 0x0D
	VK_SHIFT                           = 0x10
	VK_CONTROL                         = 0x11
	VK_MENU                            = 0x12
	VK_PAUSE                           = 0x13
	VK_CAPITAL                         = 0x14
	VK_KANA                            = 0x15
	VK_HANGUL                          = 0x15
	VK_IME_ON                          = 0x16
	VK_JUNJA                           = 0x17
	VK_FINAL                           = 0x18
	VK_HANJA                           = 0x19
	VK_KANJI                           = 0x19
	VK_IME_OFF                         = 0x1A
	VK_ESCAPE                          = 0x1B
	VK_CONVERT                         = 0x1C
	VK_NONCONVERT                      = 0x1D
	VK_ACCEPT                          = 0x1E
	VK_MODECHANGE                      = 0x1F
	VK_SPACE                           = 0x20
	VK_PRIOR                           = 0x21
	VK_NEXT                            = 0x22
	VK_END                             = 0x23
	VK_HOME                            = 0x24
	VK_LEFT                            = 0x25
	VK_UP                              = 0x26
	VK_RIGHT                           = 0x27
	VK_DOWN                            = 0x28
	VK_SELECT                          = 0x29
	VK_PRINT                           = 0x2A
	VK_EXECUTE                         = 0x2B
	VK_SNAPSHOT                        = 0x2C
	VK_INSERT                          = 0x2D
	VK_DELETE                          = 0x2E
	VK_HELP                            = 0x2F
	VK_0                               = 0x30
	VK_1                               = 0x31
	VK_2                               = 0x32
	VK_3                               = 0x33
	VK_4                               = 0x34
	VK_5                               = 0x35
	VK_6                               = 0x36
	VK_7                               = 0x37
	VK_8                               = 0x38
	VK_9                               = 0x39
	VK_A                               = 0x41
	VK_B                               = 0x42
	VK_C                               = 0x43
	VK_D                               = 0x44
	VK_E                               = 0x45
	VK_F                               = 0x46
	VK_G                               = 0x47
	VK_H                               = 0x48
	VK_I                               = 0x49
	VK_J                               = 0x4A
	VK_K                               = 0x4B
	VK_L                               = 0x4C
	VK_M                               = 0x4D
	VK_N                               = 0x4E
	VK_O                               = 0x4F
	VK_P                               = 0x50
	VK_Q                               = 0x51
	VK_R                               = 0x52
	VK_S                               = 0x53
	VK_T                               = 0x54
	VK_U                               = 0x55
	VK_V                               = 0x56
	VK_W                               = 0x57
	VK_X                               = 0x58
	VK_Y                               = 0x59
	VK_Z                               = 0x5A
	VK_LWIN                            = 0x5B
	VK_RWIN                            = 0x5C
	VK_APPS                            = 0x5D
	VK_SLEEP                           = 0x5F
	VK_NUMPAD0                         = 0x60
	VK_NUMPAD1                         = 0x61
	VK_NUMPAD2                         = 0x62
	VK_NUMPAD3                         = 0x63
	VK_NUMPAD4                         = 0x64
	VK_NUMPAD5                         = 0x65
	VK_NUMPAD6                         = 0x66
	VK_NUMPAD7                         = 0x67
	VK_NUMPAD8                         = 0x68
	VK_NUMPAD9                         = 0x69
	VK_MULTIPLY                        = 0x6A
	VK_ADD                             = 0x6B
	VK_SEPARATOR                       = 0x6C
	VK_SUBTRACT                        = 0x6D
	VK_DECIMAL                         = 0x6E
	VK_DIVIDE                          = 0x6F
	VK_F1                              = 0x70
	VK_F2                              = 0x71
	VK_F3                              = 0x72
	VK_F4                              = 0x73
	VK_F5                              = 0x74
	VK_F6                              = 0x75
	VK_F7                              = 0x76
	VK_F8                              = 0x77
	VK_F9                              = 0x78
	VK_F10                             = 0x79
	VK_F11                             = 0x7A
	VK_F12                             = 0x7B
	VK_F13                             = 0x7C
	VK_F14                             = 0x7D
	VK_F15                             = 0x7E
	VK_F16                             = 0x7F
	VK_F17                             = 0x80
	VK_F18                             = 0x81
	VK_F19                             = 0x82
	VK_F20                             = 0x83
	VK_F21                             = 0x84
	VK_F22                             = 0x85
	VK_F23                             = 0x86
	VK_F24                             = 0x87
	VK_NUMLOCK                         = 0x90
	VK_SCROLL                          = 0x91
	VK_LSHIFT                          = 0xA0
	VK_RSHIFT                          = 0xA1
	VK_LCONTROL                        = 0xA2
	VK_RCONTROL                        = 0xA3
	VK_LMENU                           = 0xA4
	VK_RMENU                           = 0xA5
	VK_BROWSER_BACK                    = 0xA6
	VK_BROWSER_FORWARD                 = 0xA7
	VK_BROWSER_REFRESH                 = 0xA8
	VK_BROWSER_STOP                    = 0xA9
	VK_BROWSER_SEARCH                  = 0xAA
	VK_BROWSER_FAVORITES               = 0xAB
	VK_BROWSER_HOME                    = 0xAC
	VK_VOLUME_MUTE                     = 0xAD
	VK_VOLUME_DOWN                     = 0xAE
	VK_VOLUME_UP                       = 0xAF
	VK_MEDIA_NEXT_TRACK                = 0xB0
	VK_MEDIA_PREV_TRACK                = 0xB1
	VK_MEDIA_STOP                      = 0xB2
	VK_MEDIA_PLAY_PAUSE                = 0xB3
	VK_LAUNCH_MAIL                     = 0xB4
	VK_LAUNCH_MEDIA_SELECT             = 0xB5
	VK_LAUNCH_APP1                     = 0xB6
	VK_LAUNCH_APP2                     = 0xB7
	VK_OEM_1                           = 0xBA
	VK_OEM_PLUS                        = 0xBB
	VK_OEM_COMMA                       = 0xBC
	VK_OEM_MINUS                       = 0xBD
	VK_OEM_PERIOD                      = 0xBE
	VK_OEM_2                           = 0xBF
	VK_OEM_3                           = 0xC0
	VK_GAMEPAD_A                       = 0xC3
	VK_GAMEPAD_B                       = 0xC4
	VK_GAMEPAD_X                       = 0xC5
	VK_GAMEPAD_Y                       = 0xC6
	VK_GAMEPAD_RIGHT_SHOULDER          = 0xC7
	VK_GAMEPAD_LEFT_SHOULDER           = 0xC8
	VK_GAMEPAD_LEFT_TRIGGER            = 0xC9
	VK_GAMEPAD_RIGHT_TRIGGER           = 0xCA
	VK_GAMEPAD_DPAD_UP                 = 0xCB
	VK_GAMEPAD_DPAD_DOWN               = 0xCC
	VK_GAMEPAD_DPAD_LEFT               = 0xCD
	VK_GAMEPAD_DPAD_RIGHT              = 0xCE
	VK_GAMEPAD_MENU                    = 0xCF
	VK_GAMEPAD_VIEW                    = 0xD0
	VK_GAMEPAD_LEFT_THUMBSTICK_BUTTON  = 0xD1
	VK_GAMEPAD_RIGHT_THUMBSTICK_BUTTON = 0xD2
	VK_GAMEPAD_LEFT_THUMBSTICK_UP      = 0xD3
	VK_GAMEPAD_LEFT_THUMBSTICK_DOWN    = 0xD4
	VK_GAMEPAD_LEFT_THUMBSTICK_RIGHT   = 0xD5
	VK_GAMEPAD_LEFT_THUMBSTICK_LEFT    = 0xD6
	VK_GAMEPAD_RIGHT_THUMBSTICK_UP     = 0xD7
	VK_GAMEPAD_RIGHT_THUMBSTICK_DOWN   = 0xD8
	VK_GAMEPAD_RIGHT_THUMBSTICK_RIGHT  = 0xD9
	VK_GAMEPAD_RIGHT_THUMBSTICK_LEFT   = 0xDA
	VK_OEM_4                           = 0xDB
	VK_OEM_5                           = 0xDC
	VK_OEM_6                           = 0xDD
	VK_OEM_7                           = 0xDE
	VK_OEM_8                           = 0xDF
	VK_OEM_102                         = 0xE2
	VK_PROCESSKEY                      = 0xE5
	VK_PACKET                          = 0xE7
	VK_ATTN                            = 0xF6
	VK_CRSEL                           = 0xF7
	VK_EXSEL                           = 0xF8
	VK_EREOF                           = 0xF9
	VK_PLAY                            = 0xFA
	VK_ZOOM                            = 0xFB
	VK_NONAME                          = 0xFC
	VK_PA1                             = 0xFD
	VK_OEM_CLEAR                       = 0xFE

	hcAction = 0
)

var blockedKeys = map[uint32]bool{
	VK_LBUTTON:  true,
	VK_RBUTTON:  true,
	VK_CANCEL:   true,
	VK_MBUTTON:  true,
	VK_XBUTTON1: true,
	VK_XBUTTON2: true,
	VK_BACK:     true,
	VK_TAB:      true,
	VK_CLEAR:    true,
	VK_RETURN:   true,
	VK_SHIFT:    true,
	VK_CONTROL:  true,
	VK_MENU:     true,
	VK_PAUSE:    true,
	VK_CAPITAL:  true,
	VK_KANA:     true,
	//VK_HANGUL:                          true,
	VK_IME_ON: true,
	VK_JUNJA:  true,
	VK_FINAL:  true,
	VK_HANJA:  true,
	//VK_KANJI:                           true,
	VK_IME_OFF:                         true,
	VK_ESCAPE:                          true,
	VK_CONVERT:                         true,
	VK_NONCONVERT:                      true,
	VK_ACCEPT:                          true,
	VK_MODECHANGE:                      true,
	VK_SPACE:                           true,
	VK_PRIOR:                           true,
	VK_NEXT:                            true,
	VK_END:                             true,
	VK_HOME:                            true,
	VK_LEFT:                            true,
	VK_UP:                              true,
	VK_RIGHT:                           true,
	VK_DOWN:                            true,
	VK_SELECT:                          true,
	VK_PRINT:                           true,
	VK_EXECUTE:                         true,
	VK_SNAPSHOT:                        true,
	VK_INSERT:                          true,
	VK_DELETE:                          true,
	VK_HELP:                            true,
	VK_0:                               true,
	VK_1:                               true,
	VK_2:                               true,
	VK_3:                               true,
	VK_4:                               true,
	VK_5:                               true,
	VK_6:                               true,
	VK_7:                               true,
	VK_8:                               true,
	VK_9:                               true,
	VK_A:                               true,
	VK_B:                               true,
	VK_C:                               true,
	VK_D:                               true,
	VK_E:                               true,
	VK_F:                               true,
	VK_G:                               true,
	VK_H:                               true,
	VK_I:                               true,
	VK_J:                               true,
	VK_K:                               true,
	VK_L:                               true,
	VK_M:                               true,
	VK_N:                               true,
	VK_O:                               true,
	VK_P:                               true,
	VK_Q:                               true,
	VK_R:                               true,
	VK_S:                               true,
	VK_T:                               true,
	VK_U:                               true,
	VK_V:                               true,
	VK_W:                               true,
	VK_X:                               true,
	VK_Y:                               true,
	VK_Z:                               true,
	VK_LWIN:                            true,
	VK_RWIN:                            true,
	VK_APPS:                            true,
	VK_SLEEP:                           true,
	VK_NUMPAD0:                         true,
	VK_NUMPAD1:                         true,
	VK_NUMPAD2:                         true,
	VK_NUMPAD3:                         true,
	VK_NUMPAD4:                         true,
	VK_NUMPAD5:                         true,
	VK_NUMPAD6:                         true,
	VK_NUMPAD7:                         true,
	VK_NUMPAD8:                         true,
	VK_NUMPAD9:                         true,
	VK_MULTIPLY:                        true,
	VK_ADD:                             true,
	VK_SEPARATOR:                       true,
	VK_SUBTRACT:                        true,
	VK_DECIMAL:                         true,
	VK_DIVIDE:                          true,
	VK_F1:                              true,
	VK_F2:                              true,
	VK_F3:                              true,
	VK_F4:                              true,
	VK_F5:                              true,
	VK_F6:                              true,
	VK_F7:                              true,
	VK_F8:                              true,
	VK_F9:                              true,
	VK_F10:                             true,
	VK_F11:                             true,
	VK_F12:                             true,
	VK_F13:                             true,
	VK_F14:                             true,
	VK_F15:                             true,
	VK_F16:                             true,
	VK_F17:                             true,
	VK_F18:                             true,
	VK_F19:                             true,
	VK_F20:                             true,
	VK_F21:                             true,
	VK_F22:                             true,
	VK_F23:                             true,
	VK_F24:                             true,
	VK_NUMLOCK:                         true,
	VK_SCROLL:                          true,
	VK_LSHIFT:                          true,
	VK_RSHIFT:                          true,
	VK_LCONTROL:                        true,
	VK_RCONTROL:                        true,
	VK_LMENU:                           true,
	VK_RMENU:                           true,
	VK_BROWSER_BACK:                    true,
	VK_BROWSER_FORWARD:                 true,
	VK_BROWSER_REFRESH:                 true,
	VK_BROWSER_STOP:                    true,
	VK_BROWSER_SEARCH:                  true,
	VK_BROWSER_FAVORITES:               true,
	VK_BROWSER_HOME:                    true,
	VK_VOLUME_MUTE:                     true,
	VK_VOLUME_DOWN:                     true,
	VK_VOLUME_UP:                       true,
	VK_MEDIA_NEXT_TRACK:                true,
	VK_MEDIA_PREV_TRACK:                true,
	VK_MEDIA_STOP:                      true,
	VK_MEDIA_PLAY_PAUSE:                true,
	VK_LAUNCH_MAIL:                     true,
	VK_LAUNCH_MEDIA_SELECT:             true,
	VK_LAUNCH_APP1:                     true,
	VK_LAUNCH_APP2:                     true,
	VK_OEM_1:                           true,
	VK_OEM_PLUS:                        true,
	VK_OEM_COMMA:                       true,
	VK_OEM_MINUS:                       true,
	VK_OEM_PERIOD:                      true,
	VK_OEM_2:                           true,
	VK_OEM_3:                           true,
	VK_GAMEPAD_A:                       true,
	VK_GAMEPAD_B:                       true,
	VK_GAMEPAD_X:                       true,
	VK_GAMEPAD_Y:                       true,
	VK_GAMEPAD_RIGHT_SHOULDER:          true,
	VK_GAMEPAD_LEFT_SHOULDER:           true,
	VK_GAMEPAD_LEFT_TRIGGER:            true,
	VK_GAMEPAD_RIGHT_TRIGGER:           true,
	VK_GAMEPAD_DPAD_UP:                 true,
	VK_GAMEPAD_DPAD_DOWN:               true,
	VK_GAMEPAD_DPAD_LEFT:               true,
	VK_GAMEPAD_DPAD_RIGHT:              true,
	VK_GAMEPAD_MENU:                    true,
	VK_GAMEPAD_VIEW:                    true,
	VK_GAMEPAD_LEFT_THUMBSTICK_BUTTON:  true,
	VK_GAMEPAD_RIGHT_THUMBSTICK_BUTTON: true,
	VK_GAMEPAD_LEFT_THUMBSTICK_UP:      true,
	VK_GAMEPAD_LEFT_THUMBSTICK_DOWN:    true,
	VK_GAMEPAD_LEFT_THUMBSTICK_RIGHT:   true,
	VK_GAMEPAD_LEFT_THUMBSTICK_LEFT:    true,
	VK_GAMEPAD_RIGHT_THUMBSTICK_UP:     true,
	VK_GAMEPAD_RIGHT_THUMBSTICK_DOWN:   true,
	VK_GAMEPAD_RIGHT_THUMBSTICK_RIGHT:  true,
	VK_GAMEPAD_RIGHT_THUMBSTICK_LEFT:   true,
	VK_OEM_4:                           true,
	VK_OEM_5:                           true,
	VK_OEM_6:                           true,
	VK_OEM_7:                           true,
	VK_OEM_8:                           true,
	VK_OEM_102:                         true,
	VK_PROCESSKEY:                      true,
	VK_PACKET:                          true,
	VK_ATTN:                            true,
	VK_CRSEL:                           true,
	VK_EXSEL:                           true,
	VK_EREOF:                           true,
	VK_PLAY:                            true,
	VK_ZOOM:                            true,
	VK_NONAME:                          true,
	VK_PA1:                             true,
	VK_OEM_CLEAR:                       true,

	WH_MOUSE_LL:    true,
	WM_MOUSEMOVE:   true,
	WM_LBUTTONDOWN: true,
}

type kbdllHookStruct struct {
	VkCode      uint32
	ScanCode    uint32
	Flags       uint32
	Time        uint32
	DwExtraInfo uintptr
}

type msg struct {
	Hwnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      [2]int32
}

func winKeyProc(nCode int, wParam uintptr, lParam uintptr) uintptr {
	if blockingActive.Load() {
		kb := (*kbdllHookStruct)(unsafe.Pointer(lParam))
		switch wParam {
		case wmKeyDown, wmSysKeyDown:
			if blockedKeys[kb.VkCode] {
				log.Println("tecla bloqueada")
				winPressed.Store(true)
				return 1
			}

		case WM_MOUSEMOVE, WM_LBUTTONDOWN:
			//log.Println("mouse bloqueado")
			return 1

		}
	}

	r, _, _ := procCallNextHookEx.Call(winKeyHook, uintptr(nCode), wParam, lParam)
	return r
}
func winKeyWorker() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	cb := syscall.NewCallback(winKeyProc)
	winKeyHook, _, _ = procSetWindowsHookEx.Call(WH_KEYBOARD_LL, cb, 0, 0)
	defer procUnhookWindowsHookEx.Call(winKeyHook)

	// Instala o hook de baixo nível
	winMouseHook, _, _ := procSetWindowsHookEx.Call(
		WH_MOUSE_LL,
		cb,
		0, 0,
	)
	defer procUnhookWindowsHookEx.Call(winMouseHook)

	var m msg
	for {
		procGetMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
	}

}

func init() {
	//go inputWorker()
	go winKeyWorker()
}

func setInputBlock(ctx context.Context, block bool) error {
	if block {
		log.Println("desativando o mouse/teclado")
	}
	if !block {
		log.Println("ativando o mouse/teclado")
		winPressed.Store(false)
	}

	blockingActive.Store(block)
	return nil
}

func BlockMouseAndKeyboard(ctx context.Context) error   { return setInputBlock(ctx, true) }
func UnBlockMouseAndKeyboard(ctx context.Context) error { return setInputBlock(ctx, false) }
