# Design Tool Pro: Figma Plugin

## 🚀 Overview

**Design Tool Pro** is a powerful Figma plugin that accelerates the design workflow by integrating AI-powered generation, data-driven design, and robust version control. It is built as a full-stack application, consisting of a Figma plugin interface, a web-based frontend (UI), and a dedicated backend service.

---

## 🎨 For Designers: How to Use the Plugin

### 1. Installation

You can install the **Design Tool Pro** plugin directly from the Figma Community:

[**Install Design Tool Pro from Figma Community**](https://www.figma.com/community/plugin/1572976306714112720 )

### 2. Feature Usage Guide

#### A. AI Generate: Create or Modify Designs

This feature allows you to use conversational AI to generate new designs or modify existing ones.

1.  **Start the Chat:** Open the plugin and navigate to the **AI Generate** tab.
2.  **Generate a New Design:** Type a description of the design you need (e.g., "Create a mobile login screen with a dark theme").
3.  **Modify an Existing Design:** Select a frame or component on your canvas, then type a modification request (e.g., "Change the primary button color to green" or "Add a 'Forgot Password' link").
4.  **Import:** Once the AI preview is satisfactory, click the **Import to Figma** button to place the design onto your canvas.

#### B. Paste JSON: Data-Driven Design

Use this feature to instantly convert structured data into a Figma design.

1.  **Prepare JSON:** Ensure your JSON data follows the required design schema (e.g., a list of items, component properties).
    *   *Example JSON Format (Conceptual):*
        ```json
        {
          "type": "FRAME",
          "name": "User Card",
          "children": [
            { "type": "TEXT", "content": "John Doe", "fontSize": 24 },
            { "type": "RECTANGLE", "color": "#007AFF" }
          ]
        }
        ```
2.  **Paste and Import:** Navigate to the **Paste JSON** tab, paste your JSON into the input area, and click **Import**. The plugin will render the design based on the data structure.

#### C. Export to JSON: Developer Handoff

Convert any Figma selection into a clean, structured JSON object for easy developer handoff.

1.  **Select Design:** Select the frame, group, or component you wish to export on your Figma canvas.
2.  **Export:** Navigate to the **Export** tab and click **Export to JSON**.
3.  **Copy:** The resulting JSON, which represents the design structure and properties, will appear and can be copied for use by the development team.

#### D. Versions: Save and Load Designs

This feature uses the user's database to save and manage design states.

1.  **Save a Version:**
    *   Select the design you want to save.
    *   Go to the **Versions** tab.
    *   Enter a descriptive name (e.g., "Homepage v2 - Final Review").
    *   Click **Save Version**. The design's JSON is stored in your personal database.
2.  **Load a Version:**
    *   Go to the **Versions** tab.
    *   Browse the list of saved versions.
    *   Select the desired version and click **Load** to import it back onto your canvas.

---

## 🛠️ For Developers: Setup and Local Development

This guide provides instructions for setting up the project locally for development and testing.

### 1. Project Structure

The repository is organized into the following key directories:

*   `backend/`: Contains the server-side logic, handling AI integration, database operations (for Versions), and API endpoints.
*   `frontend/`: Contains the web application (UI) that runs inside the Figma plugin iframe.
*   `figma-plugin/`: Contains the main plugin code that interacts with the Figma API and communicates with the frontend UI.

### 2. Prerequisites

Ensure you have the following installed:

*   Node.js (LTS version recommended)
*   npm or yarn
*   Python (if the backend is Python-based) or specific runtime for your backend technology.
*   Figma Desktop App

### 3. Local Setup

Follow these steps to get all components running:

#### 3.1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies (adjust command based on technology, e.g., `pip install -r requirements.txt` or `npm install`):
    ```bash
    # Example: Install dependencies
    npm install 
    ```
3.  Start the backend server:
    ```bash
    # Example: Start the server on a specific port (e.g., 8000)
    npm run dev 
    # OR
    # python manage.py runserver
    ```
    The backend should now be running locally (e.g., at `http://localhost:8000` ).

#### 3.2. Frontend/Plugin Setup

1.  Navigate back to the root directory and then into the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The frontend UI should be accessible locally (e.g., at `http://localhost:5173` ).

4.  Navigate to the Figma Plugin directory:
    ```bash
    cd ../figma-plugin
    ```
5.  Install dependencies:
    ```bash
    npm install
    ```
6.  Build the plugin code:
    ```bash
    npm run build
    ```

### 4. Critical Configuration: Connecting Plugin to Local Backend

To enable the Figma plugin to communicate with your local backend server, you must modify the base URL configuration.

**Action Required:** Locate the file that defines the base API URL and change the production URL to your local development URL (e.g., `http://localhost:8000` ).

| File to Modify | Purpose | Example Change |
| :--- | :--- | :--- |
| `figma-plugin/src/shared/constants/plugin-config.ts` | Contains the `BASE_API_URL` constant. | Change `https://task-creator-api.onrender.com` to `http://localhost:8000` |

### 5. Testing in Figma

1.  Open the Figma Desktop App.
2.  Go to **Plugins > Development > Import plugin from manifest...**
3.  Select the `manifest.json` file from the `figma-plugin` directory.
4.  Run the plugin. It should now connect to your locally running backend and frontend services.
