//go:build windows

package ipc

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"sync"
	"time"

	winio "github.com/Microsoft/go-winio"
)

type Command struct {
	Data string `json:"data"`
}

const pipeName = `\\.\pipe\MonitorEduCmd`

const reportPipeName = `\\.\pipe\MonitorEduReport`

type pipeClient struct {
	conn net.Conn
	ch   chan Command
}

var (
	muClients sync.Mutex
	clients   = make(map[*pipeClient]struct{})

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

func StartReportPipeServer() error {
	config := &winio.PipeConfig{
		SecurityDescriptor: "D:P(A;;GA;;;SY)(A;;GA;;;AU)",
	}
	listener, err := winio.ListenPipe(reportPipeName, config)
	if err != nil {
		return err
	}

	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				if errors.Is(err, winio.ErrPipeListenerClosed) {
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

// SendReport: agente-session envia PIDs de volta
func SendReport(report ProcessReport) error {
	conn, err := winio.DialPipe(reportPipeName, nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	encoder := json.NewEncoder(conn)
	return encoder.Encode(report)
}

func StartComandoPipeServer(cmdChan <-chan Command) error {
	config := &winio.PipeConfig{
		SecurityDescriptor: "D:P(A;;GA;;;SY)(A;;GA;;;AU)",
	}
	listener, err := winio.ListenPipe(pipeName, config)
	if err != nil {
		return err
	}

	// Accept loop
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				if errors.Is(err, winio.ErrPipeListenerClosed) {
					log.Println("pipe listener foi fechado, encerrando loop de aceitação")
					return // sai da goroutine de vez, não tenta mais
				}
				continue
			}
			client := &pipeClient{
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
					// Buffer full, ignore or log
				}
			}
			muClients.Unlock()
		}
	}()

	return nil
}

func runClientWriteLoop(client *pipeClient) {
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

		conn, err := winio.DialPipe(pipeName, nil)
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
