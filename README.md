# Blender Automator

**Blender Automator** is a web app that lets you turn text prompts into 3D Blender scenes. You type what you want, and the app builds the model, renders a preview, and gives you a `.blend` file to download.

---

## Features

- Enter a prompt to create.
- The app uses AI to turn that into Blender code  
- It runs Blender in the background to create the scene  
- You get a rendered image and the `.blend` file  
- You can log in and keep track of your past projects

---

## Requirements

You’ll need these installed:

- [Node.js](https://nodejs.org/) 
- [Python](https://www.python.org/downloads/)  
- [Blender](https://www.blender.org/download/)
- [PostgreSQL](https://www.postgresql.org/download/)

---

## Getting Started

1. **Clone the repo**

    ```
    git clone https://github.com/your-username/blender-automator.git
    cd blender-automator
    ```

2. **Install dependencies**

    ```
    npm install
    ```

3. **Set up your environment**

    Edit the `.env` file

    ```
    DATABASE_URL=postgresql://your_user:your_password@localhost:5432/blenderdb
    GEMINI_API_KEY=your_google_genai_key
    OUTPUT_DIR=./output
    BLENDER_TIMEOUT=30000
    ```

4. **Set up the database**

    ```
    npx prisma generate
    npx prisma migrate dev --name init
    ```

5. **Run the website**

    ```
    npm run dev
    ```

---

## How It Works

1. You enter a prompt (e.g. “Create a human figure man”)  
2. AI turns it into a Blender Python script  
3. Blender runs the script and saves the scene  
4. The app shows a preview and gives you the files to download

---

## Example Prompts

- “Make a medieval tower with arched windows”  
- “Design a futuristic car with chrome”  
- “Create a playground with a slide and swings”

---

## Screenshots

![image](https://github.com/user-attachments/assets/404486b9-17de-4324-b0c9-1a0c2090d41a)

---

## Links 

[https://thesolutionhacks.site/](url)
