//go:build linux

package collector

import (
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/process"
)

func getPidWithWindow() ([]uint32, error) {
	processes, err := process.Processes()
	if err != nil {
		return nil, err
	}

	pidMap := make(map[uint32]bool)

	for _, proc := range processes {
		// Pega os arquivos e sockets abertos pelo processo
		openFiles, err := proc.OpenFiles()
		if err != nil {
			continue // Ignora processos dos quais nao temos permissao de leitura
		}

		for _, f := range openFiles {
			// Verifica se o processo conversa com o socket do X11 ou Wayland
			if strings.Contains(f.Path, "/tmp/.X11-unix/") || strings.Contains(f.Path, "wayland-") {
				pidMap[uint32(proc.Pid)] = true
				break
			}
		}
	}

	pids := make([]uint32, 0, len(pidMap))
	for pid := range pidMap {
		pids = append(pids, pid)
	}

	return pids, nil
}

func CollectUserProcesses() ([]ProcessInfo, error) {
	pids, err := getPidWithWindow()
	if err != nil {
		return nil, err
	}

	result := make([]ProcessInfo, 0, len(pids))
	for _, pid := range pids {
		proc, err := process.NewProcess(int32(pid))
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
		createTimeMs, _ := proc.CreateTime()
		var createTime time.Time
		if createTimeMs > 0 {
			createTime = time.UnixMilli(createTimeMs)
		}

		result = append(result, ProcessInfo{
			PID:       int32(pid),
			Name:      name,
			MemMB:     memMB,
			CreatedAt: createTime,
		})
	}
	return result, nil
}

func CollectProcesses() ([]ProcessInfo, error) {
	return CollectUserProcesses()
}

