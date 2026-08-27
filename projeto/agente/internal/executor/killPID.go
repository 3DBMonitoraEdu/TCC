package executor

import (
	"context"
	"fmt"

	"log"

	"github.com/shirou/gopsutil/v3/process"
)

func _killPid(ctx context.Context, params map[string]int32) error {
	log.Print("kill PID")
	fmt.Print("kill PID")
	proc, err := process.NewProcess(params["pid"])
	if err != nil {
		return err
	}
	_err := proc.Kill()

	if _err != nil {
		return err
	}
	return nil
}

func KillPid(ctx context.Context, params map[string]int32) error { return _killPid(ctx, params) }
