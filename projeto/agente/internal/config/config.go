package config

import (
	"encoding/json"
	"log"
	"os"
)

type Config struct {
	AgentUUID    string   `json:"agent_uuid"`
	JoinCode     string   `json:"join_code"`
	ServerURL    string   `json:"server_url"`
	IntervalSecs int      `json:"interval_secs"`
	DiskPath     string   `json:"disk_path"`
	BlockedHosts []string `json:"blocked_hosts"`
}

func Default() Config {
	return Config{
		AgentUUID:    "",
		JoinCode:     "",
		ServerURL:    "https://moniedu-worker.auth-store.workers.dev",
		IntervalSecs: 30,
		DiskPath:     "/",
		BlockedHosts: []string{},
	}
}

func Load(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		cfg := Default()
		return cfg, nil
	}
	if err != nil {
		return Config{}, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, err
	}
	return cfg, nil
}

func Save(path string, cfg Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	log.Printf("Salvando em: %s", path)

	err = os.WriteFile(path, data, 0o644)
	if err != nil {
		log.Printf("WriteFile erro (%T): %v", err, err)
		return err
	}

	return nil
}
