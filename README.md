# FloodReady MY

## Overview
FloodReady MY is a citizen flood readiness support platform built for the **Citizens First (GovTech & Digital Services)** track. It helps users prepare key personal, household, and document information, access guided flood support, use an e-KYC verification prototype, and monitor area-based aid signals in one system.

## Problem Statement
Flood-affected citizens often face both physical disruption and administrative friction. During emergencies, many people struggle to:
- understand what to do next
- keep important documents ready
- manage household needs under stress
- repeat the same information across different support steps

This becomes more difficult for households with children, elderly family members, medical needs, or limited transport.

## Solution
FloodReady MY reduces this friction by combining:
- guided support for before, during, and after flood situations
- saved citizen profile details
- saved household details
- saved document status
- an e-KYC verification prototype
- a flood monitoring and aid-trigger prototype

The system is designed to make support workflows faster, clearer, and easier to follow.

## Core Features
### Guided Flood Support
Users select their flood stage and immediate need, then receive:
- situation summary
- top 3 actions now
- quick documents needed
- aid status hint
- detailed guidance
- final checklist

### Saved Citizen Profile
Stores essential user details such as:
- full name
- IC number
- phone number
- address
- state
- district

### Saved Household Details
Stores household-related information such as:
- adults and children
- elderly person present
- medical needs
- disabled person present
- pregnant person present
- pets
- transport availability

### Saved Document Status
Tracks readiness of key documents such as:
- identity documents
- family records
- medical records
- proof of address
- financial documents
- supporting documents

### e-KYC Verification Prototype
Provides a simple identity verification flow with:
- camera preview
- simulated IC-based verification
- mock citizen record retrieval

### Flood Monitoring and Aid Trigger Prototype
Provides a dashboard with:
- station-level water data
- rainfall-related information
- area-based aid checks
- simplified aid-trigger logic

## Technology Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python Flask
- **AI:** Google Gemini API
- **Deployment:** Google Cloud Run
- **Version Control:** GitHub
- **Data Handling:** Mock JSON data and browser localStorage

## Google AI Usage
FloodReady MY uses the **Google Gemini API** to generate short, scenario-based flood guidance. The AI layer helps tailor responses based on:
- selected flood stage
- selected user need
- saved citizen profile
- saved household details
- saved document readiness

Fallback logic is included so the system can still return backup guidance if the live AI service is temporarily unavailable.

## Architecture
FloodReady MY consists of six main modules:
1. Guided Support Module
2. Citizen Profile Module
3. Household Details Module
4. Document Status Module
5. e-KYC Verification Module
6. Relief Trigger Module

## Local Setup Instructions

### Prerequisites
- Python 3.10 or above
- Git
- A valid Gemini API key

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/floodready-my.git
   cd floodready-my

2. Create and activate a virtual environment:
    ```bash
    python -m venv venv
    venv\Scripts\activate

3. Install dependencies:
    ```bash
    pip install -r requirements.txt

4. Create a .env file in the project root and add:
    ```bash
    GEMINI_API_KEY=YOUR_API_KEY_HERE

5. Run the app:
    ```bash
    python app.py

6. Open the app in your browser:
    ```bash
    http://127.0.0.1:8080


## Deployment
This project is deployed on Google Cloud Run.

##Live Deployment
Cloud Run URL: https://floodready-my-139465179101.asia-southeast1.run.app/profile/citizen
Repository
GitHub Repository: https://github.com/basildevanand-creator/floodready-my

##AI Disclosure
This project used Google Gemini and AI-assisted development tools during the development. All AI-assisted code, content, and implementation decisions were reviewed, edited, and understood by the team before submission.

##Future Improvements
secure document storage
stronger authentication and access control
live agency or service integration
more advanced aid eligibility workflows
improved offline support for emergency situations
