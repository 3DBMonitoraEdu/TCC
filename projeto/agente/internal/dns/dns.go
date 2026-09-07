package dns

import (
	"log"
	"strings"
	"sync"

	"github.com/miekg/dns"
)

var (
	visitedDomains   []string
	visitedDomainsMu sync.Mutex
)

func isBlocked(domain string) bool {
	domain = normalizeDomain(domain)

	policyMu.RLock()
	mode := policyMode
	matches := matchesDomain(policyDomains, domain)
	policyMu.RUnlock()

	if mode == ModeAllowlist {
		if !matches {
			log.Printf("domain not allowed = %s", domain)
		}
		return !matches
	}

	if matches {
		log.Printf("domain block = %s", domain)
	}
	return matches
}

func handleDNS(w dns.ResponseWriter, r *dns.Msg) {
	msg := new(dns.Msg)
	msg.SetReply(r)

	if len(r.Question) > 0 {
		qName := r.Question[0].Name
		log.Print(qName)
	}
	for _, question := range r.Question {
		domain := strings.TrimSuffix(question.Name, ".")

		visitedDomainsMu.Lock()
		visitedDomains = append(visitedDomains, strings.ToLower(domain))
		visitedDomainsMu.Unlock()

		if isBlocked(domain) {
			msg.Rcode = dns.RcodeNameError
			w.WriteMsg(msg)
			return
		}
	}
	client := &dns.Client{}
	response, _, err := client.Exchange(
		r,
		"1.1.1.1:53",
	)

	if err != nil {
		dns.HandleFailed(w, r)
		return
	}
	w.WriteMsg(response)
}

func CreateLocalDns() {
	dns.HandleFunc(".", handleDNS)

	server := &dns.Server{
		Addr: "127.0.0.1:53",
		Net:  "udp",
	}

	log.Print("DNS filter running in port :53")

	if err := server.ListenAndServe(); err != nil {
		log.Printf("erro ao iniciar servidor DNS local: %v", err)
	}
}

func GetLatestDomain() []string {
	visitedDomainsMu.Lock()
	defer visitedDomainsMu.Unlock()

	if len(visitedDomains) == 0 {
		return []string{}
	}

	buffer := visitedDomains
	visitedDomains = make([]string, 0)
	return buffer
}

func RestoreVisitedDomains(domains []string) {
	if len(domains) == 0 {
		return
	}

	visitedDomainsMu.Lock()
	defer visitedDomainsMu.Unlock()

	restored := make([]string, 0, len(domains)+len(visitedDomains))
	restored = append(restored, domains...)
	visitedDomains = append(restored, visitedDomains...)
}
