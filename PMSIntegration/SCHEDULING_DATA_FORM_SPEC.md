# Scheduling Data Collection Form

## Purpose
Collect customer scheduling configuration so Kate knows how to book appointments correctly.

---

## Section 1: Providers

**Header:** "Who are your providers?"

For each provider, collect:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Provider Name | Text | Yes | e.g., "Dr. Smith", "Sarah (Hygienist)" |
| Provider Type | Dropdown | Yes | Options: Dentist, Hygienist, Assistant |

---

## Section 2: Operatories

**Header:** "What are your operatories?"

Collect the customer's operatory names and their corresponding column numbers in the PMS schedule.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Operatory Name | Text | Yes | e.g., "Op 1", "Hygiene Room A", "Chair 3" |
| Column Number | Number | Yes | The column number in the PMS schedule |

**Notes:**
- Operatory names are defined by the customer (free text)
- Column numbers map to the PMS schedule columns
- These operatories will appear as dropdown options when assigning providers

---

## Section 3: Provider Schedules

**Header:** "Set up provider schedules"

For each provider (from Section 1), collect their daily schedule:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Working? | Checkbox | Yes | Is provider working this day? |
| Start Time | Time picker | If working | What time they start |
| End Time | Time picker | If working | What time they finish |
| Lunch Start | Time picker | If working | When lunch break starts |
| Lunch End | Time picker | If working | When lunch break ends |
| AM Operatory | Dropdown | If working | Select from operatories defined in Section 2 |
| PM Operatory | Dropdown | If working | Select from operatories defined in Section 2 |
| Appt Types | Multi-select checkboxes | If working | Which appointment types on this day: NP-A, NP-C, EP-A, EP-C, EM |
| Time Preference | Dropdown per appt type | If appt type selected | Morning, Afternoon, or No Preference |

**UI Concept:**

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PROVIDERS                                                                              [+ Add Provider]      │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                               │
│ Provider 1                                                                                         [Remove]  │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Name: [Dr. Smith____________]  Type: [Dentist ▼]                                                         ││
│ │                                                                                                           ││
│ │ Schedule:                                                                                                 ││
│ │ ┌─────┬─────────┬───────────────────┬───────────────────┬───────────┬───────────────────────────────────┐││
│ │ │ Day │Working? │ Hours             │ Lunch             │ Operatory │ Appt Types + Time Pref            │││
│ │ ├─────┼─────────┼───────────────────┼───────────────────┼───────────┼───────────────────────────────────┤││
│ │ │ Mon │ [x]     │ [8:00am]-[5:00pm] │ [12:00pm]-[1:00pm]│ [Op 1___] │ NP-A[AM▼] NP-C[AM▼] EP-A[--▼] ...│││
│ │ │ Tue │ [x]     │ [8:00am]-[5:00pm] │ [12:00pm]-[1:00pm]│ [Op 1___] │ NP-A[AM▼] NP-C[AM▼] EP-A[--▼] ...│││
│ │ │ Wed │ [ ]     │ --OFF--           │ --                │ --        │ --                                │││
│ │ │ Thu │ [x]     │ [8:00am]-[5:00pm] │ [12:00pm]-[1:00pm]│ [Op 2___] │ NP-A[AM▼] NP-C[AM▼] EP-A[--▼] ...│││
│ │ │ Fri │ [x]     │ [8:00am]-[3:00pm] │ [12:00pm]-[1:00pm]│ [Op 1___] │ NP-A[AM▼] NP-C[AM▼] EP-A[--▼] ...│││
│ │ │ Sat │ [ ]     │ --OFF--           │ --                │ --        │ --                                │││
│ │ │ Sun │ [ ]     │ --OFF--           │ --                │ --        │ --                                │││
│ │ └─────┴─────────┴───────────────────┴───────────────────┴───────────┴───────────────────────────────────┘││
│ └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                                               │
│ Provider 2                                                                                         [Remove]  │
│ ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐│
│ │ Name: [Sarah_______________]  Type: [Hygienist ▼]                                                        ││
│ │                                                                                                           ││
│ │ Schedule:                                                                                                 ││
│ │ ┌─────┬─────────┬───────────────────┬───────────────────┬───────────┬───────────────────────────────────┐││
│ │ │ Day │Working? │ Hours             │ Lunch             │ Operatory │ Appt Types + Time Pref            │││
│ │ ├─────┼─────────┼───────────────────┼───────────────────┼───────────┼───────────────────────────────────┤││
│ │ │ Mon │ [x]     │ [9:00am]-[5:00pm] │ [1:00pm]-[2:00pm] │ [Op 3___] │ EP-A[--▼] EP-C[--▼]              │││
│ │ │ ... │         │                   │                   │           │                                   │││
│ │ └─────┴─────────┴───────────────────┴───────────────────┴───────────┴───────────────────────────────────┘││
│ └───────────────────────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                                               │
│                                                                            [+ Add Another Provider]          │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Appt Types + Time Preference column:**
- Each selected appointment type shows with a dropdown for time preference
- Format: `NP-A[AM▼]` means NP-A is selected with Morning preference
- Dropdown options: AM (Morning), PM (Afternoon), -- (No Preference)

