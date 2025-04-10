from fastapi import FastAPI
from app.routers import drones

# FastAPI 애플리케이션 초기화
app = FastAPI()

# 드론 관련 라우터를 애플리케이션에 포함
app.include_router(drones.router)

# 추가적인 미들웨어나 시작 이벤트를 여기에 추가할 수 있음