package updater

import (
	"fmt"
	//"log"
	"agente/internal/logger"
	"runtime"

	"github.com/mouuff/go-rocket-update/pkg/provider"
	"github.com/mouuff/go-rocket-update/pkg/updater"
)

func getOS() string {
	switch runtime.GOOS {
	case "windows":
		return "windows"
	case "darwin":
		return "darwin"
	default:
		return "linux"
	}
}

func getArch() string {
	switch runtime.GOARCH {
	case "amd64":
		return "amd64"
	case "arm64":
		return "arm64"
	default:
		return "amd64"
	}
}

var DevelopmentMode = true

func CheckAndUpdate(appVersion string) error {
	if DevelopmentMode {
		//log.Println("modo de desenvolvimento ativo!!!. atualizações desativadas!!!.")
		logger.Logger("info", "modo de desenvolvimento ativo, atualizações desativadas", "updater:CheckAndUpdate", nil)
		return nil
	}

	u := &updater.Updater{
		Provider: &provider.Github{
			RepositoryURL: "https://github.com/3DBMonitoraEdu/TCC",
			ArchiveName:   fmt.Sprintf("moniedu_%s_%s.zip", getOS(), getArch()),
		},
		ExecutableName: "moniedu",
		Version:        appVersion,
	}

	latest, err := u.GetLatestVersion()
	if err != nil {
		return fmt.Errorf("erro ao verificar versão: %w", err)
	}

	//log.Printf("Versão Atual [%s] Versão mais recente [%s]", appVersion, latest)
	logger.Logger("info", fmt.Sprintf("Versão Atual [%s] versão mais recente [%s]", appVersion, latest), "updater:CheckAndUpdate", nil)

	updateStatus, err := u.Update()
	if err != nil {
		logger.Logger("error", "erro ao atualizar", "updater:CheckAndUpdate", nil)
		return fmt.Errorf("erro ao atualizar: %w", err)
	}

	switch updateStatus {
	case updater.Updated:
		//log.Println("✅ Atualização aplicada com sucesso! Reinicie o app.")
		logger.Logger("info", "atualizaçõa aplicada com sucesso", "updater:CheckAndUpdate", nil)
	case updater.UpToDate:
		//log.Println("App já está em sua ultima versão.")
		logger.Logger("info", "Agente já esta em sua ultima versão", "updater:CheckAndUpdate", nil)
	}

	return nil
}