**Example:**
```
NP-A[AM▼]  NP-C[AM▼]  EP-A[--▼]  EP-C[PM▼]  EM[--▼]
```

**Time Preference Options:**
| Code | Meaning |
|------|---------|
| AM | Morning (before lunch) |
| PM | Afternoon (after lunch) |
| -- | No Preference |

**Abbreviation Key** (shown on form for reference):
- NP-A = New Patient Exam & Cleaning - Adult
- NP-C = New Patient Exam & Cleaning - Child
- EP-A = Established Patient Exam & Cleaning - Adult
- EP-C = Established Patient Exam & Cleaning - Child
- EM = Emergency Visit - Limited Exam

---

## Section 4: Appointment Types

**Header:** "How long should each appointment type be?"

**Fixed appointment types with abbreviations and pre-filled defaults:**

| Abbrev | Appointment Type | Default Duration | Editable |
|--------|------------------|------------------|----------|
| **NP-A** | New Patient Exam & Cleaning - Adult | 60 minutes | Yes |
| **NP-C** | New Patient Exam & Cleaning - Child | 30 minutes | Yes |
| **EP-A** | Established Patient Exam & Cleaning - Adult | 60 minutes | Yes |
| **EP-C** | Established Patient Exam & Cleaning - Child | 30 minutes | Yes |
| **EM** | Emergency Visit - Limited Exam | 30 minutes | Yes |

**Notes:**
- These 5 types only - customers cannot add custom types
- Durations are pre-filled but customer can adjust if needed
- Abbreviations used in provider assignment for compact display

