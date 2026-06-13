package collector

import (
	"fmt"
	"os"
	"time"

	"github.com/shirou/gopsutil/v3/process"
)

type SelfUsage struct {
	CPUPercent float64 `json:"cpuPercent"`
	MemMB      float64 `json:"memMb"`
	PID        int     `json:"pid"`
}

func CollectSelf() (*SelfUsage, error) {
	pid := os.Getpid()

	proc, err := process.NewProcess(int32(pid))
	if err != nil {
		return nil, fmt.Errorf("erro ao obter processo atual (pid %d): %w", pid, err)
	}

	cpuPercent, err := proc.Percent(500 * time.Millisecond)
	if err != nil {
		return nil, fmt.Errorf("erro ao medir CPU do agente: %w", err)
	}

	memInfo, err := proc.MemoryInfo()
	if err != nil {
		return nil, fmt.Errorf("erro ao medir memoria do agente: %w", err)
	}

	return &SelfUsage{
		CPUPercent: cpuPercent,
		MemMB:      float64(memInfo.RSS) / 1024 / 1024,
		PID:        pid,
	}, nil
}
