from fastapi import APIRouter
from app.api.v1.profiles import router as profiles_router
from app.api.v1.missions import router as missions_router
from app.api.v1.health_records import router as health_records_router
from app.api.v1.symptoms import router as symptoms_router, alias_router as symptoms_alias_router
from app.api.v1.checklists import router as checklists_router, alias_router as checklists_alias_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.playbooks import router as playbooks_router

api_v1_router = APIRouter()
api_v1_router.include_router(profiles_router)
api_v1_router.include_router(missions_router)
api_v1_router.include_router(health_records_router)
api_v1_router.include_router(symptoms_router)
api_v1_router.include_router(symptoms_alias_router)
api_v1_router.include_router(checklists_router)
api_v1_router.include_router(checklists_alias_router)
api_v1_router.include_router(assessments_router)
api_v1_router.include_router(playbooks_router)
