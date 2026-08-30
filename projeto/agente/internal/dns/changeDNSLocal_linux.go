//go:build linux

package dns

import (
	"os"
	"os/exec"
	"strings"
)

// IsDNSLocal verifica se todas as interfaces ativas (exceto loopback)
// estão usando 127.0.0.1 como DNS.
func IsDNSLocal() bool {
	if hasSystemdResolved() {
		return isDNSLocalSystemdResolved()
	}
	return isDNSLocalResolvConf()
}

// ChangeDNS aplica 127.0.0.1 nas interfaces ativas que ainda não tiverem.
// Precisa rodar como root (equivalente ao "Administrador" do Windows).
func ChangeDNS() error {
	if IsDNSLocal() {
		return nil
	}
	if hasSystemdResolved() {
		return changeDNSSystemdResolved()
	}
	return changeDNSResolvConf()
}

// --- systemd-resolved ---

func hasSystemdResolved() bool {
	cmd := exec.Command("systemctl", "is-active", "systemd-resolved")
	out, err := cmd.Output()
	return err == nil && strings.TrimSpace(string(out)) == "active"
}

func isDNSLocalSystemdResolved() bool {
	ifaces, err := activeInterfaces()
	if err != nil || len(ifaces) == 0 {
		return false
	}
	for _, iface := range ifaces {
		cmd := exec.Command("resolvectl", "dns", iface)
		out, err := cmd.Output()
		if err != nil || !strings.Contains(string(out), "127.0.0.1") {
			return false
		}
	}
	return true
}

func changeDNSSystemdResolved() error {
	ifaces, err := activeInterfaces()
	if err != nil {
		return err
	}
	for _, iface := range ifaces {
		cmd := exec.Command("resolvectl", "dns", iface, "127.0.0.1")
		if err := cmd.Run(); err != nil {
			return err
		}
	}
	return nil
}

// --- fallback: /etc/resolv.conf direto ---

func isDNSLocalResolvConf() bool {
	data, err := os.ReadFile("/etc/resolv.conf")
	if err != nil {
		return false
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "nameserver") {
			return strings.Contains(line, "127.0.0.1")
		}
	}
	return false
}

func changeDNSResolvConf() error {
	return os.WriteFile("/etc/resolv.conf", []byte("nameserver 127.0.0.1\n"), 0644)
}

// --- helper: lista interfaces ativas, ignorando loopback ---

func activeInterfaces() ([]string, error) {
	cmd := exec.Command("sh", "-c", `ip -o link show up | awk -F': ' '{print $2}'`)
	out, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var ifaces []string
	for _, line := range strings.Split(strings.TrimSpace(string(out)), "\n") {
		name := strings.TrimSpace(strings.Split(line, "@")[0]) // remove sufixo tipo "eth0@if5"
		if name == "" || name == "lo" {
			continue
		}
		ifaces = append(ifaces, name)
	}
	return ifaces, nil
}

//By Claude 🤖 - foi gasto cerca de 10L de água
