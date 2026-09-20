//go:build linux

package ipc

import (
	"agente/internal/logger"
	"context"
	"encoding/json"
	"errors"
	"net"
	"os"
	"sync"
	"time"
)

type Command struct {
	Data string `json:"data"`
}

// No Linux, sockets Unix são arquivos no filesystem.
// /run é o equivalente ao antigo /var/run: tmpfs, limpo a cada boot,
// e normalmente só root tem permissão de escrita — por isso o diretório
// precisa ser criado pelo serviço systemd (rodando como root).
const cmdSocketPath = "/run/monitoredu/cmd.sock"
const reportSocketPath = "/run/monitoredu/report.sock"

type socketClient struct {
	conn net.Conn
	ch   chan Command
}

var (
	muClients sync.Mutex
	clients   = make(map[*socketClient]struct{})

	latestReport    ProcessReport
	muReport        sync.RWMutex
	reportAvailable = make(chan struct{}, 1)
)

func handleReportConnection(conn net.Conn) {
	defer conn.Close()
	decoder := json.NewDecoder(conn)
	for {
		var report ProcessReport
		if err := decoder.Decode(&report); err != nil {
			return
		}
		muReport.Lock()
		latestReport = report
		muReport.Unlock()
		select {
		case reportAvailable <- struct{}{}:
		default:
		}
	}
}

func removeSocketIfExists(path string) error {
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

func StartReportPipeServer() error {
	if err := os.MkdirAll("/run/monitoredu", 0755); err != nil {
		return err
	}
	_ = os.Chmod("/run/monitoredu", 0755)

	if err := removeSocketIfExists(reportSocketPath); err != nil {
		return err
	}

	listener, err := net.Listen("unix", reportSocketPath)
	if err != nil {
		return err
	}

	if err := os.Chmod(reportSocketPath, 0666); err != nil {
		listener.Close()
		return err
	}

	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				if errors.Is(err, net.ErrClosed) {
					return
				}
				continue
			}
			go handleReportConnection(conn)
		}
	}()
	return nil
}

// GetLatestReport: agente principal pega os últimos PIDs recebidos
func GetLatestReport() ProcessReport {
	muReport.RLock()
	defer muReport.RUnlock()
	return latestReport
}

// SendReport: agente-sessao envia PIDs de volta
func SendReport(report ProcessReport) error {
	conn, err := net.Dial("unix", reportSocketPath)
	if err != nil {
		return err
	}
	defer conn.Close()

	encoder := json.NewEncoder(conn)
	return encoder.Encode(report)
}

func StartComandoPipeServer(cmdChan <-chan Command) error {
	if err := os.MkdirAll("/run/monitoredu", 0755); err != nil {
		return err
	}
	_ = os.Chmod("/run/monitoredu", 0755)

	if err := removeSocketIfExists(cmdSocketPath); err != nil {
		return err
	}

	listener, err := net.Listen("unix", cmdSocketPath)
	if err != nil {
		return err
	}
	if err := os.Chmod(cmdSocketPath, 0666); err != nil {
		return err
	}

	// Accept loop
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				if errors.Is(err, net.ErrClosed) {
					logger.Logger("error", "socket listener foi fechado, encerrando loop de aceitação", "IPC-Linux:StartComandoSocketServer", err)
					return
				}
				continue
			}
			client := &socketClient{
				conn: conn,
				ch:   make(chan Command, 10),
			}
			muClients.Lock()
			clients[client] = struct{}{}
			muClients.Unlock()

			go runClientWriteLoop(client)
		}
	}()

	// Dispatch loop
	go func() {
		for cmd := range cmdChan {
			muClients.Lock()
			for client := range clients {
				select {
				case client.ch <- cmd:
				default:
					// Buffer cheio, ignora ou loga
				}
			}
			muClients.Unlock()
		}
	}()

	return nil
}

func runClientWriteLoop(client *socketClient) {
	defer func() {
		client.conn.Close()
		muClients.Lock()
		delete(clients, client)
		muClients.Unlock()
	}()

	encoder := json.NewEncoder(client.conn)
	for cmd := range client.ch {
		if err := encoder.Encode(cmd); err != nil {
			return
		}
	}
}

func ListenForCommands(ctx context.Context, cmdChan chan<- Command) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		conn, err := net.Dial("unix", cmdSocketPath)
		if err != nil {
			select {
			case <-ctx.Done():
				return
			case <-time.After(3 * time.Second):
				continue
			}
		}

		decoder := json.NewDecoder(conn)
		for {
			var cmd Command
			if err := decoder.Decode(&cmd); err != nil {
				break
			}
			select {
			case <-ctx.Done():
				conn.Close()
				return
			case cmdChan <- cmd:
			}
		}
		conn.Close()
	}
}
