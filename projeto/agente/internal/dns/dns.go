package dns

import (
	"log"
	"strings"
	"sync"

	"github.com/miekg/dns"
)

var blocked = map[string]bool{
	"exemple":     true,
	"chatgpt.com": true,
}

var (
	visitedDomains   []string
	visitedDomainsMu sync.Mutex
)

func isBlocked(domain string) bool {
	domain = strings.ToLower(domain)

	if blocked[domain] {
		log.Printf("domain block = %s", domain)
		return true
	}

	parts := strings.Split(domain, ".")

	for i := range parts {
		candidate := strings.Join(parts[i:], ".")
		if blocked[candidate] {
			log.Printf("subDomain block = %s", candidate)
			return true
		}
	}

	return false
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
