package collector

import "time"

// Metrics representa um snapshot dos recursos da maquina em um momento.
type Metrics struct {
	Timestamp   time.Time     `json:"timestamp"`
	CPUPercent  float64       `json:"cpuPercent"`
	MemPercent  float64       `json:"memPercent"`
	MemUsedMB   uint64        `json:"memUsedMb"`
	MemTotalMB  uint64        `json:"memTotalMb"`
	DiskPercent float64       `json:"diskPercent"`
	DiskUsedGB  float64       `json:"diskUsedGb"`
	DiskTotalGB float64       `json:"diskTotalGb"`
	Processes   []ProcessInfo `json:"processes"`
}

// ProcessInfo representa um processo (aplicativo) em execucao.
type ProcessInfo struct {
	PID   int32   `json:"pid"`
	Name  string  `json:"name"`
	MemMB float64 `json:"memMb"`
}
