//go:build windows

package collector

import (
	"time"

	"syscall"
	"unsafe"

	"github.com/shirou/gopsutil/v3/process"
)

var (
	kernel32              = syscall.NewLazyDLL("kernel32.dll")
	procCreateSnapshot    = kernel32.NewProc("CreateToolhelp32Snapshot")
	procProcess32First    = kernel32.NewProc("Process32FirstW")
	procProcess32Next     = kernel32.NewProc("Process32NextW")
	procCloseHandle       = kernel32.NewProc("CloseHandle")
	procProcessIdToSessId = kernel32.NewProc("ProcessIdToSessionId")
)

const (
	TH32CS_SNAPPROCESS = 0x00000002
	INVALID_HANDLE     = ^uintptr(0) // equivale a INVALID_HANDLE_VALUE
)

// PROCESSENTRY32W é a struct que a WinAPI preenche para cada processo
type PROCESSENTRY32W struct {
	Size              uint32
	CntUsage          uint32
	ProcessID         uint32
	DefaultHeapID     uintptr
	ModuleID          uint32
	CntThreads        uint32
	ParentProcessID   uint32
	PriorityClassBase int32
	Flags             uint32
	ExeFile           [260]uint16 // MAX_PATH
}

func getPidWithWindow() ([]uint32, error) {
	// Tira um snapshot de todos os processos rodando no sistema
	hSnap, _, _ := procCreateSnapshot.Call(TH32CS_SNAPPROCESS, 0)
	if hSnap == INVALID_HANDLE {
		return nil, nil
	}
	defer procCloseHandle.Call(hSnap)
	var entry PROCESSENTRY32W

	entry.Size = uint32(unsafe.Sizeof(entry))

	// Vai para o primeiro processo do snapshot
	ret, _, _ := procProcess32First.Call(hSnap, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return nil, nil
	}

	var pids []uint32
	for {
		// Verifica em qual sessão esse processo está rodando
		var sessionID uint32
		ok, _, _ := procProcessIdToSessId.Call(
			uintptr(entry.ProcessID),
			uintptr(unsafe.Pointer(&sessionID)),
		)

		// Só pega processos da sessão interativa do usuário (session >= 1)
		if ok != 0 && sessionID >= 1 {
			pids = append(pids, entry.ProcessID)
		}

		// Avança para o próximo processo
		ret, _, _ = procProcess32Next.Call(hSnap, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	return pids, nil

}

func CollectProcesses() ([]ProcessInfo, error) {
	procs, err := getPidWithWindow()
	if err != nil {
		return nil, err
	}

	result := make([]ProcessInfo, 0, len(procs))
	for _, p := range procs {
		pInt := int32(p)
		proc, err := process.NewProcess(pInt)
		if err != nil {
			continue
		}
		name, err := proc.Name()
		if err != nil || name == "" {
			continue
		}

		var memMB float64
		if memInfo, err := proc.MemoryInfo(); err == nil && memInfo != nil {
			memMB = float64(memInfo.RSS) / 1024 / 1024
		}

		createTimeMs, err := proc.CreateTime()
		if err != nil {
			continue
		}
		createTime := time.UnixMilli(createTimeMs)

		result = append(result, ProcessInfo{
			PID:       pInt,
			Name:      name,
			MemMB:     memMB,
			CreatedAt: createTime,
		})
	}

	return result, nil

}
