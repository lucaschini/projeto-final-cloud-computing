import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Path, Query
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pydantic import BaseModel, Field

DATABASE_URL = os.environ["DATABASE_URL"]

# Teto por sincronização: o front envia a cada ~5s; isso dá folga para
# vários upgrades sem permitir mandar milhões de bananas de uma vez.
MAX_CLICKS_PER_SYNC = 500
MAX_BANANAS_PER_SYNC = 50_000

USERNAME_PATTERN = r"^[A-Za-z0-9_]{3,20}$"

pool = ConnectionPool(DATABASE_URL, open=False, kwargs={"row_factory": dict_row})


@asynccontextmanager
async def lifespan(_: FastAPI):
    pool.open(wait=True)
    yield
    pool.close()


app = FastAPI(title="Bananaverso API", lifespan=lifespan)


class NewPlayer(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)


class Progress(BaseModel):
    clicks: int = Field(ge=0, le=MAX_CLICKS_PER_SYNC)
    bananas: int = Field(ge=0, le=MAX_BANANAS_PER_SYNC)


Username = Path(pattern=USERNAME_PATTERN)

PLAYER_COLUMNS = "username, clicks, bananas, updated_at"


@app.get("/health")
def health():
    with pool.connection() as conn:
        conn.execute("SELECT 1")
    return {"status": "ok"}


@app.post("/players")
def create_or_get_player(body: NewPlayer):
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO players (username) VALUES (%s) ON CONFLICT (username) DO NOTHING",
            (body.username,),
        )
        return conn.execute(
            f"SELECT {PLAYER_COLUMNS} FROM players WHERE username = %s",
            (body.username,),
        ).fetchone()


@app.get("/players/{username}")
def get_player(username: str = Username):
    with pool.connection() as conn:
        player = conn.execute(
            f"SELECT {PLAYER_COLUMNS} FROM players WHERE username = %s", (username,)
        ).fetchone()
    if player is None:
        raise HTTPException(status_code=404, detail="Jogador não encontrado")
    return player


@app.post("/players/{username}/progress")
def add_progress(body: Progress, username: str = Username):
    with pool.connection() as conn:
        player = conn.execute(
            f"""
            INSERT INTO players (username, clicks, bananas) VALUES (%(u)s, %(c)s, %(b)s)
            ON CONFLICT (username) DO UPDATE
               SET clicks = players.clicks + EXCLUDED.clicks,
                   bananas = players.bananas + EXCLUDED.bananas,
                   updated_at = now()
            RETURNING {PLAYER_COLUMNS}
            """,
            {"u": username, "c": body.clicks, "b": body.bananas},
        ).fetchone()
    return player


@app.get("/leaderboard")
def leaderboard(limit: int = Query(10, ge=1, le=100)):
    with pool.connection() as conn:
        return conn.execute(
            "SELECT username, bananas, clicks FROM players ORDER BY bananas DESC, updated_at ASC LIMIT %s",
            (limit,),
        ).fetchall()
