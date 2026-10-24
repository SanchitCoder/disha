"""Upsert caregivers from ./data into Supabase (run after applying supabase/migrations/001_init.sql)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import db
from app.data_loader import load_caregivers

c = db.client()
if c is None:
    sys.exit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set")
cgs, _ = load_caregivers()
rows = [{"id": g.id, "name": g.name, "role": g.role, "skills": g.skills, "languages": g.languages, "gender": g.gender, "rating": g.rating,
         "review_count": g.review_count, "lat": g.lat, "lng": g.lng, "max_radius_km": g.max_radius_km, "active": g.active, "tier": g.tier,
         "qualification": g.qualification, "experience_years": g.experience_years, "base_area": g.base_area,
         "free_from": g.free_from.strftime("%H:%M") if g.free_from else None, "free_until": g.free_until.strftime("%H:%M") if g.free_until else None}
        for g in cgs]
c.table("caregivers").upsert(rows).execute()
print(f"upserted {len(rows)} caregivers")
