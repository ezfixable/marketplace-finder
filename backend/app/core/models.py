from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class Filters(BaseModel):
    category: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    location: Optional[str] = None
    radius: Optional[int] = 25
    condition: Optional[str] = "Any"
    date_range: Optional[str] = "any"  # any|last_24h|last_3d|last_7d

class SavedSearch(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    query: str
    filters: Filters
    notifications_enabled: bool = True
    notifications: Dict[str, bool] = {"email": False, "push": False}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Listing(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    marketplace_id: str
    title: str
    price: float
    city: str
    category: str
    image_url: str
    url: str
    published_at: datetime
    condition: Optional[str] = None

class SearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    location: Optional[str] = None
    radius: Optional[int] = 25
    condition: Optional[str] = "Any"
    date_range: Optional[str] = "any"
    sort_by: Optional[str] = "date_desc"

class AuthStatus(BaseModel):
    authenticated: bool
    message: str
