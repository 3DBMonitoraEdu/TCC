//go:build linux

package ipc

import (
	"context"
)

type Command struct {
	Data string `json:"data"`
}

func ListenForCommands(ctx context.Context, cmdChan chan<- Command) {
	<-ctx.Done()
}

func StartComandoPipeServer(cmdChan <-chan Command) error {
	return nil
}

func SendReport(report ProcessReport) error {
	return nil
}

func StartReportPipeServer() error {
	return nil
}

// func GetLatestReport() ProcessReport {
func GetLatestReport() ProcessReport {
	var latestReport ProcessReport

	return latestReport
}
