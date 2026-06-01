"""
Chispa - Backend AI proxy for Claude Sonnet 4.5
Stateless backend: device stores all progress; backend only generates AI content.
"""
import os
import json
import logging
import re
import uuid
from pathlib import Path
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("chispa")

app = FastAPI(title="Chispa API")
api = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Level configuration & shared persona
# ---------------------------------------------------------------------------
Level = Literal[1, 2, 3, 4]

LEVEL_NAMES = {1: "Chispa", 2: "Llama", 3: "Hoguera", 4: "Infierno"}
PURPOSE_LABELS = {
    "trabajo": "el trabajo y la productividad",
    "arte": "el arte y la expresión creativa",
    "problemas": "la resolución de problemas",
    "diversion": "la diversión pura y la curiosidad",
}


def level_tone(level: int) -> str:
    return {
        1: (
            "Eres cálido, entusiasta y guías mucho. Usas ejemplos concretos, "
            "emojis ocasionales y das pistas claras. Siempre celebras el intento."
        ),
        2: (
            "Eres curioso y desafiante con afecto. Reduces el andamiaje, pides "
            "más abstracción y empujas a conexiones menos obvias. Sin juzgar."
        ),
        3: (
            "Eres provocador, directo y exigente. Lanzas retos multinivel, "
            "exiges distancia cognitiva alta y rechazas respuestas obvias."
        ),
        4: (
            "Eres adversario creativo: terso, agudo, sin muletas. Provocas, no "
            "explicas. Esperas pensamiento experto y roto. Cero halagos vacíos."
        ),
    }[level]


def purpose_context(purpose: Optional[str]) -> str:
    if not purpose or purpose not in PURPOSE_LABELS:
        return ""
    return f"El usuario quiere usar su creatividad para {PURPOSE_LABELS[purpose]}. Adapta los ejemplos a ese mundo cuando sea natural, sin forzar."


def base_persona(level: int, purpose: Optional[str]) -> str:
    return (
        "Eres CHISPA, un coach de pensamiento creativo en castellano. "
        "Tu misión es expandir el pensamiento del usuario, nunca juzgarlo. "
        f"Nivel actual del usuario: {level} ({LEVEL_NAMES[level]}). "
        f"Tono para este nivel: {level_tone(level)} "
        f"{purpose_context(purpose)} "
        "Habla SIEMPRE en castellano (tú, no usted). Sé conciso y energético."
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def extract_json(text: str) -> dict:
    """Extract first JSON object from a Claude reply."""
    text = text.strip()
    # Remove ```json fences if present
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        return json.loads(fenced.group(1))
    # Try direct
    brace = re.search(r"\{.*\}", text, re.DOTALL)
    if brace:
        return json.loads(brace.group(0))
    raise ValueError("No JSON object found")


async def claude_call(system: str, user_text: str, session_id: Optional[str] = None) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id or str(uuid.uuid4()),
        system_message=system,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)
    try:
        return await chat.send_message(UserMessage(text=user_text))
    except Exception as e:
        msg = str(e).lower()
        logger.warning("LLM call failed: %s", e)
        if "budget" in msg or "quota" in msg or "rate" in msg:
            raise HTTPException(
                status_code=503,
                detail="La chispa está descansando. Inténtalo en unos segundos.",
            )
        raise HTTPException(status_code=502, detail="Error temporal con la IA. Inténtalo de nuevo.")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class DailyChallengeIn(BaseModel):
    level: int = Field(ge=1, le=4)
    purpose: Optional[str] = None
    seed: Optional[str] = None  # date string for variety


class DailyChallengeOut(BaseModel):
    title: str
    prompt: str
    hint: Optional[str] = None
    type: str  # e.g. "lateral", "what_if", "constraint"


class ChallengeFeedbackIn(BaseModel):
    level: int = Field(ge=1, le=4)
    purpose: Optional[str] = None
    challenge: str
    response: str


class ChallengeFeedbackOut(BaseModel):
    feedback: str
    next_push: str
    xp: int


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class TrainerChatIn(BaseModel):
    session_id: str
    level: int = Field(ge=1, le=4)
    purpose: Optional[str] = None
    message: str
    topic: Optional[str] = None


