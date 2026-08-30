package main

import (
	"log"
	"os"

	"agente/internal/platform"
	"agente/internal/updater"

	"runtime"

	"github.com/kardianos/service"
)

var AppVersion = "v0.0.0"

func main() {
	var configPath string
	switch runtime.GOOS {
	case "windows":
		configPath = "C:\\ProgramData\\MoniTec\\config.json"

	case "linux":
		configPath = "/tmp/MoniTec/config.json"

	}
	log.Printf("Iniciando MyApp -- %s", AppVersion)

	svc, err := platform.NewService(configPath)
	if err != nil {
		log.Fatalf("erro ao criar serviço: %v", err)
	}

	if len(os.Args) > 1 {
		if err := service.Control(svc, os.Args[1]); err != nil {
			log.Fatalf("erro ao executar serviço: %v", err)
		}
		return
	}

	if err := updater.CheckAndUpdate(AppVersion); err != nil {
		log.Printf("⚠️  Não foi possível verificar atualizações: %v", err)
	}

	if err := svc.Run(); err != nil {
		log.Fatalf("erro ao executar serviço: %v", err)
	}

}
