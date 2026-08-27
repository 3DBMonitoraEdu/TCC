package executor

import (
	"context"
	"fmt"
	"strconv"
	"sync"

	"net/url"
	"strings"
)

type CommandAction func(ctx context.Context, params map[string]int32) error

type Executor struct {
	mu       sync.RWMutex
	commands map[string]CommandAction
}

func New() *Executor {
	exec := &Executor{
		commands: make(map[string]CommandAction),
	}
	exec.RegisterDefaultCommands()
	return exec
}

func (e *Executor) Register(name string, action CommandAction) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.commands[name] = action
}

func (e *Executor) Execute(ctx context.Context, cmdName string) error {
	params := make(map[string]int32)
	command := ""
	e.mu.RLock()
	value, err := url.ParseQuery(cmdName)
	if strings.Contains(cmdName, "pid=") {
		if err != nil {
			return err
		}

		if pid := value.Get("pid"); pid != "" {
			pidInt, err := strconv.ParseInt(pid, 10, 32)
			if err != nil {
				return err
			}

			params["pid"] = int32(pidInt)
		}
	}
	command = value.Get("command")
	action, exists := e.commands[command]
	e.mu.RUnlock()

	if !exists {
		return fmt.Errorf("comando não reconhecido: %s", cmdName)
	}

	return action(ctx, params)

}

func (e *Executor) RegisterDefaultCommands() {
	e.Register("lock_mouseAndKeyboard", LockMouseAndKeyboard)
	e.Register("unlock_mouseAndKeyboard", UnlockMouseAndKeyboard)

	e.Register("lock_monitor", LockMonitor)
	e.Register("unlock_monitor", UnlockMonitor)

	e.Register("kill_pid", KillPid)
}
