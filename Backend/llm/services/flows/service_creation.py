from __future__ import annotations

from datetime import datetime, timezone
import re
from typing import Optional, List, Dict, Any

import structlog
from pydantic import BaseModel, EmailStr, validator

from ...core.database.supabase_only import get_supabase_db

logger = structlog.get_logger(__name__)

# Single source of truth for enums (use these in your frontend dropdowns too)
LEVELS = ["Self management", "Low intensity", "Moderate intensity", "High intensity", "Specialist"]
DELIVERY = ["In person", "Online", "Outreach", "Both"]
WORKFORCE = ["Medical", "Peer worker", "Tertiary qualified", "Vocationally qualified"]
REFERRAL = ["Doctor/GP referral", "Free call", "General bookings", "Varies depending on service"]
COST = ["Free", "Paid", "N/A"]
SERVICE_TYPES = [
    "Mental health promotion",
    "Mental illness prevention",
    "Primary and specialised clinical ambulatory mental health care services",
    "Specialised mental health community support services",
    "Specialised bed-based mental health care services",
    "Medications and procedures",
]
TARGET_POPULATIONS = [
    "Adults",
    "Young people",
    "Children",
    "LGBTQIA+",
    "Aboriginal and Torres Strait Islander",
    "Culturally and Linguistically Diverse",
    "International students",
    "First responders",
    "Carers and families",
    "Rural and remote communities",
    "People experiencing homelessness",
    "People living with disability",
]

SERVICE_FORM_OPTION_SETS: Dict[str, List[str]] = {
    "delivery_method": DELIVERY,
    "level_of_care": LEVELS,
    "referral_pathway": REFERRAL,
    "workforce_type": WORKFORCE,
    "cost": COST,
    "service_type": SERVICE_TYPES,
    "target_population": TARGET_POPULATIONS,
    "state": [
        "ACT",
        "NSW",
        "NT",
        "QLD",
        "SA",
        "TAS",
        "VIC",
        "WA",
    ],
}

SERVICE_FORM_FIELDS: List[Dict[str, Any]] = [
    {"id": "service_name", "label": "Service name", "required": True, "control": "text"},
    {"id": "organisation_name", "label": "Organisation name", "required": True, "control": "text"},
    {"id": "campus_name", "label": "Location or campus name", "required": True, "control": "text"},
    {"id": "region_name", "label": "Region", "required": True, "control": "text"},
    {
        "id": "service_type",
        "label": "Service types",
        "required": True,
        "control": "multiselect",
        "optionsKey": "service_type",
    },
    {
        "id": "delivery_method",
        "label": "Delivery method",
        "required": True,
        "control": "select",
        "optionsKey": "delivery_method",
    },
    {
        "id": "level_of_care",
        "label": "Level of care",
        "required": True,
        "control": "select",
        "optionsKey": "level_of_care",
    },
    {"id": "address", "label": "Street address", "required": True, "control": "text"},
    {"id": "suburb", "label": "Suburb / town", "required": True, "control": "text"},
    {
        "id": "state",
        "label": "State / territory",
        "required": True,
        "control": "select",
        "optionsKey": "state",
    },
    {"id": "postcode", "label": "Postcode", "required": True, "control": "text"},
    {"id": "phone", "label": "Phone number", "control": "text"},
    {"id": "email", "label": "Email", "control": "text"},
    {"id": "website", "label": "Website", "control": "text"},
    {
        "id": "referral_pathway",
        "label": "Referral pathway",
        "required": True,
        "control": "select",
        "optionsKey": "referral_pathway",
    },
    {
        "id": "cost",
        "label": "Cost",
        "required": True,
        "control": "select",
        "optionsKey": "cost",
    },
    {
        "id": "target_population",
        "label": "Target population",
        "required": True,
        "control": "multiselect",
        "optionsKey": "target_population",
    },
    {
        "id": "workforce_type",
        "label": "Workforce type",
        "required": True,
        "control": "select",
        "optionsKey": "workforce_type",
    },
    {"id": "expected_wait_time", "label": "Expected wait time", "control": "text"},
    {"id": "opening_hours_24_7", "label": "Open 24/7", "control": "checkbox"},
    {"id": "opening_hours_standard", "label": "Open during standard business hours", "control": "checkbox"},
    {"id": "opening_hours_extended", "label": "Offer extended hours", "control": "checkbox"},
    {
        "id": "op_hours_extended_details",
        "label": "Extended hours details",
        "control": "textarea",
    },
    {"id": "notes", "label": "Additional notes", "control": "textarea"},
]


def _normalize_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        parts = re.split(r"[,;\n]", value)
        return [part.strip() for part in parts if part and part.strip()]
    if isinstance(value, (list, tuple, set)):
        return [str(item).strip() for item in value if str(item).strip()]
    return [str(value).strip()]


def _normalize_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y", "on"}
    return False


