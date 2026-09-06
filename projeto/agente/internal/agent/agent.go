package agent

import (
	"agente/internal/apiclient"
	"agente/internal/collector"
	"agente/internal/config"
	"agente/internal/dns"
	"agente/internal/executor"
	"agente/internal/logger"
	"agente/internal/setup"
	"context"
	"fmt"
	"sync"
	"time"

	"agente/internal/ipc"

	"github.com/shirou/gopsutil/v3/process"
)

type Agent struct {
	cfg      config.Config
	client   *apiclient.Client
	executor *executor.Executor
	cmdChan  chan ipc.Command
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
}

func New(cfgPath string) (*Agent, error) {
	var _cfg config.Config
	for {
		var err error
		_cfg, err = config.Load(cfgPath)
		if err != nil {
			//log.Printf("Erro ao ler arquivo de configuração (tentando novamente em 10s): %v", err)
			logger.Logger("error", "Erro ao ler arquivos de configuração (renrando novamente em 10s)", "agent:New", err)

		} else if setup.IsConfigured(_cfg) {
			//log.Println("Configuração detectada com sucesso! Inicializando o agente...")
			logger.Logger("info", "configuração, detectado com sucesso! Inicializado o agente...", "agente:New", nil)
			break
		} else {
			//log.Println("Agente não configurado. Aguardando configuração via agente-ui...")
			logger.Logger("info", "agente não configurado. Aguardando configuração via agente-ui...", "agent:New", nil)
		}

		time.Sleep(10 * time.Second)
	}

	cmdChan := make(chan ipc.Command, 100)
	if err := ipc.StartComandoPipeServer(cmdChan); err != nil {
		//log.Printf("⚠️ Erro ao iniciar servidor de Named Pipe: %v", err)
		logger.Logger("error", "erro ao inciar servidor de Named Pipes", "agent:New", err)
	}

	// Inicia servidor de relatórios para receber PIDs do agente-session
	if err := ipc.StartReportPipeServer(); err != nil {
		//log.Printf("⚠️ Erro ao iniciar servidor de relatórios: %v", err)
		logger.Logger("error", "erro ao iniciar servidor de relatórios", "agent:New", nil)
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Agent{
		cfg:      _cfg,
		client:   apiclient.New(_cfg.ServerURL),
		executor: executor.New(),
		cmdChan:  cmdChan,
		ctx:      ctx,
		cancel:   cancel,
	}, nil
}

func (a *Agent) Run() {
	a.wg.Add(1)
	defer a.wg.Done()

	interval := time.Duration(a.cfg.IntervalSecs) * time.Second
	//log.Printf("agente iniciado - coletando a cada %s", interval)
	logger.Logger("info", fmt.Sprintf("agente iniciado - coletando a cada %s", interval), "agent:Run", nil)

	a.collect()

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-a.ctx.Done():
			//log.Println("encerrando loop de coleta de métricas...")
			logger.Logger("warn", "encerrando loop de coleta de métricas...", "agent:Run", nil)
			return
		case <-ticker.C:
			a.collect()
		}
	}
}

func (a *Agent) collect() {
	metrics, err := collector.Collect(a.cfg.DiskPath)
	if err != nil {
		//log.Printf("erro ao coletar metricas: %v", err)
		logger.Logger("error", "erro ao coletar metricas", "agent:collect", err)
		return
	}

	// Substitui processos pelo relatório do agente-session
	report := ipc.GetLatestReport()
	if len(report.PIDs) > 0 {
		userProcs := make([]collector.ProcessInfo, 0, len(report.PIDs))
		for _, pid := range report.PIDs {
			pInt := int32(pid)
			proc, err := process.NewProcess(pInt)
			if err != nil {
				continue
			}
			name, err := proc.Name()
			if err != nil || name == "" {
				continue
			}
			var memMB float64
			if memInfo, err := proc.MemoryInfo(); err == nil && memInfo != nil {
				memMB = float64(memInfo.RSS) / 1024 / 1024
			}
			createTimeMs, err := proc.CreateTime()
			if err != nil {
				continue
			}
			userProcs = append(userProcs, collector.ProcessInfo{
				PID:       pInt,
				Name:      name,
				MemMB:     memMB,
				CreatedAt: time.UnixMilli(createTimeMs),
			})
		}
		metrics.Processes = userProcs
	} else if len(metrics.Processes) == 0 {
		metrics.Processes = []collector.ProcessInfo{}
	}

	//log.Printf("coletado — CPU: %.1f%% RAM: %.1f%% Disco: %.1f%% Processos: %d Site: %v",
	//	metrics.CPUPercent, metrics.MemPercent, metrics.DiskPercent, len(metrics.Processes), metrics.Dnslatest)

	logger.Logger("info", fmt.Sprintf("coletado — CPU: %.1f%% RAM: %.1f%% Disco: %.1f%% Processos: %d Site: %v", metrics.CPUPercent, metrics.MemPercent, metrics.DiskPercent, len(metrics.Processes), metrics.Dnslatest), "agent:collect", nil)

	dns.ChangeDNS()

	resp, err := a.client.SendMetrics(a.cfg.AgentUUID, metrics)

	if err != nil {
		//log.Printf("erro ao enviar metricas: %v", err)
		logger.Logger("error", "erro ao enviar metricas", "agent:collect", err)
		return
	}
	//log.Printf("metricas enviadas com sucesso")
	logger.Logger("info", "metricas enviadas com sucesso", "agent:collect", nil)

	if resp != "" {
		//log.Printf("comando recebido para executar: %s", resp)
		logger.Logger("info", "comando recebido para executar", "agent:collect", nil)
		select {
		case a.cmdChan <- ipc.Command{Data: resp}:
		default:
			//log.Printf("⚠️ Canal de comandos do Named Pipe cheio. Comando ignorado: %s", resp)
			logger.Logger("warn", "Canal de comandos do Named Pipe cheio. Comando ignorado", "agent:collect", fmt.Errorf("resp: %s", resp))
		}
	}

	self, err := collector.CollectSelf()
	if err != nil {
		//log.Printf("erro ao medir consumo do agente: %v", err)
		logger.Logger("error", "erro ao medir consumo do agente", "agent:collect", err)
		return
	}

	//log.Printf("agente (pid %d) - CPU %.2f%% RAM: %.2fMB", self.PID, self.CPUPercent, self.MemMB)
	logger.Logger("info", fmt.Sprintf("agente (pid %d) - CPU %.2f%% RAM: %.2fMB", self.PID, self.CPUPercent, self.MemMB), "agent:collect", nil)
}

func (a *Agent) Stop() {
	//log.Printf("parando agente...")
	logger.Logger("warn", "parando agente", "agent:Stop", nil)

	a.cancel()
	a.wg.Wait()
	//log.Println("agente finalizado com sucesso.")
	logger.Logger("warn", "agente finalizado com sucesso", "agent:Stop", nil)
}
