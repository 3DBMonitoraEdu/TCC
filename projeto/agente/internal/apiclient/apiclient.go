package apiclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
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
		return nil, fmt.Errorf("servidor retornou status %d ao registrar agente", resp.StatusCode)
	}

	var result RegisterResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta: %w", err)
	}

	return &result, nil
}