def _strip(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


class ServiceDraft(BaseModel):
    service_name: str
    organisation_name: str
    campus_name: str
    region_name: str

    service_type: List[str]
    delivery_method: str
    level_of_care: str

    address: str
    suburb: str
    state: str
    postcode: str

    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    wait_time: Optional[str] = None
    opening_hours_24_7: bool = False
    opening_hours_standard: bool = False
    opening_hours_extended: bool = False
    op_hours_extended_details: Optional[str] = None

    referral_pathway: str
    cost: str
    target_population: List[str]
    workforce_type: str

    @validator("postcode")
    def postcode_digits(cls, value: str) -> str:
        value = value.strip()
        if not value.isdigit() or not (3 <= len(value) <= 4):
            raise ValueError("Postcode must be 3-4 digits")
        return value

    @validator("level_of_care")
    def valid_level(cls, value: str) -> str:
        if value not in LEVELS:
            raise ValueError(f"level_of_care must be one of {LEVELS}")
        return value

    @validator("delivery_method")
    def valid_delivery(cls, value: str) -> str:
        if value not in DELIVERY:
            raise ValueError(f"delivery_method must be one of {DELIVERY}")
        return value

    @validator("workforce_type")
    def valid_workforce(cls, value: str) -> str:
        if value not in WORKFORCE:
            raise ValueError(f"workforce_type must be one of {WORKFORCE}")
        return value

    @validator("cost")
    def valid_cost(cls, value: str) -> str:
        if value not in COST:
            raise ValueError(f"cost must be one of {COST}")
        return value

    @validator("referral_pathway")
    def valid_referral_pathway(cls, value: str) -> str:
        if value not in REFERRAL:
            raise ValueError(f"referral_pathway must be one of {REFERRAL}")
        return value


def prepare_payload(form: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and normalize incoming form data for storage.
    """
    normalised: Dict[str, Any] = {
        **form,
        "level_of_care": form.get("level_of_care") or form.get("Level of care"),
        "service_type": _normalize_list(form.get("service_type")),
        "target_population": _normalize_list(form.get("target_population")),
        "phone": _strip(form.get("phone")),
        "email": _strip(form.get("email")),
        "website": _strip(form.get("website")),
        "notes": _strip(form.get("notes")),
        "wait_time": _strip(form.get("expected_wait_time") or form.get("wait_time")),
        "op_hours_extended_details": _strip(form.get("op_hours_extended_details")),
        "opening_hours_24_7": _normalize_bool(form.get("opening_hours_24_7")),
        "opening_hours_standard": _normalize_bool(form.get("opening_hours_standard")),
        "opening_hours_extended": _normalize_bool(form.get("opening_hours_extended")),
    }

    draft = ServiceDraft(**normalised)  # raises if invalid

    return {
        "service_name": draft.service_name,
        "organisation_name": draft.organisation_name,
        "campus_name": draft.campus_name,
        "region_name": draft.region_name,
        "service_type": draft.service_type,
        "delivery_method": draft.delivery_method,
        "level_of_care": draft.level_of_care,
        "address": draft.address,
        "suburb": draft.suburb,
        "state": draft.state,
        "postcode": draft.postcode,
        "phone": draft.phone,
        "email": draft.email,
        "website": draft.website,
        "opening_hours_24_7": draft.opening_hours_24_7,
        "opening_hours_standard": draft.opening_hours_standard,
        "opening_hours_extended": draft.opening_hours_extended,
        "op_hours_extended_details": draft.op_hours_extended_details,
        "referral_pathway": draft.referral_pathway,
        "cost": draft.cost,
        "target_population": draft.target_population,
        "expected_wait_time": draft.wait_time,
        "notes": draft.notes,
    }


async def submit_service_form(form: Dict[str, Any], session_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Validate a submitted service form, persist it for review, and return the cleaned payload.
    """
    payload = prepare_payload(form)

    supabase = await get_supabase_db()
    storage_record = {
        **payload,
        "service_type": ", ".join(payload["service_type"]),
        "target_population": ", ".join(payload["target_population"]),
        "session_id": session_id,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        supabase.http_client.post(
            f"{supabase.settings.supabase_url}/rest/v1/service_submission_requests",
            headers=supabase._get_headers(),  # noqa: SLF001
            json=storage_record,
        ).raise_for_status()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to persist service submission draft", error=str(exc))

    return payload


def build_service_form_prompt() -> Dict[str, Any]:
    required_labels = "\n".join(
        f"- {field['label']}" for field in SERVICE_FORM_FIELDS if field.get("required")
    )
    options_summary = "\n".join(
        f"- {label}: {', '.join(options)}"
        for label, options in [
            ("Delivery method", DELIVERY),
            ("Level of care", LEVELS),
            ("Referral pathway", REFERRAL),
            ("Workforce type", WORKFORCE),
            ("Cost", COST),
        ]
    )
    message = (
        "Thanks for helping us add a new mental health service. I can submit the details to our directory once I have "
        "the required information.\n\n"
        "Please share the following required details (you can provide them one at a time or paste them together):\n"
        f"{required_labels}\n\n"
        "Optional details are welcome too, such as phone, email, website, notes or expected wait time.\n\n"
        "When you supply values for the dropdown or checkbox fields, please choose from:\n"
        f"- Service types: {', '.join(SERVICE_TYPES)}\n"
        f"- Target population: {', '.join(TARGET_POPULATIONS)}\n"
        f"{options_summary}\n\n"
        "Ready when you are — I have opened the service form so you can enter these details now."
    )
    action = {
        "type": "collect_service_details",
        "fields": SERVICE_FORM_FIELDS,
        "option_sets": SERVICE_FORM_OPTION_SETS,
    }
    return {"message": message, "action": action}
