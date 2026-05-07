# Chispa - PRD

## Visión
App móvil Expo (iOS/Android) que entrena el pensamiento creativo a través de
retos diarios, conversación socrática con IA y fusión bisociativa de
conceptos lejanos. Estética **Duolingo en castellano** con energía vibrante.

## Stack
- **Frontend:** Expo SDK 54 · expo-router · React Native · TypeScript
- **Backend:** FastAPI (proxy stateless de IA — no guarda nada por usuario)
- **Modelo IA:** Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) vía `emergentintegrations` y `EMERGENT_LLM_KEY`
- **Persistencia:** AsyncStorage local (sin cuentas)
- **Notificaciones:** `expo-notifications` (recordatorio diario 10:00)

## Niveles
1. **Chispa** (0 XP) — guiado, cálido, pistas
2. **Llama** (150 XP) — saltos laterales
3. **Hoguera** (450 XP) — conexiones lejanas
4. **Infierno** (1000 XP) — adversario sin pistas

## Pantallas (expo-router)
- `/index` boot → redirige a onboarding o home
- `/onboarding` 3 pasos (intro · niveles · pregunta de propósito)
- `/home` dashboard con nivel + XP + racha + 3 secciones
- `/challenge` reto diario (prompt → respuesta → feedback IA + XP)
- `/trainer` chat socrático con la IA (history persistente, reset)
- `/connector` bisociación (2 conceptos → fusión IA)
- `/profile` progreso, niveles, propósito, notificaciones, reset

## API (FastAPI · prefijo `/api`)
- `POST /challenge/daily` `{level, purpose, seed}` → reto JSON
- `POST /challenge/feedback` `{level, purpose, challenge, response}` → feedback + XP (10-40)
- `POST /idea-trainer/chat` `{session_id, level, purpose, message, topic}` → respuesta socrática
- `POST /concepts/generate` `{level, purpose}` → 2 conceptos
- `POST /concepts/fuse` `{level, purpose, concept_a, concept_b, user_idea?}` → fusiones + invitación

## Diseño
- Paleta: Amarillo eléctrico `#FFEA00`, Coral `#FF5470`, Violeta `#8338EC`, fondo `#FDF8F5`
- Estilo neobrutalista: bordes 2px sólidos + offset inferior, esquinas redondeadas grandes (18-22px)
- Botones gamificados con efecto squish (translateY + borderBottom anim)
- Tipografía pesada (900) para titulares
- Iconos: `lucide-react-native`

## Próximos pasos (post-MVP)
- Compartir feedback como "tarjeta de chispa" (shareability)
- Historial de retos pasados
- Nivel-up celebration overlay
- Login opcional + sincronización cloud
