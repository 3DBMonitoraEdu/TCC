package main

import (
	"os"

	"agente/internal/platform"
	"agente/internal/updater"
	"runtime"

	//"log"
	"agente/internal/logger"

	"github.com/kardianos/service"
)

var AppVersion = "v0.1.9"

func main() {
	logger.InitLogger()
	var configPath string

	switch runtime.GOOS {
	case "windows":
		configPath = "C:\\ProgramData\\MonitorEdu\\config.json"

	case "linux":
		configPath = "/tmp/MoniTec/config.json"

	}
	//log.Printf("Iniciando MyApp -- %s", AppVersion)
	logger.Logger("info", ("Iniciando Agente-WS " + AppVersion), "agente/main.go:main", nil)

	svc, err := platform.NewService(configPath)
	if err != nil {
		//log.Fatalf("erro ao criar serviço: %v", err)
		logger.Logger("error", "erro ao criar serviço", "agente/main.go:main", err)
	}

	if len(os.Args) > 1 {
		if err := service.Control(svc, os.Args[1]); err != nil {
			//log.Fatalf("erro ao executar serviço: %v", err)
			logger.Logger("error", "erro ao executar serviço", "agente/main.go:main", err)
		}
		return
	}

	if err := updater.CheckAndUpdate(AppVersion); err != nil {
		//log.Printf("⚠️  Não foi possível verificar atualizações: %v", err)
		logger.Logger("warn", "não foi possilve verificar atualizações", "agente/main.go:main", err)
	}

	if err := svc.Run(); err != nil {
		//log.Fatalf("erro ao executar serviço: %v", err)
		logger.Logger("error", "erro ao executar serciço", "agente/main.go:main", err)
	}

}
