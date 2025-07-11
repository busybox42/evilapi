#!/usr/bin/env python3
import sys
import json
import socket
import ssl
import datetime
import re
import traceback
from urllib.parse import urlparse

def is_ssl_or_starttls_port(port):
    ssl_ports = [443, 993, 995, 465]
    starttls_ports = [25, 110, 143, 587]
    return port in ssl_ports or port in starttls_ports

def is_http_port(port):
    http_ports = [80, 443, 8080, 8443]
    return port in http_ports

def check_http_redirect_to_https(host, port):
    try:
        import requests
        # Allow redirects, but set a short timeout
        response = requests.get(f"http://{host}:{port}", timeout=5, allow_redirects=True)
        
        
        # Check if it redirected to HTTPS
        if response.url.startswith("https://"):
            # Optionally, you could add a check here to ensure the HTTPS connection is valid
            # For now, just checking if it redirected to HTTPS
            return {"status": "redirects_to_https", "info": f"Redirects to {response.url}"}
        else:
            return {"status": "no_https_redirect", "info": "Does not redirect to HTTPS."}
    except requests.exceptions.Timeout:
        return {"status": "error", "info": "HTTP connection timed out."}
    except requests.exceptions.ConnectionError:
        return {"status": "error", "info": "HTTP connection failed."}
    except Exception as e:
        return {"status": "error", "info": f"An unexpected error occurred during HTTP redirect check: {e}"}

def try_starttls_connect(host, port, protocol):
    try:
        sock = socket.create_connection((host, port), timeout=5)
        if protocol == "smtp":
            # Read banner
            banner = sock.recv(4096).decode()
            if not banner.startswith("220"):
                raise Exception(f"SMTP banner not received: {banner.strip()}")
            sock.sendall(b"EHLO example.com\r\n")
            ehlo_response = sock.recv(4096).decode()
            if "STARTTLS" not in ehlo_response:
                raise Exception("STARTTLS not supported by SMTP server")
            sock.sendall(b"STARTTLS\r\n")
            starttls_response = sock.recv(4096).decode()
            if not starttls_response.startswith("220"):
                raise Exception(f"STARTTLS command failed: {starttls_response.strip()}")
        elif protocol == "imap":
            banner = sock.recv(4096).decode()
            if not banner.startswith("* OK"):
                raise Exception(f"IMAP banner not received: {banner.strip()}")
            sock.sendall(b"A1 CAPABILITY\r\n")
            cap_response = sock.recv(4096).decode()
            if "STARTTLS" not in cap_response:
                raise Exception("STARTTLS not supported by IMAP server")
            sock.sendall(b"A2 STARTTLS\r\n")
            starttls_response = sock.recv(4096).decode()
            if not starttls_response.startswith("A2 OK"):
                raise Exception(f"STARTTLS command failed: {starttls_response.strip()}")
        elif protocol == "pop3":
            banner = sock.recv(4096).decode()
            if not banner.startswith("+OK"):
                raise Exception(f"POP3 banner not received: {banner.strip()}")
            sock.sendall(b"CAPA\r\n")
            cap_response = sock.recv(4096).decode()
            if "STLS" not in cap_response:
                raise Exception("STLS not supported by POP3 server")
            sock.sendall(b"STLS\r\n")
            starttls_response = sock.recv(4096).decode()
            if not starttls_response.startswith("+OK"):
                raise Exception(f"STLS command failed: {starttls_response.strip()}")
        else:
            raise Exception(f"Unsupported STARTTLS protocol: {protocol}")

        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        ssock = context.wrap_socket(sock, server_hostname=host)
        return ssock
    except Exception as e:
        
        raise

