# Resume Generator

An AI-powered resume generator that helps users create professional resumes with customizable templates and AI-driven content suggestions.

## Features

- AI-powered content generation
- Multiple resume templates
- Real-time preview
- PDF export functionality
- User authentication
- Resume history tracking
- Mobile-responsive design

## Tech Stack

- Frontend: React.js
- Backend: FastAPI (Python)
- Database: MongoDB
- AI Integration: OpenAI API
- Authentication: JWT
- File Storage: Local storage (with cloud storage option)

## Getting Started

### Prerequisites

- Python 3.8 or higher
- MongoDB
- OpenAI API key

### Installation

1. Clone the repository
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=resume-generator
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```
5. Create necessary directories:
   ```bash
   mkdir -p static/templates uploads
   ```
6. Start the development server:
   ```bash
   uvicorn main:app --reload
   ```

## Project Structure

```
resume-generator/
├── app/                    # Python application package
│   ├── core/              # Core functionality
│   ├── models/            # Pydantic models
│   ├── routers/           # API routes
│   └── db/                # Database utilities
├── static/                # Static files
│   └── templates/         # Resume templates
├── uploads/              # User uploads directory
├── main.py              # Application entry point
└── requirements.txt     # Python dependencies
```

## API Documentation

The API documentation is available at `/docs` when running the server.

### Authentication Endpoints
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/profile - Get user profile

### Resume Endpoints
- POST /api/resumes - Create new resume
- GET /api/resumes - Get user's resumes
- GET /api/resumes/{id} - Get specific resume
- PUT /api/resumes/{id} - Update resume
- DELETE /api/resumes/{id} - Delete resume
- POST /api/resumes/{id}/profile-picture - Upload profile picture

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 