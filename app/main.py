from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import drones

# FastAPI 애플리케이션 초기화
app = FastAPI()

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://dronekit.vandi.kr"],  # 프론트엔드 개발 서버
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 드론 관련 라우터를 애플리케이션에 포함
app.include_router(drones.router)

# 추가적인 미들웨어나 시작 이벤트를 여기에 추가할 수 있음