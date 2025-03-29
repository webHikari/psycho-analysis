# Psycho-Analysis

This project is a web application for psychological analysis of Telegram users. It consists of a server component with a Telegram bot that analyzes messages, and a client web interface for viewing the analysis results.

## Features

-   Telegram bot integration for message collection and analysis
-   AI-powered psychological profiling using Mistral AI
-   User authentication system
-   Dashboard with statistics and user activity
-   Message history viewing
-   User profiles with psychological analysis

## Prerequisites

-   Docker and Docker Compose
-   Node.js (for local development)
-   Telegram Bot Token (from BotFather)
-   Mistral API Key

## Environment Variables

Create a `.env` file in the root directory with the following variables:


BOT_TOKEN=
MISTRAL_API_KEY=
JWT_SECRET=

## Getting Started

### Using Docker (Recommended)

Clone the repository:

```bash
git clone https://github.com/yourusername/psycho-analysis.git
```

The application will be available at:

Client: http://localhost:5173
Server API: http://localhost:3000

### How to run the project backend

Navigate to the server directory:

Create a .env file in the server directory with the required environment variables.
Start the development server:

```bash
docker-compose up --build
```

### Client Setup

Navigate to the client directory:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Project will be available at:

http://localhost:5173

Login: admin
Password: admin
