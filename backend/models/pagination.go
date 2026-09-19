package models

type PaginationMeta struct {
	CurrentPage int `json:"current_page"`
	LastPage    int `json:"last_page"`
	PerPage     int `json:"per_page"`
	Total       int `json:"total"`
	From        int `json:"from"`
	To          int `json:"to"`
}

type PaginatedResponse struct {
	Data interface{} `json:"data"`
	PaginationMeta
}
