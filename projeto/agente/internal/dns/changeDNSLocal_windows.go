//go:build windows

package dns

import (
	"bufio"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
)

func isDNSLocal() bool {
	cmd := exec.Command("netsh", "interface", "ip", "show", "dns")
	out, err := cmd.Output()
	if err != nil {
		return false
	}

	scanner := bufio.NewScanner(strings.NewReader(string(out)))
	var currentInterface string
	reInterface := regexp.MustCompile(`"(.+?)"`)
	reDNS := regexp.MustCompile(`\b127\.0\.0\.1\b`)

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Detecta o nome da interface no bloco atual
		if strings.Contains(strings.ToLower(line), `interface`) {
			matches := reInterface.FindStringSubmatch(line)
			if len(matches) > 1 {
				currentInterface = strings.ToLower(matches[1])
			}
			continue
		}

		// Só verifica interfaces Wi-Fi ou Ethernet
		if currentInterface == "" {
			continue
		}
		if !strings.Contains(currentInterface, "wi-fi") &&
			!strings.Contains(currentInterface, "ethernet") &&
			!strings.Contains(currentInterface, "wireless") &&
			!strings.Contains(currentInterface, "local area connection") {
			continue
		}

		// Verifica se a linha de DNS contém 127.0.0.1
		if reDNS.MatchString(line) {
			return true
		}
	}

	return false
}

func ChangeDNS() error {
	// PowerShell: verifica se alguma interface ativa não tem 127.0.0.1 como DNS
	// Se não tiver, aplica
	if isDNSLocal() {
		return nil
	} else {
		cmd := exec.Command("powershell", "-Command",
			`Get-NetAdapter | Where-Object {$_.Status -eq 'Up'} | `+
				`ForEach-Object { `+
				`$dns = (Get-DnsClientServerAddress -InterfaceAlias $_.Name -AddressFamily IPv4).ServerAddresses; `+
				`if ($dns -notcontains '127.0.0.1') { `+
				`Set-DnsClientServerAddress -InterfaceAlias $_.Name -ServerAddresses ('127.0.0.1') } }`)

		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		return cmd.Run()
	}
}
