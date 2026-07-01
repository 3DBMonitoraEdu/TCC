//go:build windows

package executor

import (
	"context"
	"fmt"
	"sync"
)

type CommandAction func(ctx context.Context) error

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
	e.mu.RLock()
	action, exists := e.commands[cmdName]
	e.mu.RUnlock()

	if !exists {
		return fmt.Errorf("comando não reconhecido: %s", cmdName)
	}
	return action(ctx)

}

func (e *Executor) RegisterDefaultCommands() {
	e.Register("block_mouseAndKeyboard", BlockMouseAndKeyboard)
	e.Register("unblock_mouseAndKeyboard", UnBlockMouseAndKeyboard)

	e.Register("block_monitor", BlockMonitor)
	e.Register("unblock_monitor", UnBlockMonitor)
}