def check_heartbleed(host, port):

    # Real Heartbleed test (sends malicious heartbeat and checks for extra data)
    # No OpenSSL dependency
    hello = bytes.fromhex(
        "16 03 02 00 dc 01 00 00 d8 03 02 53 43 5b 90 4b 90 6b 7b"
        "c5 8c 8b 0b 3a 8d 2f 0a 21 9b 8e 09 0e 26 6b 0e 49 00 00"
        "66 c0 14 c0 0a 00 39 00 38 00 88 00 87 c0 0f c0 05 00 35"
        "00 84 c0 12 c0 08 00 16 00 13 c0 13 c0 09 00 33 00 32 00"
        "9a 00 99 00 45 00 44 c0 0e c0 04 00 2f 00 96 00 41 c0 11"
        "c0 07 c0 0c c0 02 00 05 00 04 00 15 00 12 00 09 00 14 00"
        "11 00 08 00 06 00 03 00 ff 01 00 00 49 00 0b 00 04 03 00"
        "01 02 00 0a 00 34 00 32 00 0e 00 0d 00 19 00 0b 00 0c 00"
        "18 00 09 00 0a 00 16 00 17 00 08 00 06 00 07 00 14 00 15"
        "00 04 00 05 00 12 00 13 00 01 00 02 00 03 00 0f 00 10 00"
        "11 00 23 00 00 00 0f 00 01 01"
    )
    heartbeat = bytes.fromhex(
        "18 03 02 00 03 01 40 00"
    )
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5)
        s.connect((host, port))
        s.sendall(hello)
        s.recv(4096)
        s.sendall(heartbeat)
        data = s.recv(4096)
        s.close()
        if len(data) > 7:
            return {"status": "vulnerable", "info": "Heartbleed vulnerability detected!"}
        else:
            return {"status": "not vulnerable", "info": "No Heartbleed response."}
    except socket.timeout:
        return {"status": "not vulnerable", "info": "No Heartbleed response (timeout)"}
    except Exception as e:
        return {"status": "not vulnerable", "info": f"Error or not supported: {e}"}

def check_sweet32(host, port):
    # SWEET32: vulnerable if 3DES cipher is supported
    try:
        context = ssl.create_default_context()
        context.set_ciphers('3DES')
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cipher = ssock.cipher()
                if cipher and '3DES' in cipher[0]:
                    return {"status": "potentially vulnerable", "info": f"3DES supported: {cipher[0]}"}
                else:
                    return {"status": "not vulnerable", "info": "3DES not supported"}
    except ssl.SSLError:
        return {"status": "not vulnerable", "info": "3DES not supported (handshake failed)"}
    except Exception as e:
        return {"status": "not tested", "info": f"Error: {e}"}

def check_poodle(host, port):
    try:
        import ssl, socket
        try:
            context = ssl.SSLContext(ssl.PROTOCOL_SSLv3)
        except AttributeError:
            return {"status": "not vulnerable", "info": "SSLv3 not supported by OpenSSL/Python"}
        try:
            with socket.create_connection((host, port), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=host) as ssock:
                    return {"status": "vulnerable", "info": "SSLv3 supported (POODLE)"}
        except Exception as e:
            if "WRONG_VERSION_NUMBER" in str(e) or "unsupported protocol" in str(e):
                return {"status": "not vulnerable", "info": "SSLv3 not supported by server"}
            return {"status": "not vulnerable", "info": f"SSLv3 not supported ({e})"}
    except Exception as e:
        if "SSLv3_METHOD" in str(e):
            return {"status": "not vulnerable", "info": "SSLv3 not supported by OpenSSL/Python"}
        return {"status": "not tested", "info": f"Error: {e}"}

def check_beast(host, port):
    import ssl, socket
    cbc_ciphers = [
        'AES128-SHA', 'AES256-SHA', 'DES-CBC3-SHA', 'AES128-SHA256', 'AES256-SHA256'
    ]
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLSv1)
        context.set_ciphers(':'.join(cbc_ciphers))
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cipher = ssock.cipher()
                if cipher and 'CBC' in cipher[0].upper():
                    return {"status": "vulnerable", "info": f"CBC cipher accepted: {cipher[0]}"}
                else:
                    return {"status": "not vulnerable", "info": f"No CBC cipher accepted: {cipher}"}
    except Exception as e:
        return {"status": "not vulnerable", "info": f"TLS 1.0 or CBC ciphers not supported ({e})"}

def check_crime(host, port):
    import ssl, socket
    try:
        context = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                if ssock.compression():
                    return {"status": "vulnerable", "info": f"TLS compression enabled: {ssock.compression()}"}
                else:
                    return {"status": "not vulnerable", "info": "TLS compression not enabled"}
    except Exception as e:
        if "WRONG_VERSION_NUMBER" in str(e):
            return {"status": "not_applicable", "info": f"Protocol mismatch: {e}"}
        return {"status": "error", "info": f"Error: {e}"}

