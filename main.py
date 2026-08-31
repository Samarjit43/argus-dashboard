from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app import agent # Imports your scraping script

app = FastAPI()

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TargetPayload(BaseModel):
    entity_name: str
    coordinates: str  # URL to scrape


@app.get("/")
def read_root():
    return {"status": "Argus Sentinel API is active"}


@app.post("/api/deploy")
def deploy_sentinel(payload: TargetPayload):
    print(f"🚀 Launching Sentinel against {payload.entity_name} at {payload.coordinates}")

    try:
        # Run Playwright scraper
        intel_data = agent.scan_single_target(payload.coordinates)

        # Format intel output
        if not intel_data:
            final_intel_string = f"No targets detected at {payload.coordinates}."
        elif isinstance(intel_data, list) and len(intel_data) > 0 and "error" in intel_data[0]:
            final_intel_string = f"Mission failed: {intel_data[0]['error']}"
        else:
            findings = [
                f"{item.get('title', 'Target')} ({item.get('prize_pool', 'No details listed')})"
                for item in intel_data
            ]
            final_intel_string = f"Success! Intercepted {len(findings)} target(s): " + " | ".join(findings)

        return {
            "status": "success",
            "data": {
                "intel": final_intel_string
            }
        }
        
    except Exception as e:
        # TRAP THE BUG: Catch any crash and send it to the frontend!
        error_message = f"Backend crashed: {str(e)}"
        print(f"🚨 CRASH INTERCEPTED: {error_message}")
        return {
            "status": "error",
            "detail": error_message
        }