package main

import (
	"fmt"
	"log"

	"agente/internal/collector"
)

func main() {
	fmt.Println("Agente Iniciado")

	cpuUsage, err := collector.GetCpuUsage()
	if err != nil {
		log.Fatalf("Erro ao obter uso da CPU: %v", err)
	}

	fmt.Printf("Uso da CPU: %.2f%%\n", cpuUsage)
}
