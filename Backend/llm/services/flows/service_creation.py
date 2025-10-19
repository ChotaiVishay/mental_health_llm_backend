# llm/services/service_creation.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, validator

# Single source of truth for enums (use these in your frontend dropdowns too)
LEVELS = ["Self management","Low intensity","Moderate intensity","High intensity","Specialist"]
DELIVERY = ["In person","Online","Outreach","Both"]
WORKFORCE = ["Medical","Peer worker ","Tertiary qualified", "Vocationally qualified"]
REFERRAL = ["Doctor/GP referral","Free call","General bookings","Varies depending on service"]
COST = ["Free","Paid","N/A"]

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
    email: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    wait_time: Optional[str] = None
    opening_hours_24_7: Optional[bool] = False
    opening_hours_standard: Optional[bool] = False
    opening_hours_extended: Optional[bool] = False
    op_hours_extended_details: Optional[str] = None

    referral_pathway: str
    cost: str
    target_population: List[str]  # from multiselect
    level_of_care: Optional[str] = None
    # eligibility_and_description: Optional[str] = None
    workforce_type: str

    @validator("postcode")
    def postcode_digits(cls, v):
        v = v.strip()
        if not v.isdigit() or not (3 <= len(v) <= 4):
            raise ValueError("Postcode must be 3-4 digits")
        return v

    @validator("level_of_care")
    def valid_level(cls, v):
        if v not in LEVELS:
            raise ValueError(f"level_of_care must be one of {LEVELS}")
        return v

    @validator("delivery_method")
    def valid_delivery(cls, v):
        if v not in DELIVERY:
            raise ValueError(f"delivery_method must be one of {DELIVERY}")
        return v
    
    @validator("workforce_type")
    def valid_workforce(cls, v):
        if v not in WORKFORCE:
            raise ValueError(f"workforce_type must be one of {WORKFORCE}")
        return v

    @validator("cost")
    def valid_cost(cls, v):
        if v not in COST:
            raise ValueError(f"cost must be one of {COST}")
        return v
    
    @validator("referral_pathway")
    def valid_referral_pathway(cls, v):
        if v not in REFERRAL:
            raise ValueError(f"referral_pathway must be one of {REFERRAL}")
        return v


def prepare_payload(form: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate + normalize incoming form to your staging_services columns.
    """
    # Normalize keys coming from the form (ensure snake_case)
    normalized = { 
        **form,
        "level_of_care": form.get("level_of_care") or form.get("Level of care"),
    }

    draft = ServiceDraft(**normalized)  # raises if invalid

    # Flatten lists for simple text columns (or keep as arrays if using JSONB)
    target_population = draft.target_population or []
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
        "target_population": ", ".join(target_population),  # change if JSONB
        # "eligibility_and": draft.eligibility_and_description,
        "expected_wait_time": draft.wait_time,
        "notes": draft.notes,
    }