def check_breach(host, port):
    if not is_http_port(port):
        return {"status": "not_applicable", "info": "BREACH check is only applicable to HTTP/HTTPS ports."}
    try:
        import requests
        url = f"https://{host}:{port}/"
        r = requests.get(url, timeout=5)
        encoding = r.headers.get('Content-Encoding', '')
        if 'gzip' in encoding or 'deflate' in encoding:
            return {"status": "vulnerable", "info": f"HTTP compression enabled: {encoding}"}
        else:
            return {"status": "not vulnerable", "info": f"No HTTP compression: {encoding}"}
    except Exception as e:
        return {"status": "error", "info": f"Error: {e}"}

def check_freak(host, port):
    import ssl, socket
    try:
        context = ssl.create_default_context()
        try:
            context.set_ciphers('EXP-RC4-MD5:EXP-RC2-CBC-MD5:EXP-DES-CBC-SHA:EXP-RSA-DES-CBC-SHA')
        except ssl.SSLError as e:
            if "No cipher can be selected" in str(e):
                return {"status": "not vulnerable", "info": "Export ciphers not supported by OpenSSL/Python"}
            raise
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cipher = ssock.cipher()
                if cipher and 'EXP' in cipher[0]:
                    return {"status": "vulnerable", "info": f"Export cipher accepted: {cipher[0]}"}
                else:
                    return {"status": "not vulnerable", "info": f"No export cipher accepted: {cipher}"}
    except Exception as e:
        if "No cipher can be selected" in str(e):
            return {"status": "not vulnerable", "info": "Export ciphers not supported by OpenSSL/Python"}
        return {"status": "not vulnerable", "info": f"Export ciphers not supported ({e})"}

def check_logjam(host, port):
    import ssl, socket
    try:
        context = ssl.create_default_context()
        try:
            context.set_ciphers('EXP-EDH-RSA-DES-CBC-SHA:EXP-EDH-DSS-DES-CBC-SHA')
        except ssl.SSLError as e:
            if "No cipher can be selected" in str(e):
                return {"status": "not vulnerable", "info": "Export DH ciphers not supported by OpenSSL/Python"}
            raise
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cipher = ssock.cipher()
                if cipher and 'EXP' in cipher[0]:
                    return {"status": "vulnerable", "info": f"Export DH cipher accepted: {cipher[0]}"}
                else:
                    return {"status": "not vulnerable", "info": f"No export DH cipher accepted: {cipher}"}
    except Exception as e:
        if "No cipher can be selected" in str(e):
            return {"status": "not vulnerable", "info": "Export DH ciphers not supported by OpenSSL/Python"}
        return {"status": "not vulnerable", "info": f"Export DH ciphers not supported ({e})"}

def check_drown(host, port):
    try:
        from OpenSSL import SSL
        import socket
        if not hasattr(SSL, 'SSLv2_METHOD'):
            return {"status": "not vulnerable", "info": "SSLv2 not supported by OpenSSL/Python"}
        ctx = SSL.Context(SSL.SSLv2_METHOD)
        sock = socket.socket()
        sock.settimeout(5)
        sock.connect((host, port))
        ssl_sock = SSL.Connection(ctx, sock)
        ssl_sock.set_connect_state()
        ssl_sock.do_handshake()
        ssl_sock.close()
        sock.close()
        return {"status": "vulnerable", "info": "SSLv2 supported (DROWN)"}
    except Exception as e:
        if "SSLv2_METHOD" in str(e):
            return {"status": "not vulnerable", "info": "SSLv2 not supported by OpenSSL/Python"}
        return {"status": "not vulnerable", "info": f"SSLv2 not supported ({e})"}

def check_robot(host, port):
    import ssl, socket
    try:
        context = ssl.create_default_context()
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                cipher = ssock.cipher()
                if cipher and 'RSA' in cipher[0]:
                    return {"status": "potentially vulnerable", "info": f"RSA key exchange supported: {cipher[0]}"}
                else:
                    return {"status": "not vulnerable", "info": f"No RSA key exchange: {cipher}"}
    except Exception as e:
        if "WRONG_VERSION_NUMBER" in str(e):
            return {"status": "not_applicable", "info": f"Protocol mismatch: {e}"}
        return {"status": "error", "info": f"Error: {e}"}

