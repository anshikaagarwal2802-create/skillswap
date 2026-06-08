# SkillSwap AI – Teach to Earn Learning Platform

A peer-to-peer visual learning marketplace where you teach skills to earn **SkillCoins**, which you can spend to learn new skills from others, featuring AI matching, verified badges, and personalized learning roadmaps.

---

## 🚀 Key Features

1. **Skill Swap Marketplace**
   - Browse other community members.
   - Filter by mutually beneficial educational overlaps.
   - Run AI matching using Gemini to compare profile skills and compute exact compatibility alignments.

2. **AI Study Roadmaps & Co-Pilot**
   - Generate customized 6-week learning roadmaps.
   - Co-pilot writes detailed study guides, homework assignments, and cards instantly for any topic.

3. **AI Skill verification Badge**
   - Take interactive AI checks to qualify for expert verification badges.
   - Awarded badges appear directly on user profiles.

4. **Active Classrooms Simulation**
   - Live workspace with chat messaging.
   - Shared collaborative scratchpad and virtual video/audio indicator toggles.
   - Process completion feedback to distribute coins and improve reputation scores.

---

## 🛠️ Step-by-Step: How to Upload to GitHub

Even if you don't see an "Export" button directly in your layout, you can easily save your workspace manually to publish it on GitHub!

### Step 1: Initialize Your Local Repository
1. Save all your workspace files locally in a folder named `skillswap-ai`.
2. Open your terminal or command prompt inside that folder and initialize a Git repository:
   ```bash
   git init
   ```

### Step 2: Create a Repository on GitHub
1. Go to [github.com](https://github.com) and sign in.
2. Click the **"New"** button to create a new repository.
3. Name it `skillswap-ai`, keep it Public or Private, and click **"Create repository"** (do NOT initialize it with README, .gitignore, or license, as we already have them).

### Step 3: Commit and Push Your Code
Copy and Paste the following commands in your terminal or command prompt:
```bash
# Add all files to staging
git add .

# Create the first commit
git commit -m "feat: complete SkillSwap AI peer-to-peer learning prototype"

# Rename your default branch to main
git branch -M main

# Link your local repository to your GitHub repository
# (Replace USERNAME and REPO with your actual GitHub account details)
git remote add origin https://github.com/USERNAME/skillswap-ai.git

# Push the code to GitHub!
git push -u origin main
```

---

## 💻 Local Development Setup

To run this application on your local machine:

### 1. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root folder and add your Gemini API key (obtained from Google AI Studio):
```env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
PORT=3000
```

### 3. Start Development Server
Run the Node.js Express & Vite full-stack developer server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ☁️ How to Deploy the Full-Stack App

Since this app features a full-stack architecture with a lightweight Node/Express backend (and Vite handling state clients), it is best deployed on services that support Node.js processes.

### Deploying to Render
1. Log in to [Render.com](https://render.com) and click **"New"** -> **"Web Service"**.
2. Connect your **GitHub repository**.
3. Configure the following parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start`
4. Add the following **Environment Variables** in Render's configuration tab:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API Secret)*
   - `NODE_ENV`: `production`
5. Click **"Deploy Web Service"**.

### Deploying to Railway or Google Cloud Run
- Both platforms will automatically look at your `package.json` configurations, run `npm run build`, and launch the server using `npm run start` on port `3000`.
- Remember to configure your `GEMINI_API_KEY` under their system variable settings.
