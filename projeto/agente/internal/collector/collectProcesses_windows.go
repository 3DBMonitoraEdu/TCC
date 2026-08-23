//go:build windows

package collector

import (
	"strings"
	"syscall"
	"time"
	"unsafe"

	"github.com/shirou/gopsutil/v3/process"
)

var (
	user32                    = syscall.NewLazyDLL("user32.dll")
	dwmapi                    = syscall.NewLazyDLL("dwmapi.dll")
	procEnumWindows           = user32.NewProc("EnumWindows")
	procIsWindowVisible       = user32.NewProc("IsWindowVisible")
	procGetWindowThread       = user32.NewProc("GetWindowThreadProcessId")
	procGetWindowTextW        = user32.NewProc("GetWindowTextW")
	procGetWindowLongW        = user32.NewProc("GetWindowLongW")
	procGetWindow             = user32.NewProc("GetWindow")
	procGetShellWindow        = user32.NewProc("GetShellWindow")
	procGetWindowRect         = user32.NewProc("GetWindowRect")
	procDwmGetWindowAttribute = dwmapi.NewProc("DwmGetWindowAttribute")
)

const (
	GWL_EXSTYLE      = 0xFFFFFFEC // -20
	WS_EX_TOOLWINDOW = 0x00000080
	WS_EX_APPWINDOW  = 0x00040000
	GW_OWNER         = 4
	DWMWA_CLOAKED    = 14
)

type RECT struct {
	Left, Top, Right, Bottom int32
}

var systemProcesses = map[string]bool{
	"explorer.exe":                true,
	"dwm.exe":                     true,
	"csrss.exe":                   true,
	"lsass.exe":                   true,
	"services.exe":                true,
	"svchost.exe":                 true,
	"taskhostw.exe":               true,
	"sihost.exe":                  true,
	"fontdrvhost.exe":             true,
	"ctfmon.exe":                  true,
	"searchindexer.exe":           true,
	"searchui.exe":                true,
	"searchhost.exe":              true,
	"searchapp.exe":               true,
	"runtimebroker.exe":           true,
	"shellexperiencehost.exe":     true,
	"startmenuexperiencehost.exe": true,
	"textinputhost.exe":           true,
	"securityhealthsystray.exe":   true,
	"securityhealthservice.exe":   true,
	"applicationframehost.exe":    true,
	"systemsettings.exe":          true,
	"systemsettingsbroker.exe":    true,
	"lockapp.exe":                 true,
	"conhost.exe":                 true,
	"dllhost.exe":                 true,
	"smartscreen.exe":             true,
	"wmiprvse.exe":                true,
	"widgets.exe":                 true,
	"backgroundtaskhost.exe":      true,
	"dashost.exe":                 true,
	"gamebar.exe":                 true,
	"gamebarft.exe":               true,
}

var enumCallback uintptr

func init() {
	enumCallback = syscall.NewCallback(enumWindowsProc)
}

func isAppWindow(hwnd uintptr) bool {
	// 1. Deve ser visivel
	vis, _, _ := procIsWindowVisible.Call(hwnd)
	if vis == 0 {
		return false
	}

	// 2. Ignora janela Desktop/Shell
	shellHwnd, _, _ := procGetShellWindow.Call()
	if hwnd == shellHwnd {
		return false
	}

	// 3. Deve ter titulo valido
	var buf [256]uint16
	procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), 256)
	title := syscall.UTF16ToString(buf[:])
	trimmed := strings.TrimSpace(title)
	if trimmed == "" || trimmed == "Program Manager" {
		return false
	}

	// 4. Ignora janelas Cloaked (UWP / Modern apps em segundo plano/ocultos)
	var cloaked uint32
	procDwmGetWindowAttribute.Call(
		hwnd,
		uintptr(DWMWA_CLOAKED),
		uintptr(unsafe.Pointer(&cloaked)),
		unsafe.Sizeof(cloaked),
	)
	if cloaked != 0 {
		return false
	}
	//APP WINDOWS (CALCULADORA, CONFIGURAÇÂO e ETC)

	// 5. Verifica estilos de janela (Estilo Alt-Tab)
	exStyle, _, _ := procGetWindowLongW.Call(hwnd, uintptr(GWL_EXSTYLE))
	isToolWindow := (int32(exStyle) & WS_EX_TOOLWINDOW) != 0
	isAppWin := (int32(exStyle) & WS_EX_APPWINDOW) != 0

	owner, _, _ := procGetWindow.Call(hwnd, uintptr(GW_OWNER))

	if isToolWindow && !isAppWin {
		return false
	}
	if owner != 0 && !isAppWin {
		return false
	}

	// 6. Deve ter dimensoes nao nulas
	var rect RECT
	procGetWindowRect.Call(hwnd, uintptr(unsafe.Pointer(&rect)))
	if rect.Right-rect.Left <= 0 || rect.Bottom-rect.Top <= 0 {
		return false
	}

	return true
}

func enumWindowsProc(hwnd uintptr, lParam uintptr) uintptr {
	if !isAppWindow(hwnd) {
		return 1
	}

	var pid uint32
	procGetWindowThread.Call(hwnd, uintptr(unsafe.Pointer(&pid)))
	if pid != 0 {
		pids := (*[]uint32)(unsafe.Pointer(lParam))
		*pids = append(*pids, pid)
	}
	return 1
}

// CollectUserProcesses: coleta apenas apps do usuario com janelas ativas
// DEVE rodar na Session do usuario (Session 1+)
func CollectProcesses() ([]ProcessInfo, error) {
	var hwndPids []uint32
	procEnumWindows.Call(enumCallback, uintptr(unsafe.Pointer(&hwndPids)))

	// Remove duplicatas (um app pode ter varias janelas)
	seen := make(map[uint32]bool)
	uniquePids := make([]uint32, 0, len(hwndPids))
	for _, pid := range hwndPids {
		if !seen[pid] {
			seen[pid] = true
			uniquePids = append(uniquePids, pid)
		}
	}

	result := make([]ProcessInfo, 0, len(uniquePids))
	for _, p := range uniquePids {
		pInt := int32(p)
		proc, err := process.NewProcess(pInt)
		if err != nil {
			continue
		}
		name, err := proc.Name()
		if err != nil || name == "" {
			continue
		}

		// Filtra processos conhecidos do sistema pelo nome (case-insensitive)
		if systemProcesses[strings.ToLower(name)] {
			continue
		}

		// Filtra processos localizados em pastas de sistema do Windows
		if exePath, err := proc.Exe(); err == nil {
			lowerPath := strings.ToLower(exePath)
			if strings.Contains(lowerPath, `c:\windows\system32`) ||
				strings.Contains(lowerPath, `c:\windows\syswow64`) ||
				strings.Contains(lowerPath, `c:\windows\systemapps`) ||
				strings.Contains(lowerPath, `c:\windows\winsxs`) {
				continue
			}
		}

		var memMB float64
		if memInfo, err := proc.MemoryInfo(); err == nil && memInfo != nil {
			memMB = float64(memInfo.RSS) / 1024 / 1024
		}

		createTimeMs, err := proc.CreateTime()
		if err != nil {
			continue
		}

		result = append(result, ProcessInfo{
			PID:       pInt,
			Name:      name,
			MemMB:     memMB,
			CreatedAt: time.UnixMilli(createTimeMs),
		})
	}

	return result, nil
}
