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
			continue // Ignora processos dos quais não temos permissão de leitura
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
