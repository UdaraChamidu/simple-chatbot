from fastapi import Request

def get_real_ip(request: Request) -> str:
    """
    Extracts the client's real IP address from headers.
    Prioritizes 'X-Forwarded-For' for proxy scenarios.
    """
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # X-Forwarded-For can be a list: "client_ip, proxy1, proxy2"
        # We want the first one.
        ip = x_forwarded_for.split(",")[0].strip()
        return ip
    return request.client.host or "0.0.0.0"