#!/bin/bash
# Mock script to simulate a Spring Boot application for testing GitHub Action workflows
# This creates a simple server that responds to health checks

echo "Starting mock Spring Boot application..."
PORT=${1:-8088}  # Changed default from 8080 to 8088 to avoid conflicts

# Start a simple HTTP server using Python
python3 -c "
import http.server
import socketserver
import json
import threading
import time
import sys

PORT = $PORT
HEALTH_STATUS = {'status': 'UP'}

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/actuator/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(HEALTH_STATUS).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Mock Spring Boot Application')
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def log_message(self, format, *args):
        # This suppresses the default server log messages
        return

with socketserver.TCPServer(('', PORT), HealthHandler) as httpd:
    print(f'Mock Spring Boot server started at http://localhost:{PORT}')
    print(f'Health endpoint available at http://localhost:{PORT}/actuator/health')
    print('Press Ctrl+C to stop the server')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\\nShutting down server...')
        httpd.shutdown()
" &

# Store the PID of the Python server
echo $! > .mock-spring-boot.pid
echo "Mock Spring Boot application started with PID $(cat .mock-spring-boot.pid)"
echo "Press Ctrl+C to stop the server"

# Handle shutdown gracefully
trap 'kill $(cat .mock-spring-boot.pid) > /dev/null 2>&1; rm .mock-spring-boot.pid; echo "Mock Spring Boot application stopped."; exit 0' SIGINT

# Keep script running
while true; do
    sleep 1
done