class TrainerChatOut(BaseModel):
    reply: str


class ConceptsIn(BaseModel):
    level: int = Field(ge=1, le=4)
    purpose: Optional[str] = None


class ConceptsOut(BaseModel):
    concept_a: str
    concept_b: str
    distance: int


class FuseIn(BaseModel):
    level: int = Field(ge=1, le=4)
    purpose: Optional[str] = None
    concept_a: str
    concept_b: str
    user_idea: Optional[str] = None


class FuseOut(BaseModel):
    fusions: List[str]
    invitation: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "Chispa", "status": "ok"}


@api.post("/challenge/daily", response_model=DailyChallengeOut)
async def daily_challenge(payload: DailyChallengeIn):
    style_by_level = {
        1: "concreto, divertido, fácil de empezar; siempre incluye una pista breve",
        2: "más abstracto, pide saltos laterales; pista opcional y sutil",
        3: "multi-paso, con restricciones inusuales; sin pista, exige distancia cognitiva alta",
        4: "provocación abierta, sin pistas, paradoja o restricción radical",
    }[payload.level]

    system = base_persona(payload.level, payload.purpose) + (
        " Vas a generar UN reto creativo diario único. Estilo: "
        f"{style_by_level}. "
        "Devuelve SOLO un JSON válido con las claves: "
        '{"title": str (máx 6 palabras), "prompt": str (máx 60 palabras, en segunda persona), '
        '"hint": str|null (máx 20 palabras o null si nivel>=3), "type": "lateral"|"what_if"|"constraint"|"analogy"}. '
        "Nada de markdown ni texto extra."
    )
    user = f"Genera el reto de hoy. Semilla de variedad: {payload.seed or uuid.uuid4().hex[:6]}. Hazlo sorprendente y único."
    raw = await claude_call(system, user)
    try:
        data = extract_json(raw)
        return DailyChallengeOut(
            title=str(data.get("title", "Reto del día"))[:120],
            prompt=str(data.get("prompt", "")).strip(),
            hint=(str(data["hint"]).strip() if data.get("hint") else None),
            type=str(data.get("type", "lateral")),
        )
    except Exception as e:
        logger.exception("daily_challenge JSON parse failed: %s", raw)
        raise HTTPException(status_code=502, detail=f"AI parse error: {e}")


@api.post("/challenge/feedback", response_model=ChallengeFeedbackOut)
async def challenge_feedback(payload: ChallengeFeedbackIn):
    system = base_persona(payload.level, payload.purpose) + (
        " Vas a dar feedback sobre la respuesta del usuario a un reto creativo. "
        "Tu feedback NUNCA juzga (no digas 'bien', 'mal', 'correcto'); SIEMPRE expande. "
        "Estructura: 1) qué notas interesante o latente en su idea, 2) un empujón concreto para llevarla más lejos. "
        "Devuelve SOLO JSON: "
        '{"feedback": str (máx 70 palabras), "next_push": str (una pregunta o reto breve, máx 25 palabras), "xp": int}. '
        "El XP debe estar entre 10 y 40 según el esfuerzo y profundidad observada (no la 'corrección')."
    )
    user = (
        f"RETO: {payload.challenge}\n\n"
        f"RESPUESTA DEL USUARIO: {payload.response}\n\n"
        "Da feedback expansivo en JSON."
    )
    raw = await claude_call(system, user)
    try:
        data = extract_json(raw)
        xp = int(data.get("xp", 20))
        xp = max(10, min(40, xp))
        return ChallengeFeedbackOut(
            feedback=str(data.get("feedback", "")).strip(),
            next_push=str(data.get("next_push", "")).strip(),
            xp=xp,
        )
    except Exception as e:
        logger.exception("challenge_feedback parse: %s", raw)
        raise HTTPException(status_code=502, detail=f"AI parse error: {e}")