**UI Concept:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ APPOINTMENT TYPES                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ How many minutes should each appointment type reserve               │
│ in the schedule? (We've added defaults - adjust if needed)          │
│                                                                     │
│ ┌─────────────────────────────────────────────┬───────────────────┐│
│ │ Appointment Type                            │ Duration (mins)   ││
│ ├─────────────────────────────────────────────┼───────────────────┤│
│ │ New Patient Exam & Cleaning - Adult         │ [60_______] mins  ││
│ │ New Patient Exam & Cleaning - Child         │ [30_______] mins  ││
│ │ Established Patient Exam & Cleaning - Adult │ [60_______] mins  ││
│ │ Established Patient Exam & Cleaning - Child │ [30_______] mins  ││
│ │ Emergency Visit - Limited Exam              │ [30_______] mins  ││
│ └─────────────────────────────────────────────┴───────────────────┘│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section 5: Schedule Screenshots

**Header:** "Upload screenshots of your schedule"

**Purpose:** Help our techs understand your scheduling setup visually. Upload as many screenshots as needed.

**What to upload:**
- Screenshots from your PMS showing the schedule view
- Examples of how appointments appear in your system
- Any views that show provider columns/operatories

**UI Concept:**

```
┌─────────────────────────────────────────────────────────────────────┐
│ SCHEDULE SCREENSHOTS                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ Upload screenshots of your schedule to help us understand           │
│ how your practice is set up. You can upload as many as you need.    │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │                                                                 ││
│ │     ┌───────────┐  ┌───────────┐  ┌───────────┐                ││
│ │     │ 📷        │  │ 📷        │  │           │                ││
│ │     │ schedule  │  │ schedule  │  │   + Add   │                ││
│ │     │ _week.png │  │ _day.png  │  │   More    │                ││
│ │     │    [x]    │  │    [x]    │  │           │                ││
│ │     └───────────┘  └───────────┘  └───────────┘                ││
│ │                                                                 ││
│ │  Drag and drop files here, or click to browse                   ││
│ │                                                                 ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ Supported formats: PNG, JPG, PDF                                    │
│ No limit on number of uploads                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Form Flow

```
Page/Step 1: Appointment Types
    - Review/edit default durations
    [Next →]
        ↓
Page/Step 2: Providers
    - Add provider names and types
    [Next →]
        ↓
Page/Step 3: Operatories
    - Define operatory names and column numbers
    [Next →]
        ↓
Page/Step 4: Provider Schedules
    - Set hours, lunch, operatory assignments, and appointment types for each provider
    [Next →]
        ↓
Page/Step 5: Schedule Screenshots
    - Upload screenshots of their PMS schedule
    [Next →]
        ↓
Page/Step 6: Notes
    - Open text area for additional scheduling preferences or questions
    [Submit →]
```

---

## Data Structure (for developers)

```json
{
  "operatories": [
    {
      "name": "Op 1",
      "columnNumber": 1
    },
    {
      "name": "Op 2",
      "columnNumber": 2
    },
    {
      "name": "Hygiene A",
      "columnNumber": 3
    },
    {
      "name": "Hygiene B",
      "columnNumber": 4
    }
  ],
  "providers": [
    {
      "name": "Dr. Smith",
      "type": "dentist",  // or "hygienist" or "assistant"
      "schedule": [
        {
          "day": "monday",
          "working": true,
          "startTime": "08:00",
          "endTime": "17:00",
          "lunchStart": "12:00",
          "lunchEnd": "13:00",
          "operatoryAM": "Op 1",
          "operatoryPM": "Op 1",
          "appointmentTypes": [
            { "type": "NP-A", "timePref": "AM" },
            { "type": "NP-C", "timePref": "AM" },
            { "type": "EP-A", "timePref": "none" },
            { "type": "EP-C", "timePref": "PM" },
            { "type": "EM", "timePref": "none" }
          ]
        },
        {
          "day": "tuesday",
          "working": true,
          "startTime": "08:00",
          "endTime": "17:00",
          "lunchStart": "12:00",
          "lunchEnd": "13:00",
          "operatoryAM": "Op 1",
          "operatoryPM": "Op 1",
          "appointmentTypes": [
            { "type": "NP-A", "timePref": "AM" },
            { "type": "NP-C", "timePref": "AM" },
            { "type": "EP-A", "timePref": "none" },
            { "type": "EP-C", "timePref": "none" },
            { "type": "EM", "timePref": "none" }
          ]
        },
        {
          "day": "wednesday",
          "working": false,
          "startTime": null,
          "endTime": null,
          "lunchStart": null,
          "lunchEnd": null,
          "operatoryAM": null,
          "operatoryPM": null,
          "appointmentTypes": []
        }
        // ... etc for all 7 days
      ]
    },
    {
      "name": "Sarah",
      "type": "hygienist",
      "schedule": [
        {
          "day": "monday",
          "working": true,
          "startTime": "09:00",
          "endTime": "17:00",
          "lunchStart": "13:00",
          "lunchEnd": "14:00",
          "operatoryAM": "Op 3",
          "operatoryPM": "Op 3",
          "appointmentTypes": [
            { "type": "EP-A", "timePref": "none" },
            { "type": "EP-C", "timePref": "none" }
          ]
        }
        // ... etc for all 7 days
      ]
    }
  ],
  "appointmentTypes": [
    {
      "abbrev": "NP-A",
      "name": "New Patient Exam & Cleaning - Adult",
      "durationMinutes": 60
    },
    {
      "abbrev": "NP-C",
      "name": "New Patient Exam & Cleaning - Child",
      "durationMinutes": 30
    },
    {
      "abbrev": "EP-A",
      "name": "Established Patient Exam & Cleaning - Adult",
      "durationMinutes": 60
    },
    {
      "abbrev": "EP-C",
      "name": "Established Patient Exam & Cleaning - Child",
      "durationMinutes": 30
    },
    {
      "abbrev": "EM",
      "name": "Emergency Visit - Limited Exam",
      "durationMinutes": 30
    }
  ],
  "scheduleScreenshots": [
    {
      "filename": "schedule_week.png",
      "url": "https://storage.example.com/uploads/12345/schedule_week.png",
      "uploadedAt": "2026-01-13T10:30:00Z"
    },
    {
      "filename": "schedule_day.png",
      "url": "https://storage.example.com/uploads/12345/schedule_day.png",
      "uploadedAt": "2026-01-13T10:31:00Z"
    }
    // ... unlimited additional screenshots
  ],
  "notes": "Any additional scheduling preferences or instructions from the customer..."
}
```

---

## Decisions Made

| Question | Answer |
|----------|--------|
| Custom appointment types? | No - only the 5 defaults |
| Default durations? | Yes - 60 min (adults), 30 min (children), 30 min (emergency) |
| Operatory field type? | Free text (customer types whatever they call it) |
| Screenshot uploads? | Yes - unlimited, helps techs understand setup |

---

## Validation Rules

- Must have at least 1 provider
- Each provider must have at least 1 working day
- Working days must have start/end times
- Appointment durations must be > 0 minutes

---

## Notes

- This form captures scheduling configuration for Kate
- Will be used during self-onboarding
- PMS connection (via Nexhealth) will happen separately
- Screenshots help bridge the gap when form data isn't enough
