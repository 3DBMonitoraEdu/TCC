package dns

import (
	"fmt"
	"strings"
	"sync"
)

const (
	ModeBlocklist = "blocklist"
	ModeAllowlist = "allowlist"
)

var (
	policyMode    = ModeBlocklist
	policyDomains = map[string]struct{}{}
	policyMu      sync.RWMutex
)

func UpdatePolicy(mode string, domains []string) error {
	if mode != ModeBlocklist && mode != ModeAllowlist {
		return fmt.Errorf("modo DNS inválido: %s", mode)
	}

	nextDomains := make(map[string]struct{}, len(domains))
	for _, domain := range domains {
		normalized := normalizeDomain(domain)
		if normalized == "" {
			return fmt.Errorf("domínio DNS inválido")
		}
		nextDomains[normalized] = struct{}{}
	}

	policyMu.Lock()
	policyMode = mode
	policyDomains = nextDomains
	policyMu.Unlock()

	return nil
}

func normalizeDomain(domain string) string {
	return strings.TrimRight(strings.ToLower(strings.TrimSpace(domain)), ".")
}

func matchesDomain(domains map[string]struct{}, domain string) bool {
	if _, ok := domains[domain]; ok {
		return true
	}

	parts := strings.Split(domain, ".")
	for index := 1; index < len(parts); index++ {
		if _, ok := domains[strings.Join(parts[index:], ".")]; ok {
			return true
		}
	}

	return false
}
