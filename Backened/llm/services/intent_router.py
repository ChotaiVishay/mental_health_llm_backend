from typing import Literal

Intent = Literal["add_service", "query_services", "other"]

ADD_KEYWORDS = [
    "add new service", "add a service", "add service",
    "create service", "insert service", "submit service"
]

def detect_intent(user_text: str) -> Intent:
    t = (user_text or "").strip().lower()
    for k in ADD_KEYWORDS:
        if k in t:
            return "add_service"
    # Very naive: if it mentions 'add' + 'service' in any order
    if "add" in t and "service" in t:
        return "add_service"
    # Default to search/query
    return "query_services"