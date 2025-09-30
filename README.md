# Client Management Platform

A full-stack client management platform built with React, Node.js, and Appwrite.

## Features

- 🏢 **Company Management** - Add, edit, and organize client companies with tier classifications
- 📅 **Meeting Scheduling** - Schedule meetings with RSVP functionality and notes
- 💰 **Payment Tracking** - Record and track client payments with history
- 👥 **User Management** - Secure admin-only user creation with role-based permissions
- 📊 **Dashboard Overview** - Real-time insights into company metrics and upcoming activities
- 🔐 **Authentication** - Secure JWT-based authentication system

## Tech Stack

### Frontend
- **React** with TypeScript
- **Material-UI (MUI)** for components
- **React Router** for navigation
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Appwrite** for database and authentication
- **JWT** for session management
- **bcrypt** for password hashing

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── types/         # TypeScript type definitions
│   │   └── hooks/         # Custom React hooks
│   └── public/
├── backend/           # Node.js backend API
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── routes/        # API routes
│   └── scripts/       # Utility scripts
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Appwrite account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/client-management-platform.git
   cd client-management-platform
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   
   Create `.env` files in both frontend and backend directories:
   
   **Backend `.env`:**
   ```
   NODE_ENV=development
   PORT=3001
   APPWRITE_ENDPOINT=your_appwrite_endpoint
   APPWRITE_PROJECT_ID=your_project_id
   APPWRITE_API_KEY=your_api_key
   APPWRITE_DATABASE_ID=your_database_id
   JWT_SECRET=your_jwt_secret
   ```
   
   **Frontend `.env`:**
   ```
   REACT_APP_API_URL=http://localhost:3001
   ```

5. **Start the development servers**
   
   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend:**
   ```bash
   cd frontend
   npm start
   ```

## Deployment

This project is configured for easy deployment on:

- **Frontend**: Vercel or Netlify
- **Backend**: Railway, Render, or Heroku
- **Database**: Appwrite Cloud

See deployment guides in the respective platform documentation.

## Scripts

### Backend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run cleanup:orphaned` - Clean up orphaned data

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.