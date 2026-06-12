package collector

import (
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
)

func GetCpuUsage() (float64, error) {
	percentages, err := cpu.Percent(time.Second, false)
	if err != nil {
		return 0, err
	}

	if len(percentages) == 0 {
		return 0, nil
	}

	return percentages[0], nil
}
