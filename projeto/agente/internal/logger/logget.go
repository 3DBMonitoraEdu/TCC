package logger

import (
	"log/slog"
	"strings"

	"context"

	"gopkg.in/natefinch/lumberjack.v2"
)

func InitLogger() {
	logWriter := &lumberjack.Logger{
		Filename:   `C:\ProgramData\MonitorEdu\logs\agent.log`,
		MaxSize:    10, // MB
		MaxBackups: 5,
		MaxAge:     30, // dias
		Compress:   true,
	}

	logger := slog.New(slog.NewJSONHandler(logWriter, &slog.HandlerOptions{
		Level: slog.LevelInfo, // ajustável via config, sem rebuild
	}))
	slog.SetDefault(logger)

}

func Logger(typeMsg string, msg string, loc string, err error) {
	attrs := []slog.Attr{
		slog.String("location", loc),
	}
	if err != nil {
		attrs = append(attrs, slog.Any("error", err))
	}

	ctx := context.Background()

	switch strings.ToLower(typeMsg) {
	case "warn":
		slog.LogAttrs(ctx, slog.LevelWarn, msg, attrs...)

	case "error":
		slog.LogAttrs(ctx, slog.LevelError, msg, attrs...)

	default:
		slog.LogAttrs(ctx, slog.LevelInfo, msg, attrs...)

	}
}
