package config

import (
	"encoding/json"
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
		ServerURL:    "http://192.168.15.13:4040",
		IntervalSecs: 30,
		DiskPath:     "/",
		BlockedHosts: []string{},
	}
}

func Load(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		cfg := Default()
		if saveErr := Save(path, cfg); saveErr != nil {
			return cfg, saveErr
		}
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
	return os.WriteFile(path, data, 0o644)
}
