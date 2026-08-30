from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app import agent  # Imports your powerful scraping script!

app = FastAPI()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# ... your other imports ...

app = FastAPI()

# --- ADD THIS CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This allows any frontend to connect. You can restrict it later!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------

# ... the rest of your routes ...
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TargetPayload(BaseModel):
    entity_name: str
    coordinates: str  # We will treat the coordinates as the URL to scrape

@app.post("/api/deploy")
def deploy_sentinel(payload: TargetPayload):
    print(f"🚀 Launching Sentinel against {payload.entity_name} at {payload.coordinates}")
    
    # Run your Playwright scraper on the provided URL
    intel_data = agent.scan_single_target(payload.coordinates)
    
    # Format the data so it looks good on the Next.js dashboard
    if not intel_data:
        final_intel_string = f"No hackathons detected at {payload.coordinates}."
    elif "error" in intel_data[0]:
        final_intel_string = f"Mission failed: {intel_data[0]['error']}"
    else:
        # Combine all found hackathons into a readable summary
        findings = [f"{item.get('title')} ({item.get('prize_pool', 'No prize listed')})" for item in intel_data]
        final_intel_string = f"Success! Intercepted {len(findings)} target(s): " + " | ".join(findings)

    return {
        "status": "success",
        "data": {
            "intel": final_intel_string
        }
    }