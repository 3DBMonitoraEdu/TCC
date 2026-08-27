package platform

import (
	"agente/internal/agent"
	"log"

	"github.com/kardianos/service"
)

type program struct {
	configPath string
	agent      *agent.Agent
}

func (p *program) Start(s service.Service) error {
	go func() {
		a, err := agent.New(p.configPath)
		if err != nil {
			log.Fatalf("erro ao inicializar agente: %v", err)
		}
		p.agent = a
		p.agent.Run()
	}()
	return nil
}

func (p *program) Stop(s service.Service) error {
	if p.agent != nil {
		p.agent.Stop()
	}
	return nil

}

func NewService(configPath string) (service.Service, error) {
	svcConfig := &service.Config{
		Name:        "MonitorEdu",
		DisplayName: "monitorEdu Agent",
		Description: "Agente do MyApp para coleta de métricas e execução de comandos remotos.",
	}
	prg := &program{configPath: configPath}
	return service.New(prg, svcConfig)
}
