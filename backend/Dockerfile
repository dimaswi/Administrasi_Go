# ============================================================
# Backend — Go/Gin API
# Multi-stage build: build di stage pertama, run di stage kedua
# ============================================================

# ---- Stage 1: Build ----
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies untuk build (CGO disabled untuk binary statis)
RUN apk add --no-cache git

# Copy go.mod dan go.sum terlebih dahulu agar layer cache optimal
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./main.go

# ---- Stage 2: Runtime ----
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates untuk HTTPS request
RUN apk add --no-cache ca-certificates tzdata

# Set timezone ke WIB
ENV TZ=Asia/Jakarta

# Copy binary dari stage build
COPY --from=builder /app/server .

# Buat direktori uploads
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Jalankan server
CMD ["./server"]
