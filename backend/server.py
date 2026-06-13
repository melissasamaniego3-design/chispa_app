"""
Chispa - Backend AI proxy para Claude Sonnet.
Backend stateless: el dispositivo guarda el progreso;
este servidor solo genera contenido con IA.

CAMBIO RESPECTO A EMERGENT:
- Eliminada dependencia 'emergentintegrations'
- Usa la librería oficial 'anthropic' directamente
- Variable de entorno: ANTHROPIC_API_KEY (antes EMERGENT_LLM_KEY)
"""

import os
import json
import uuid
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic

# ── Config ──────────────────────────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL_NAME = "claude-sonnet-4-5-20250929"

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

app = FastAPI(title="Chispa API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ── Datos de niveles y propósitos ────────────────────────
LEVEL_NAMES = {1: "Chispa", 2: "Llama", 3: "Hoguera", 4: "Infierno"}

PURPOSE_LABELS = {
    "trabajo":   "el trabajo y la productividad",
    "arte":      "el arte y la expresión creativa",
    "problemas": "la resolución de problemas",
    "diversion": "la diversión pura y la curiosidad",
}

# ── Helpers ──────────────────────────────────────────────
def extract_json(text: str) -> dict:
    """Extrae el primer objeto JSON válido del texto."""
    clean = re.sub(r"```json|```", "", text).strip()
    match = re.search(r"\{.*\}", clean, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(clean)


def level_tone(level: int) -> str:
    tones = {
        1: "Eres cálido, entusiasta y guías mucho. Usas ejemplos concretos, "
           "emojis ocasionales y das pistas claras. Siempre celebras el intento.",
        2: "Eres curioso y desafiante con afecto. Reduces el andamiaje, pides más "
           "abstracción y empujas a conexiones menos obvias. Sin juzgar.",
        3: "Eres provocador, directo y exigente. Lanzas retos multinivel, exiges "
           "distancia cognitiva alta y rechazas respuestas obvias.",
        4: "Eres adversario creativo: terso, agudo, sin muletas. Provocas, no explicas. "
           "Esperas pensamiento experto y roto. Cero halagos vacíos.",
    }
    return tones.get(level, tones[1])


def purpose_context(purpose: str) -> str:
    label = PURPOSE_LABELS.get(purpose, "la creatividad en general")
    return (
        f"El usuario quiere usar su creatividad para {label}. "
        "Adapta los ejemplos a ese mundo cuando sea natural, sin forzar."
    )


def base_persona(level: int, purpose: str) -> str:
    return (
        f"Eres CHISPA, un coach de pensamiento creativo en castellano. "
        f"Tu misión es expandir el pensamiento del usuario, nunca juzgarlo. "
        f"Nivel actual del usuario: {level} ({LEVEL_NAMES.get(level, 'Chispa')}). "
        f"Tono para este nivel: {level_tone(level)} "
        f"{purpose_context(purpose)} "
        "Habla SIEMPRE en castellano (tú, no usted). Sé conciso y energético."
    )


def call_claude(system: str, user_message: str) -> str:
    """Llama a la API de Anthropic y devuelve el texto de respuesta."""
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1000,
            system=system,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=503,
            detail="La chispa está descansando. Inténtalo en unos segundos."
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail="Error temporal con la IA. Inténtalo de nuevo."
        )


def call_claude_chat(system: str, messages: list) -> str:
    """Llama con historial de conversación (para el chat socrático)."""
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1000,
            system=system,
            messages=messages,
        )
        return response.content[0].text
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=503,
            detail="La chispa está descansando. Inténtalo en unos segundos."
        )
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Error temporal con la IA. Inténtalo de nuevo."
        )


# ── Modelos de request ───────────────────────────────────
class DailyRequest(BaseModel):
    level: int = 1
    purpose: str = "diversion"
    seed: Optional[str] = None

class FeedbackRequest(BaseModel):
    level: int = 1
    purpose: str = "diversion"
    challenge_title: str
    challenge_prompt: str
    user_answer: str

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class TrainerRequest(BaseModel):
    level: int = 1
    purpose: str = "diversion"
    topic: str
    history: list[ChatMessage] = []

class ConceptsRequest(BaseModel):
    level: int = 1
    purpose: str = "diversion"

class FuseRequest(BaseModel):
    level: int = 1
    purpose: str = "diversion"
    concept_a: str
    concept_b: str
    user_idea: Optional[str] = None


# ── Endpoints ────────────────────────────────────────────
@app.get("/")
@app.post("/")
async def root():
    return {"app": "Chispa", "status": "ok"}


@app.post("/api/challenge/daily")
async def challenge_daily(req: DailyRequest):
    style_by_level = {
        1: "concreto, divertido, fácil de empezar; siempre incluye una pista breve",
        2: "más abstracto, pide saltos laterales; pista opcional y sutil",
        3: "multi-paso, con restricciones inusuales; sin pista, exige distancia cognitiva alta",
        4: "provocación abierta, sin pistas, paradoja o restricción radical",
    }
    seed = req.seed or str(uuid.uuid4())[:8]
    system = (
        f"{base_persona(req.level, req.purpose)} "
        f"Vas a generar UN reto creativo diario único. "
        f"Estilo: {style_by_level.get(req.level, style_by_level[1])}. "
        "Devuelve SOLO un JSON válido con las claves: "
        "{\"title\": str (máx 6 palabras), \"prompt\": str (máx 60 palabras, en segunda persona), "
        "\"hint\": str|null (máx 20 palabras o null si nivel>=3), "
        "\"type\": \"lateral\"|\"what_if\"|\"constraint\"|\"analogy\"}. "
        "Nada de markdown ni texto extra."
    )
    user_msg = f"Genera el reto de hoy. Semilla de variedad: {seed}. Hazlo sorprendente y único."
    raw = call_claude(system, user_msg)
    try:
        return extract_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="Error procesando el reto. Reintenta.")


