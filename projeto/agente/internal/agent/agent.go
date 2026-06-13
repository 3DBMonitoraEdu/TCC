package agent

import (
	"fmt"
	"log"
	"os"
	"time"

	"agente/internal/apiclient"
	"agente/internal/collector"
	"agente/internal/config"
	"agente/internal/setup"
)

type Agent struct {
	cfg    config.Config
	client *apiclient.Client
}

func New(cfgPath string) (*Agent, error) {
	cfg, err := config.Load(cfgPath)
	if err != nil {
		return nil, fmt.Errorf("Erro ao carregar config: %v", err)
	}

	if !setup.IsConfigured(cfg) {
		cfg, err = setup.Run(cfg)
		if err != nil {
			return nil, fmt.Errorf("erro na configuracao inicial: %v", err)
		}

		if err := config.Save(cfgPath, cfg); err != nil {
			return nil, fmt.Errorf("erro ao salvar config: %v", err)
		}

		client := apiclient.New(cfg.ServerURL)

		hostname, err := os.Hostname()
		if err != nil {
			hostname = "Desconhecido"
		}

		resp, err := client.Register(apiclient.RegisterRequest{
			JoinCode:  cfg.JoinCode,
			AgentUUID: cfg.AgentUUID,
			Hostname:  hostname,
		})
		if err != nil {
			return nil, fmt.Errorf("erro ao registrar agente no servidor: %v", err)
		}

		log.Printf("Agente registrado com sucesso! ID=%d, RoomID=%d\n", resp.ID, resp.RoomID)

	}

	return &Agent{cfg: cfg, client: apiclient.New(cfg.ServerURL)}, nil
}

func (a *Agent) Run() {
	interval := time.Duration(a.cfg.IntervalSecs) * time.Second
	log.Printf("agente iniciado - coletando a cada %s", interval)

	a.collect()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		a.collect()
	}
}

func (a *Agent) collect() {
	metrics, err := collector.Collect(a.cfg.DiskPath)
	if err != nil {
		log.Printf("erro ao coletar metricas: %v", err)
		return
	}

	log.Printf("coletado — CPU: %.1f%% RAM: %.1f%% Disco: %.1f%% Processos: %d",
		metrics.CPUPercent, metrics.MemPercent, metrics.DiskPercent, len(metrics.Processes))

	if err := a.client.SendMetrics(a.cfg.AgentUUID, metrics); err != nil {
		log.Printf("erro ao enviar metricas: %v", err)
		return
	}

	log.Printf("metricas enviadas com sucesso")
}
