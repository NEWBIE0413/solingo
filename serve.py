#!/usr/bin/env python3
"""Static server for Solingo. Same as `python -m http.server`, plus Cache-Control: no-cache so a
phone's home-screen web app always revalidates instead of keeping last week's app.js."""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, f, *a): sys.stderr.write("%s %s\n" % (self.address_string(), f % a))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
port=int(os.environ.get('PORT', 8765))
ThreadingHTTPServer(('0.0.0.0', port), H).serve_forever()
