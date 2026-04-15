# 📘 LegacyMark Automation Playbook
**Your Guide to Building Intelligent Agency Workflows**

With the new "Engine V2" (AI + Omnichannel + Connectivity), your agency can automate complex processes. Here are 5 powerful recipes you can build right now.

---

## 1. 🧠 Smart Lead Routing (The "AI Gatekeeper")
**Goal**: Instantly separate "hot leads" from "spam" or "angry customers".

- **Trigger**: Webhook (from Landing Page / Typeform)
- **Step 1 (AI)**: `AI Agent` -> Task: **SENTIMENT**
- **Step 2 (Logic)**: `Condition` -> If `ai_sentiment` equals **POSITIVE**
- **Step 3 (True)**: `Slack` -> Message: "🔥 HOT LEAD: {{name}} is interested!" -> Sales Channel
- **Step 3 (False)**: `Slack` -> Message: "⚠️ Review needed for {{name}}" -> Support Channel

---

## 2. 📱 Omnichannel VIP Onboarding
**Goal**: Wow high-ticket clients with a personal mobile touch.

- **Trigger**: Form Submission (New Client Onboarding)
- **Step 1 (Action)**: `Email` -> Subject: "Welcome to the Agency!" (Standard Receipt)
- **Step 2 (Wait)**: `Wait` -> **2 Minutes** (Feels natural)
- **Step 3 (Mobile)**: `WhatsApp` -> Message: "Hi {{name}}, CEO here. Saw you just joined. Check your email for next steps! 🚀"

---

## 3. 🛡️ The "Auto-Apology" System
**Goal**: Handle bad reviews immediately, even at 3 AM.

- **Trigger**: Webhook (from TrustPilot / Google Reviews)
- **Step 1 (AI)**: `AI Agent` -> Task: **GENERATION**
    - Prompt: "Write a humble, short apology for this complaint: {{message}}"
- **Step 2 (Action)**: `Email` -> Subject: "Regarding your review"
    - Body: "Hi {{name}}, <br> {{ai_response}} <br> Best, Support Team"
- **Step 3 (Internal)**: `Discord` -> Message: "🚨 Bad Review detected from {{name}}. Auto-reply sent."

---

## 4. 🔗 The "Zapier Killer" (Data Sync)
**Goal**: Sync new leads to your CRM (HubSpot/Airtable/Notion) without paying for Zapier.

- **Trigger**: Form Submission
- **Step 1 (Connect)**: `HTTP Request`
    - Method: **POST**
    - URL: `https://api.airtable.com/v0/appXYZ/Leads`
    - Data: Sent automatically from Trigger Data
- **Step 2 (Notify)**: `SMS` -> To: Operations Manager -> "New lead synced to Airtable: {{name}}"

---

## 5. 🔁 The "Patient Nurture" (Drip Campaign)
**Goal**: Convert cold leads over time without lifting a finger.

- **Trigger**: Webhook (E-book Download)
- **Step 1**: `Email` -> "Here is your PDF"
- **Step 2**: `Wait` -> **2 Days**
- **Step 3**: `Email` -> "Did you read Chapter 1?"
- **Step 4**: `Wait` -> **3 Days**
- **Step 5**: `AI Agent` -> Task: **GENERATION** (Generate specific tip based on industry)
- **Step 6**: `Email` -> "Thinking about your business: {{ai_response}}"