@api.post("/idea-trainer/chat", response_model=TrainerChatOut)
async def trainer_chat(payload: TrainerChatIn):
    socratic_by_level = {
        1: "Haz preguntas socráticas claras. Sugiere analogías concretas. Usa SCAMPER de forma natural sin nombrarlo. Ofrece un 'qué pasaría si...' cada turno.",
        2: "Reta supuestos. Mezcla analogías más distantes. Lanza conexiones forzadas con dominios inesperados.",
        3: "Provoca con paradojas y restricciones. Conexiones remotas. Cuestiona el marco antes de la idea.",
        4: "Sé adversario: ataca el supuesto central, pide la versión rota o extrema. Sin halagos, sin pistas.",
    }[payload.level]

    topic_line = f"\nTema o idea inicial del usuario: {payload.topic}" if payload.topic else ""

    system = base_persona(payload.level, payload.purpose) + (
        " Eres un coach socrático de creatividad. Nunca des respuestas cerradas; "
        "haz preguntas, lanza provocaciones, sugiere analogías sorprendentes. "
        f"Estrategia para este nivel: {socratic_by_level} "
        "Responde SIEMPRE con: 1-3 frases máximo, terminando con UNA pregunta o provocación clara. "
        "Cero markdown, cero listas. Texto plano y vivo."
        f"{topic_line}"
    )
    raw = await claude_call(system, payload.message, session_id=payload.session_id)
    return TrainerChatOut(reply=raw.strip())


@api.post("/concepts/generate", response_model=ConceptsOut)
async def concepts_generate(payload: ConceptsIn):
    distance_by_level = {
        1: "cercana (mismos sentidos o categoría amplia)",
        2: "media (categorías distintas pero familiares)",
        3: "alta (dominios muy distintos)",
        4: "extrema (paradójica, casi incompatibles)",
    }[payload.level]

    system = base_persona(payload.level, payload.purpose) + (
        " Vas a proponer DOS conceptos no relacionados para una fusión bisociativa "
        "(teoría de Koestler). "
        f"Distancia cognitiva pedida: {distance_by_level}. "
        "Conceptos concretos, evocadores, en castellano, una palabra o frase corta. "
        "Devuelve SOLO JSON: "
        '{"concept_a": str, "concept_b": str, "distance": int 1-4}. '
        "Nunca repitas binomios típicos (pulpo+arquitectura ya está usado)."
    )
    raw = await claude_call(system, "Genera dos conceptos sorprendentes ahora.")
    try:
        data = extract_json(raw)
        return ConceptsOut(
            concept_a=str(data["concept_a"]).strip(),
            concept_b=str(data["concept_b"]).strip(),
            distance=int(data.get("distance", payload.level)),
        )
    except Exception as e:
        logger.exception("concepts parse: %s", raw)
        raise HTTPException(status_code=502, detail=f"AI parse error: {e}")


@api.post("/concepts/fuse", response_model=FuseOut)
async def concepts_fuse(payload: FuseIn):
    system = base_persona(payload.level, payload.purpose) + (
        " Vas a generar fusiones bisociativas entre dos conceptos. "
        "Si el usuario aporta su idea, comenta brevemente lo más interesante de ella "
        "(sin juzgar) y propón 3 ramas para llevarla más lejos. "
        "Si no aporta nada, propón 3 fusiones sorprendentes. "
        "Devuelve SOLO JSON: "
        '{"fusions": [str, str, str] (cada una máx 25 palabras, evocadora, concreta), '
        '"invitation": str (una pregunta para que construya sobre una, máx 20 palabras)}.'
    )
    user_idea = f"\nIdea del usuario: {payload.user_idea}" if payload.user_idea else ""
    user = f"Concepto A: {payload.concept_a}\nConcepto B: {payload.concept_b}{user_idea}\nGenera fusiones."
    raw = await claude_call(system, user)
    try:
        data = extract_json(raw)
        fusions = [str(f).strip() for f in data.get("fusions", [])][:3]
        while len(fusions) < 3:
            fusions.append("…")
        return FuseOut(fusions=fusions, invitation=str(data.get("invitation", "")).strip())
    except Exception as e:
        logger.exception("fuse parse: %s", raw)
        raise HTTPException(status_code=502, detail=f"AI parse error: {e}")


# ---------------------------------------------------------------------------
# App wiring
# ---------------------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
