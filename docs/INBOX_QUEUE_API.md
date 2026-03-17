# Inbox Queue System API

Backend API for inbox triage queue management in Personal Hub.

## Overview

The inbox queue system allows users to manage prioritized lists of tickets that need their attention. Items are ordered by position, and the system provides endpoints for:

- Fetching the next item to triage
- Marking items as triaged (with automatic queue reordering)
- Manually reordering items
- Querying inbox items with optional ticket details

## Endpoints

### GET /api/inbox-items

List all inbox items with optional filtering.

**Query Parameters:**
- `targetUser` (string) - Filter by user ID
- `triaged` (boolean) - Filter by triaged status ("true" or "false")
- `includeTickets` (boolean) - Include full ticket details (default: false)

**Response:**
```json
{
  "inboxItems": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "targetUser": "uuid",
      "position": 0,
      "triaged": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "ticket": {  // Only if includeTickets=true
        "id": "uuid",
        "title": "Task title",
        "description": "Task description",
        "type": "task",
        "status": "inbox",
        "priority": 1,
        "projectId": "uuid",
        "assigneeId": "uuid",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:3000/api/inbox-items?targetUser=user-123&triaged=false&includeTickets=true"
```

---

### GET /api/inbox-items/next

Get the next untriaged item in the queue (lowest position).

**Query Parameters:**
- `targetUser` (string, required) - User ID

**Response:**
```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "targetUser": "uuid",
  "position": 0,
  "triaged": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "ticket": {
    "id": "uuid",
    "title": "Task title",
    // ... full ticket details
  }
}
```

**Error Response (404):**
```json
{
  "message": "No untriaged items in queue"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/inbox-items/next?targetUser=user-123"
```

---

### POST /api/inbox-items/[id]/triage

Mark an inbox item as triaged and automatically reorder the queue.

**Behavior:**
- Sets `triaged = true` on the specified item
- Decrements the position of all items that were after it
- This fills the gap left by the triaged item

**Response:**
```json
{
  "message": "Item triaged successfully",
  "itemId": "uuid"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/inbox-items/abc-123/triage"
```

---

### POST /api/inbox-items/reorder

Manually reorder multiple inbox items.

**Request Body:**
```json
{
  "targetUser": "uuid",
  "itemPositions": [
    { "id": "item-1", "position": 0 },
    { "id": "item-2", "position": 1 },
    { "id": "item-3", "position": 2 }
  ]
}
```

**Response:**
```json
{
  "message": "Inbox items reordered successfully",
  "updated": 3
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/inbox-items/reorder" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUser": "user-123",
    "itemPositions": [
      {"id": "item-1", "position": 0},
      {"id": "item-2", "position": 1}
    ]
  }'
```

---

### POST /api/inbox-items

Create a new inbox item (existing endpoint, unchanged).

**Request Body:**
```json
{
  "ticketId": "uuid",
  "targetUser": "uuid",
  "position": 0
}
```

---

### GET /api/inbox-items/[id]

Get a single inbox item by ID (existing endpoint, unchanged).

---

### PATCH /api/inbox-items/[id]

Update an inbox item (existing endpoint, unchanged).

**Request Body:**
```json
{
  "position": 5,
  "triaged": true
}
```

## Typical Workflow

### 1. Fetch Next Item to Triage

```bash
GET /api/inbox-items/next?targetUser=user-123
```

### 2. User Reviews Item

Frontend displays the ticket details from the response.

### 3. User Takes Action

- Assigns to self: Update ticket via `/api/tickets/[id]`
- Assigns to someone else: Update ticket
- Archives: Update ticket status
- Snoozes: Update position or remove from inbox

### 4. Mark as Triaged

```bash
POST /api/inbox-items/abc-123/triage
```

This automatically moves the next item to position 0.

### 5. Repeat

```bash
GET /api/inbox-items/next?targetUser=user-123
```

## Position Management

- **Position 0** is the highest priority (next item to triage)
- **Triaging an item** decrements all positions after it by 1
- **Manual reordering** allows bulk position updates

## Database Schema

```typescript
inboxItems = pgTable("inbox_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  targetUser: uuid("target_user").notNull().references(() => users.id),
  position: integer("position").notNull(),
  triaged: boolean("triaged").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

## Future Enhancements

- Automatic position assignment on creation (find max + 1)
- Bulk triage operations
- Triage history tracking
- Priority-based auto-ordering
- User-specific triage settings
