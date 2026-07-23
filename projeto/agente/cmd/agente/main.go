package main

import (
	"log"
	"os"

	"agente/internal/platform"
	"agente/internal/updater"

	"github.com/kardianos/service"
)

var AppVersion = "v0.0.0"

const configPath = "C:\\ProgramData\\MoniTec\\config.json"

func main() {

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