@app.post("/api/challenge/feedback")
async def challenge_feedback(req: FeedbackRequest):
    system = (
        f"{base_persona(req.level, req.purpose)} "
        "Vas a dar feedback sobre la respuesta del usuario a un reto creativo. "
        "Tu feedback NUNCA juzga (no digas 'bien', 'mal', 'correcto'); SIEMPRE expande. "
        "Estructura: 1) qué notas interesante o latente en su idea, "
        "2) un empujón concreto para llevarla más lejos. "
        "Devuelve SOLO JSON: {\"feedback\": str (máx 70 palabras), "
        "\"next_push\": str (una pregunta o reto breve, máx 25 palabras), "
        "\"xp\": int}. "
        "El XP debe estar entre 10 y 40 según el esfuerzo y profundidad observada."
    )
    user_msg = (
        f"Reto: {req.challenge_title} — {req.challenge_prompt}\n"
        f"Respuesta del usuario: {req.user_answer}"
    )
    raw = call_claude(system, user_msg)
    try:
        data = extract_json(raw)
        data["xp"] = max(10, min(40, int(data.get("xp", 15))))
        return data
    except Exception:
        raise HTTPException(status_code=502, detail="Error procesando el feedback. Reintenta.")


@app.post("/api/idea-trainer/chat")
async def idea_trainer_chat(req: TrainerRequest):
    socratic_by_level = {
        1: "Haz preguntas socráticas claras. Sugiere analogías concretas. "
           "Usa SCAMPER de forma natural sin nombrarlo. Ofrece un 'qué pasaría si...' cada turno.",
        2: "Reta supuestos. Mezcla analogías más distantes. "
           "Lanza conexiones forzadas con dominios inesperados.",
        3: "Provoca con paradojas y restricciones. Conexiones remotas. "
           "Cuestiona el marco antes de la idea.",
        4: "Sé adversario: ataca el supuesto central, pide la versión rota o extrema. "
           "Sin halagos, sin pistas.",
    }
    system = (
        f"Eres un coach socrático de creatividad en castellano. "
        "Nunca des respuestas cerradas; haz preguntas, lanza provocaciones, "
        "sugiere analogías sorprendentes. "
        f"Estrategia para este nivel: {socratic_by_level.get(req.level, socratic_by_level[1])}. "
        "Responde SIEMPRE con: 1-3 frases máximo, terminando con UNA pregunta o provocación clara. "
        "Cero markdown, cero listas. Texto plano y vivo. "
        f"Tema o idea inicial del usuario: {req.topic}"
    )
    messages = [{"role": m.role, "content": m.content} for m in req.history]
    if not messages:
        messages = [{"role": "user", "content": req.topic}]

    return {"reply": call_claude_chat(system, messages)}


@app.post("/api/concepts/generate")
async def concepts_generate(req: ConceptsRequest):
    distance_by_level = {
        1: "cercana (mismos sentidos o categoría amplia)",
        2: "media (categorías distintas pero familiares)",
        3: "alta (dominios muy distintos)",
        4: "extrema (paradójica, casi incompatibles)",
    }
    system = (
        f"{base_persona(req.level, req.purpose)} "
        "Vas a proponer DOS conceptos no relacionados para una fusión bisociativa (teoría de Koestler). "
        f"Distancia cognitiva pedida: {distance_by_level.get(req.level, distance_by_level[1])}. "
        "Conceptos concretos, evocadores, en castellano, una palabra o frase corta. "
        "Devuelve SOLO JSON: {\"concept_a\": str, \"concept_b\": str, \"distance\": int 1-4}. "
        "Nunca repitas binomios típicos (pulpo+arquitectura ya está usado)."
    )
    import random
    seed = str(random.randint(10000, 99999))
    raw = call_claude(system, f"Genera dos conceptos sorprendentes ahora. Semilla: {seed}")
    try:
        return extract_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="Error generando conceptos. Reintenta.")


@app.post("/api/concepts/fuse")
async def concepts_fuse(req: FuseRequest):
    system = (
        f"{base_persona(req.level, req.purpose)} "
        "Vas a generar fusiones bisociativas entre dos conceptos. "
        "Si el usuario aporta su idea, comenta brevemente lo más interesante de ella (sin juzgar) "
        "y propón 3 ramas para llevarla más lejos. "
        "Si no aporta nada, propón 3 fusiones sorprendentes. "
        "Devuelve SOLO JSON: {\"fusions\": [str, str, str] (cada una máx 25 palabras, "
        "evocadora, concreta), \"invitation\": str (una pregunta para que construya sobre una, "
        "máx 20 palabras)}."
    )
    user_idea_line = f"Idea del usuario: {req.user_idea}" if req.user_idea else "El usuario no aportó idea propia."
    user_msg = f"Conceptos: {req.concept_a} + {req.concept_b}. {user_idea_line}"
    raw = call_claude(system, user_msg)
    try:
        data = extract_json(raw)
        fusions = data.get("fusions", [])
        while len(fusions) < 3:
            fusions.append("…")
        data["fusions"] = fusions[:3]
        return data
    except Exception:
        raise HTTPException(status_code=502, detail="Error generando fusiones. Reintenta.")
