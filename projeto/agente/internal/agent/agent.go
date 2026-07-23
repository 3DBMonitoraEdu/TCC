package agent

import (
	"log"
	"time"

	"agente/internal/apiclient"
	"agente/internal/collector"
	"agente/internal/config"
	"agente/internal/executor"
	"agente/internal/setup"

	"agente/internal/ipc"
)

type Agent struct {
	cfg      config.Config
	client   *apiclient.Client
	executor *executor.Executor
	cmdChan  chan ipc.Command
}

func New(cfgPath string) (*Agent, error) {
	var _cfg config.Config
	for {
		var err error
		_cfg, err = config.Load(cfgPath)
		if err != nil {
			log.Printf("Erro ao ler arquivo de configuração (tentando novamente em 10s): %v", err)
		} else if setup.IsConfigured(_cfg) {
			log.Println("Configuração detectada com sucesso! Inicializando o agente...")
			break
		} else {
			log.Println("Agente não configurado. Aguardando configuração via agente-ui...")
		}

		time.Sleep(10 * time.Second)
	}

	cmdChan := make(chan ipc.Command, 100)
	if err := ipc.StartComandoPipeServer(cmdChan); err != nil {
		log.Printf("⚠️ Erro ao iniciar servidor de Named Pipe: %v", err)
	}

	return &Agent{
		cfg:      _cfg,
		client:   apiclient.New(_cfg.ServerURL),
		executor: executor.New(),
		cmdChan:  cmdChan,
	}, nil
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

	resp, err := a.client.SendMetrics(a.cfg.AgentUUID, metrics)

	if err != nil {
		log.Printf("erro ao enviar metricas: %v", err)
		return
	}
	log.Printf("metricas enviadas com sucesso")
	if resp != "" {
		log.Printf("comando recebido para executar: %s", resp)
		select {
		case a.cmdChan <- ipc.Command{Data: resp}:
		default:
			log.Printf("⚠️ Canal de comandos do Named Pipe cheio. Comando ignorado: %s", resp)
		}
	}

	self, err := collector.CollectSelf()
	if err != nil {
		log.Printf("erro ao medir consumo do agente: %v", err)
		return
	}

	log.Printf("agente (pid %d) - CPU %.2f%% RAM: %.2fMB", self.PID, self.CPUPercent, self.MemMB)
}

func (a *Agent) Stop() {
	log.Printf("parando agente...")
}

