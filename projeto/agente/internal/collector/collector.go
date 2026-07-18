package collector

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/process"
)

func Collect(diskPath string) (*Metrics, error) {
	m := &Metrics{Timestamp: time.Now()}

	cpuPercent, err := collectCpu()
	if err != nil {
		return nil, err
	}
	m.CPUPercent = cpuPercent

	memPercent, memUsedMb, memTotalMb, err := collectMemory()
	if err != nil {
		return nil, err
	}
	m.MemPercent = memPercent
	m.MemUsedMB = memUsedMb
	m.MemTotalMB = memTotalMb

	diskPercent, diskUsedGb, diskTotalGb, err := collectDisk(diskPath)
	if err != nil {
		return nil, err
	}
	m.DiskPercent = diskPercent
	m.DiskUsedGB = diskUsedGb
	m.DiskTotalGB = diskTotalGb

	process, err := collectProcesses()
	if err != nil {
		return nil, err
	}
	m.Processes = process

	return m, nil
}

func collectCpu() (float64, error) {
	percentages, err := cpu.Percent(time.Second, false)
	if err != nil {
		return 0, err
	}

	if len(percentages) == 0 {
		return 0, nil
	}

	return percentages[0], nil
}

func collectMemory() (percent float64, usedMB uint64, totalMB uint64, err error) {
	vm, err := mem.VirtualMemory()
	if err != nil {
		return 0, 0, 0, err
	}

	return vm.UsedPercent, vm.Used / 1024 / 1024, vm.Total / 1024 / 1024, nil
}

func collectDisk(path string) (percent float64, usedGB float64, totalGB float64, err error) {
	usage, err := disk.Usage(path)
	if err != nil {
		return 0, 0, 0, err
	}

	const gb = 1024 * 1024 * 1024
	return usage.UsedPercent, float64(usage.Used) / gb, float64(usage.Total) / gb, nil
}

func collectProcesses() ([]ProcessInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	result := make([]ProcessInfo, 0, len(procs))
	for _, p := range procs {
		name, err := p.Name()
		if err != nil || name == "" {
			continue
		}

		var memMB float64
		if memInfo, err := p.MemoryInfo(); err == nil && memInfo != nil {
			memMB = float64(memInfo.RSS) / 1024 / 1024
		}

		createTimeMs, err := p.CreateTime()
		if err != nil {
			continue
		}
		createTime := time.UnixMilli(createTimeMs)

		result = append(result, ProcessInfo{
			PID:       p.Pid,
			Name:      name,
			MemMB:     memMB,
			CreatedAt: createTime,
		})
	}

	return result, nil
}