def check_ticketbleed(host, port):
    import ssl, socket
    try:
        context = ssl.create_default_context()
        context.options &= ~ssl.OP_NO_TICKET  # Enable session tickets
        with socket.create_connection((host, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=host) as ssock:
                if hasattr(ssock, 'session') and ssock.session:
                    return {"status": "potentially vulnerable", "info": "Session tickets supported (cannot test leakage in stdlib)"}
                else:
                    return {"status": "not vulnerable", "info": "Session tickets not supported"}
    except Exception as e:
        if "WRONG_VERSION_NUMBER" in str(e):
            return {"status": "not_applicable", "info": f"Protocol mismatch: {e}"}
        return {"status": "error", "info": f"Error: {e}"}

def detect_protocols_and_ciphers(host, port):
    if not is_ssl_or_starttls_port(port):
        return [], 0, {"status": "not_applicable", "info": "Port is not a standard SSL/TLS or STARTTLS port."}

    protocols = []
    cipher_strengths = []
    protocol_versions = [
        ("TLSv1.3", ssl.PROTOCOL_TLS_CLIENT),
        ("TLSv1.2", ssl.PROTOCOL_TLSv1_2),
        ("TLSv1.1", ssl.PROTOCOL_TLSv1_1),
        ("TLSv1.0", ssl.PROTOCOL_TLSv1),
    ]
    
    # Common STARTTLS ports and their associated protocols
    starttls_ports = {
        25: "smtp",
        143: "imap",
        110: "pop3",
        587: "smtp",
    }

    for name, proto in protocol_versions:
        ssock = None
        try:
            context = ssl.SSLContext(proto)
            if port in starttls_ports:
                # Attempt STARTTLS
                try:
                    ssock = try_starttls_connect(host, port, starttls_ports[port])
                except Exception:
                    # If STARTTLS fails, do not fall back to direct SSL for known STARTTLS ports
                    continue
            else:
                # Direct SSL/TLS connection
                sock = socket.create_connection((host, port), timeout=5)
                ssock = context.wrap_socket(sock, server_hostname=host)

            if ssock:
                protocols.append(name)
                cipher = ssock.cipher()
                if cipher:
                    cipher_strengths.append(cipher[2])
                ssock.close()
        except Exception:
            if ssock:
                ssock.close()
            continue
    return protocols, max(cipher_strengths) if cipher_strengths else 0, {"status": "success", "info": "Protocol detection completed."}

def get_cert_info(host, port):
    try:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        ssock = None
        
        # Common STARTTLS ports
        starttls_ports = {
            25: "smtp",
            143: "imap",
            110: "pop3",
            587: "smtp",
        }

        if not is_ssl_or_starttls_port(port):
            return {"status": "not_applicable", "info": "Port is not a standard SSL/TLS or STARTTLS port."}

        if port in starttls_ports:
            try:
                ssock = try_starttls_connect(host, port, starttls_ports[port])
            except Exception as e:
                
                return {"error": f"STARTTLS connection failed: {e}", "valid": False}
        else:
            # Direct SSL/TLS connection
            try:
                sock = socket.create_connection((host, port), timeout=5)
                context = ssl.create_default_context(ssl.Purpose.SERVER_AUTH)
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                ssock = context.wrap_socket(sock, server_hostname=host)
            except Exception as e:
                
                return {"error": f"Could not establish SSL/TLS connection: {e}", "valid": False}

        if ssock:
            cert = ssock.getpeercert()
            not_after = cert.get('notAfter')
            not_before = cert.get('notBefore')
            subject = cert.get('subject')
            issuer = cert.get('issuer')
            now = datetime.datetime.utcnow()
            valid = True
            if not_after:
                exp = datetime.datetime.strptime(not_after, '%b %d %H:%M:%S %Y %Z')
                if exp < now:
                    valid = False
            if not_before:
                start = datetime.datetime.strptime(not_before, '%b %d %H:%M:%S %Y %Z')
                if start > now:
                    valid = False
            ssock.close()
            return {
                "subject": subject,
                "issuer": issuer,
                "not_before": not_before,
                "not_after": not_after,
                "valid": valid
            }
        else:
            return {"error": "Could not establish SSL/TLS connection", "valid": False}
    except Exception as e:
        
        return {"error": str(e), "valid": False}

def compute_ssl_grade(results, cert_info, protocol_support, cipher_strength, port, http_redirect_status=None, https_redirect_results=None):
    grade = "A"
    reasons = []

    # If it's not an SSL/STARTTLS port and not an HTTP port, it's an F by default
    if not is_ssl_or_starttls_port(port) and not is_http_port(port):
        grade = "F"
        reasons.append("Port is not a standard SSL/TLS or HTTP port and does not provide a secure service.")
        return {"grade": grade, "reasons": reasons}

    is_ssl_relevant = is_ssl_or_starttls_port(port)

    # If cert_info is not applicable, don't penalize the grade and mark as not SSL relevant
    if cert_info and cert_info.get("status") == "not_applicable":
        pass
    elif cert_info and not cert_info.get("valid", True):
        grade = "F"
        reasons.append("Certificate invalid/expired")

    # If protocol_detection is not applicable, don't penalize the grade and mark as not SSL relevant
    if results.get("protocol_detection_status", {}).get("status") == "not_applicable":
        pass

    # Handle HTTP redirect status for port 80
    if port == 80:
        if http_redirect_status:
            if http_redirect_status.get("status") == "redirects_to_https":
                # If it redirects to HTTPS, grade based on the HTTPS scan results
                if https_redirect_results:
                    https_grade_info = compute_ssl_grade(https_redirect_results, https_redirect_results.get("cert_info"), https_redirect_results.get("protocol_support", []), https_redirect_results.get("cipher_strength", 0), 443) # Pass 443 as port for recursive call
                    grade = https_grade_info["grade"]
                    reasons.extend(https_grade_info["reasons"])
                    reasons.append(f"HTTP redirects to HTTPS. Grade based on {http_redirect_status.get("info")}")
                else:
                    grade = "F"
                    reasons.append("HTTP redirects to HTTPS, but secondary HTTPS scan failed.")
            elif http_redirect_status.get("status") == "no_https_redirect":
                grade = "F"
                reasons.append("HTTP does not redirect to HTTPS.")
            elif http_redirect_status.get("status") == "error":
                grade = "F"
                reasons.append(f"HTTP redirect check failed: {http_redirect_status.get("info")}")

    if is_ssl_relevant:
        # If SSL/TLS is relevant but no protocols were detected and cert info has an error, it's an F
        if not protocol_support and cert_info and cert_info.get("error") and grade != "F":
            grade = "F"
            reasons.append("Failed to establish SSL/TLS connection on a relevant port.")

        # Protocol support
        if protocol_support:
            if "SSLv3" in protocol_support or "SSLv2" in protocol_support:
                if grade != "F":
                    grade = "C"
                    reasons.append("Supports SSLv2/v3")
            elif "TLSv1.0" in protocol_support or "TLSv1.1" in protocol_support:
                if grade == "A":
                    grade = "B"
                    reasons.append("Supports TLS 1.0/1.1")
        # Cipher strength
        if cipher_strength and cipher_strength < 128:
            if grade != "F":
                grade = "C"
                reasons.append("Weak cipher strength (<128 bits)")

    # Critical vulns = F
    for vuln in ["Heartbleed", "DROWN", "POODLE", "FREAK", "LOGJAM", "ROBOT", "Ticketbleed"]:
        if results.get(vuln, {}).get("status") == "vulnerable":
            grade = "F"
            reasons.append(f"Critical: {vuln}")
    
    # Major issues = C
    for vuln in ["BEAST", "SWEET32", "CRIME", "BREACH"]:
        if results.get(vuln, {}).get("status") == "vulnerable":
            if grade != "F":
                grade = "C"
                reasons.append(f"Weak: {vuln}")

    return {"grade": grade, "reasons": reasons}

def main():
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: ssl_vuln_scanner.py host port"}))
        sys.exit(1)
    host = sys.argv[1]
    port = int(sys.argv[2])
    results = {}
    results["Heartbleed"] = check_heartbleed(host, port)
    results["POODLE"] = check_poodle(host, port)
    results["BEAST"] = check_beast(host, port)
    results["CRIME"] = check_crime(host, port)
    results["BREACH"] = check_breach(host, port)
    results["FREAK"] = check_freak(host, port)
    results["LOGJAM"] = check_logjam(host, port)
    results["DROWN"] = check_drown(host, port)
    results["ROBOT"] = check_robot(host, port)
    results["SWEET32"] = check_sweet32(host, port)
    results["Ticketbleed"] = check_ticketbleed(host, port)

    http_redirect_status = None
    https_redirect_results = {}

    # New: HTTP redirect check for port 80
    if port == 80:
        http_redirect_status = check_http_redirect_to_https(host, port)
        results["http_redirect_status"] = http_redirect_status
        if http_redirect_status.get("status") == "redirects_to_https":
            redirect_url = http_redirect_status.get("info").split("Redirects to ")[1]
            parsed_url = urlparse(redirect_url)
            redirect_host = parsed_url.hostname
            redirect_port = parsed_url.port if parsed_url.port else 443 # Default to 443 for HTTPS

            # Perform a full SSL scan on the redirected HTTPS endpoint
            https_redirect_results["Heartbleed"] = check_heartbleed(redirect_host, redirect_port)
            https_redirect_results["POODLE"] = check_poodle(redirect_host, redirect_port)
            https_redirect_results["BEAST"] = check_beast(redirect_host, redirect_port)
            https_redirect_results["CRIME"] = check_crime(redirect_host, redirect_port)
            https_redirect_results["BREACH"] = check_breach(redirect_host, redirect_port)
            https_redirect_results["FREAK"] = check_freak(redirect_host, redirect_port)
            https_redirect_results["LOGJAM"] = check_logjam(redirect_host, redirect_port)
            https_redirect_results["DROWN"] = check_drown(redirect_host, redirect_port)
            https_redirect_results["ROBOT"] = check_robot(redirect_host, redirect_port)
            https_redirect_results["SWEET32"] = check_sweet32(redirect_host, redirect_port)
            https_redirect_results["Ticketbleed"] = check_ticketbleed(redirect_host, redirect_port)

            try:
                https_protocol_support, https_cipher_strength, https_protocol_detection_status = detect_protocols_and_ciphers(redirect_host, redirect_port)
                https_redirect_results["protocol_support"] = https_protocol_support
                https_redirect_results["cipher_strength"] = https_cipher_strength
                https_redirect_results["protocol_detection_status"] = https_protocol_detection_status
            except Exception as e:
                https_redirect_results["protocol_detection_error"] = {"status": "error", "info": f"Protocol detection failed for redirected HTTPS: {e}"}

            try:
                https_cert_info = get_cert_info(redirect_host, redirect_port)
                https_redirect_results["cert_info"] = https_cert_info
            except Exception as e:
                https_redirect_results["cert_info_error"] = {"error": str(e), "valid": False}

    # New: protocol/cipher/cert info
    try:
        protocol_support, cipher_strength, protocol_detection_status = detect_protocols_and_ciphers(host, port)
        if protocol_detection_status and protocol_detection_status.get("status") == "not_applicable":
            results["protocol_detection_status"] = protocol_detection_status
    except Exception as e:
        protocol_support = []
        cipher_strength = 0
        results["protocol_detection_error"] = {"status": "error", "info": f"Protocol detection failed: {e}"}

    try:
        cert_info = get_cert_info(host, port)
        if cert_info and cert_info.get("status") == "not_applicable":
            results["cert_info_status"] = cert_info
    except Exception as e:
        cert_info = {"error": str(e), "valid": False}
        results["cert_info_error"] = {"status": "error", "info": f"Certificate information retrieval failed: {e}"}
    grade_info = compute_ssl_grade(results, cert_info, protocol_support, cipher_strength, port, http_redirect_status, https_redirect_results)
    output = {
        "results": results,
        "protocol_support": protocol_support,
        "cipher_strength": cipher_strength,
        "cert_info": cert_info,
        "grade": grade_info["grade"],
        "grade_breakdown": grade_info["reasons"]
    }
    print(json.dumps(output))

if __name__ == "__main__":
    main()
