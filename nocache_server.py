#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver

PORT = 8000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers to prevent caching
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Add file path to log message for debugging
        print(f"{self.address_string()} - {args[0]} {args[1]} {args[2]} - {self.path}")

if __name__ == '__main__':
    print(f"Starting non-caching HTTP server at port {PORT}")
    print("Press Ctrl+C to stop the server")
    print("All browser caching has been disabled - files will always be served fresh")
    
    with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown() 