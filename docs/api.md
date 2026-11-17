# EventPass API

Base local: `http://localhost:4000/api` · Formato: `application/json`  
Rutas protegidas: header `Authorization: Bearer <token de Firebase>` (en desarrollo también admite tokens *mock*).

---

## Inscripciones

| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| POST | `/registrations` | attendee | `201 { data: Registration }` |
| GET | `/registrations/me` | attendee | `200 { data: Registration[] }` |
| GET | `/events/:id/registrations` | organizer (dueño) | `200 { data: Registration[] }` |

**POST /registrations** — body `{ "eventId": "abc123" }`

```json
{
  "data": {
    "id": "abc123_uidAna",
    "eventId": "abc123",
    "attendeeId": "uidAna",
    "attendeeName": "ana",
    "attendeeEmail": "ana@test.com",
    "eventTitle": "Evento de prueba",
    "folio": "EVP-2026-A3F9C1",
    "status": "active",
    "createdAt": "2026-11-15T19:20:11.000Z"
  }
}
```

Errores (`{ "message": "CODIGO" `):

| Código | HTTP | Cuándo |
|---|---|---|
| `EVENT_NOT_FOUND` | 404 | El evento no existe |
| `EVENT_CLOSED` | 409 | El evento está cerrado |
| `EVENT_FULL` | 409 | Ya no hay lugares |
| `ALREADY_REGISTERED` | 409 | Ya está inscrito a ese evento |
| `NOT_EVENT_OWNER` | 403 | El organizador no es dueño del evento |

---

## Módulo de Eventos

### Autenticación y Roles

Los endpoints protegidos requieren el encabezado HTTP `Authorization`:

```http
Authorization: Bearer <token>