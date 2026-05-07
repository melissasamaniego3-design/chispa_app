"""Backend AI endpoint tests for Chispa."""
import re
import pytest


# Heuristic: detect Spanish (castellano) text presence
_SPANISH_HINTS = re.compile(
    r"\b(que|qué|cómo|como|para|con|una|un|y|tu|tú|los|las|el|del|de|en|por|si|sí|más|también|pero|este|esta)\b",
    re.IGNORECASE,
)


def looks_spanish(text: str) -> bool:
    if not text or len(text.strip()) < 5:
        return False
    matches = len(_SPANISH_HINTS.findall(text))
    return matches >= 2


# ------------------------ Health ------------------------
class TestHealth:
    def test_root(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("app") == "Chispa"


# ------------------------ Daily Challenge ------------------------
class TestDailyChallenge:
    def test_daily_challenge_level1_diversion(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/challenge/daily",
            json={"level": 1, "purpose": "diversion"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("title"), str) and data["title"]
        assert isinstance(data.get("prompt"), str) and len(data["prompt"]) > 10
        assert data.get("type") in ("lateral", "what_if", "constraint", "analogy")
        # Level 1 should have a hint
        assert data.get("hint"), "Level 1 should include a hint"
        assert looks_spanish(data["prompt"]), f"Prompt not in Spanish: {data['prompt']}"

    def test_daily_challenge_level4_no_hint(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/challenge/daily",
            json={"level": 4, "purpose": "arte"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("prompt") and looks_spanish(data["prompt"])
        # Level 4 should generally have no hint per system prompt
        # (allow None or empty)
        assert not data.get("hint") or data["hint"] is None or data["hint"] == ""

    def test_daily_challenge_invalid_level(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/challenge/daily",
            json={"level": 9, "purpose": "diversion"},
            timeout=30,
        )
        assert r.status_code == 422


# ------------------------ Challenge Feedback ------------------------
class TestChallengeFeedback:
    def test_feedback_returns_xp_in_range(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/challenge/feedback",
            json={
                "level": 2,
                "purpose": "trabajo",
                "challenge": "Imagina una oficina sin sillas. ¿Qué cambia?",
                "response": "Reuniones más cortas, más movimiento, y zonas para apoyarse de pie con superficies inclinadas.",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("feedback"), str) and len(data["feedback"]) > 5
        assert isinstance(data.get("next_push"), str) and len(data["next_push"]) > 3
        assert isinstance(data.get("xp"), int)
        assert 10 <= data["xp"] <= 40
        assert looks_spanish(data["feedback"]), f"Not Spanish: {data['feedback']}"


# ------------------------ Idea Trainer Chat ------------------------
class TestTrainerChat:
    def test_trainer_chat_reply_spanish(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/idea-trainer/chat",
            json={
                "session_id": "TEST_session_1",
                "level": 1,
                "purpose": "problemas",
                "message": "Quiero diseñar un mejor cepillo de dientes para niños.",
                "topic": "cepillo de dientes",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        reply = data.get("reply", "")
        assert isinstance(reply, str) and len(reply) > 10
        assert looks_spanish(reply), f"Reply not Spanish: {reply}"

    def test_trainer_chat_level4_terse(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/idea-trainer/chat",
            json={
                "session_id": "TEST_session_2",
                "level": 4,
                "purpose": "arte",
                "message": "¿Cómo rompo un bloqueo creativo?",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        reply = r.json().get("reply", "")
        assert reply and looks_spanish(reply)


# ------------------------ Concepts Generate ------------------------
class TestConcepts:
    def test_concepts_generate_returns_two(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/concepts/generate",
            json={"level": 1, "purpose": "diversion"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("concept_a"), str) and data["concept_a"]
        assert isinstance(data.get("concept_b"), str) and data["concept_b"]
        assert data["concept_a"].lower() != data["concept_b"].lower()
        assert isinstance(data.get("distance"), int)

    def test_concepts_generate_level4_extreme(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/concepts/generate",
            json={"level": 4, "purpose": "arte"},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("concept_a") and data.get("concept_b")


# ------------------------ Concepts Fuse ------------------------
class TestFuse:
    def test_fuse_returns_three_fusions_and_invitation(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/concepts/fuse",
            json={
                "level": 2,
                "purpose": "diversion",
                "concept_a": "biblioteca",
                "concept_b": "tormenta",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        fusions = data.get("fusions")
        assert isinstance(fusions, list) and len(fusions) == 3
        for f in fusions:
            assert isinstance(f, str) and len(f) > 3
        assert isinstance(data.get("invitation"), str) and data["invitation"]
        assert looks_spanish(" ".join(fusions) + " " + data["invitation"])

    def test_fuse_with_user_idea(self, api_client, base_url):
        r = api_client.post(
            f"{base_url}/api/concepts/fuse",
            json={
                "level": 3,
                "purpose": "trabajo",
                "concept_a": "abeja",
                "concept_b": "rascacielos",
                "user_idea": "Edificios con sistemas de comunicación tipo enjambre",
            },
            timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data.get("fusions", [])) == 3
        assert data.get("invitation")
