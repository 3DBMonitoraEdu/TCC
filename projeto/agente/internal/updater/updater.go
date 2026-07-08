package updater

import (
	"fmt"
	"log"
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

func CheckAndUpdate(appVersion string) error {
	u := &updater.Updater{
		Provider: &provider.Github{
			RepositoryURL: "https://github.com/3DBMonitoraEdu/TCC",
			ArchiveName: fmt.Sprintf("moniedu_%s_%s.zip", getOS(), getArch()),
		},
		ExecutableName: "moniedu",
		Version: appVersion,
	}

	latest, err := u.GetLatestVersion();
	if err != nil {
		return fmt.Errorf("erro ao verificar versão: %w", err)
	}

	log.Printf("Versão Atual [%s] Versão mais recente [%s]", appVersion, latest)

	updateStatus, err := u.Update()
	if err != nil {
		return fmt.Errorf("erro ao atualizar: %w", err)
	}

	switch updateStatus{
	case updater.Updated:
		log.Println("✅ Atualização aplicada com sucesso! Reinicie o app.")
	case updater.UpToDate:
		log.Println("App já está em sua ultima versão.")
	}
	
	return nil
}
