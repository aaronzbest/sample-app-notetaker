# NoteTaker App

A simple note-taking application built with Node.js/Express backend and native Web Components frontend.

## Features

- User registration and authentication
- Create, read, update, and delete notes
- Responsive design
- Local SQLite database storage
- JWT-based authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3001`

3. Create an account or login with existing credentials

### Available Scripts

- `npm start` - Run the production server
- `npm run dev` - Run the development server with auto-restart
- `npm run build` - Build TypeScript files (if using TypeScript)

## Project Structure

```
src/
├── server/
│   └── index.js          # Express server and API routes
├── database/
│   └── db.js             # SQLite database setup and queries
└── public/
    ├── index.html        # Main HTML file
    ├── css/
    │   └── styles.css    # Application styles
    └── js/
        ├── app.js        # Main application logic
        ├── utils.js      # Utility functions and API service
        └── components/   # Web Components
            ├── auth-form.js
            ├── note-list.js
            └── note-editor.js
```

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### Notes
- `GET /api/notes` - Get all user notes
- `GET /api/notes/:id` - Get specific note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Authentication**: JWT, bcryptjs
- **Frontend**: Native Web Components, Vanilla JavaScript
- **Styling**: CSS3

## License

ISC
