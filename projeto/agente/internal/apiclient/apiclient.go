package apiclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"

	//"io/ioutil"
	"net/http"
	"time"

	"agente/internal/collector"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func New(baseUrl string) *Client {
	return &Client{
		baseURL: baseUrl,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type RegisterRequest struct {
	JoinCode  string `json:"joinCode"`
	AgentUUID string `json:"agentUuid"`
	Hostname  string `json:"hostname"`
}

type RegisterResponse struct {
	ID        int64  `json:"id"`
	RoomID    int64  `json:"roomId"`
	AgentUUID string `json:"agentUuid"`
	Hostname  string `json:"hostname"`
}

func (c *Client) Register(req RegisterRequest) (*RegisterResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("erro ao serializar request: %w", err)
	}

	url := c.baseURL + "/agents/register"

	resp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("erro ao chamar %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// body2, _ := ioutil.ReadAll(resp.Body)
		// fmt.Printf("resultado %s", string(body2))
		return nil, fmt.Errorf("servidor retornou status %d ao registrar agente", resp.StatusCode)
	}

	var result RegisterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &result, nil
}

func (c *Client) SendMetrics(AgentUUID string, metrics *collector.Metrics) (string, error) {
	body, err := json.Marshal(metrics)
	if err != nil {
		return "", fmt.Errorf("erro ao serializar metricas: %w", err)
	}

	url := fmt.Sprintf("%s/agents/%s/metrics", c.baseURL, AgentUUID)

	resp, err := c.httpClient.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("erro ao chamar %s: %w", url, err)
	}

	defer resp.Body.Close()

	var result map[string]interface{}

	respBytes, err := io.ReadAll(resp.Body)
	res := string(respBytes)

	errJ := json.Unmarshal([]byte(res), &result)

	if errJ != nil {
		fmt.Printf("Erro ao ler JSON: %v", errJ)
	}

	if command, ok := result["command"]; ok {
		if commandFloat, isFloat := command.(float64); isFloat && commandFloat == 0 {

		} else if commandStr, isStr := command.(string); isStr && commandStr != "" {
			return commandStr, nil

		}
	}

	if resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("servidor retornou status %d ao enviar metricas", resp.StatusCode)
	}

	return "", nil
}
