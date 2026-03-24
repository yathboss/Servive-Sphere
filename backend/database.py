import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Make sure to handle both sync and async URLs gracefully for testing vs docker
# In docker-compose we pass DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./servicesphere.db")

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
