# Project Summary
PagePolly is an open-source web crawler and dashboard tool designed to automate the monitoring of approximately 150 supplier websites. It integrates with the ScrapingBee API to extract critical data such as URLs, headings, and metadata, which are stored in a PostgreSQL database. The project aims to streamline supplier product monitoring, ensuring accurate product listings on partner sites and providing actionable insights through a user-friendly dashboard interface.

# Project Module Description
- **Web Crawler**: Utilizes the ScrapingBee API to crawl multiple websites and extract relevant data.
- **Dashboard**: A React-based interface that displays crawled data, site management, and crawl statuses.
- **API Services**: Facilitates communication between the frontend and backend, managing site data and crawl operations.
- **Database Management**: Employs PostgreSQL for storing crawled data and site information, ensuring data integrity and historical tracking.

# Directory Tree
```
pagepolly/
├── frontend/                  # Frontend React application
│   ├── public/                # Public assets
│   │   ├── index.html         # Main HTML file
│   │   └── manifest.json      # Web app manifest
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Application pages
│   │   ├── App.js            # Main App component
│   │   ├── index.js          # Entry point for React
│   │   └── App.css           # Styles for the application
├── backend/                   # Node.js backend
│   ├── src/
│   │   ├── index.js          # Main entry point for backend
│   │   ├── config/           # Configuration files
│   │   ├── services/         # Business logic services
│   │   └── routes/           # API routes
├── .gitignore                 # Git ignore file
├── README.md                  # Project overview and setup instructions
├── package.json               # Frontend dependencies and scripts
└── backend/package.json       # Backend dependencies and scripts
```

# File Description Inventory
- **frontend/package.json**: Contains dependencies, scripts, and configuration for the frontend React application.
- **backend/package.json**: Contains dependencies, scripts, and configuration for the backend Express application.
- **.gitignore**: Specifies files and directories to be ignored by Git.
- **README.md**: Provides an overview of the project, setup instructions, and usage guidelines.
- **frontend/.env.example**: Example environment variables for frontend configuration.
- **backend/.env.example**: Example environment variables for backend configuration.
- **frontend/public/index.html**: The main HTML file for the React application.
- **frontend/src/index.js**: Entry point for the React application.
- **frontend/src/App.js**: Main component of the React application.
- **backend/src/index.js**: Main entry point for the backend application.

# Technology Stack
- **Frontend**: React, JavaScript, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **API**: ScrapingBee API
- **Testing**: Jest

# Usage
1. **Copy Initial Files**: 
   - Use the following commands to copy the essential files from the workspace:
     ```bash
     cp -r /data/chats/x77ild/workspace/frontend ~/PagePolly/
     cp -r /data/chats/x77ild/workspace/backend ~/PagePolly/
     ```
2. **Install Dependencies**: 
   - For the frontend:
     ```bash
     cd ~/PagePolly/frontend
     npm install
     ```
   - For the backend:
     ```bash
     cd ../backend
     npm install
     ```
3. **Create a Pull Request**:
   ```bash
   cd ~/PagePolly
   git checkout -b feature/initial-setup
   git add .
   git commit -m 'Initial PagePolly setup'
   git push -u origin feature/initial-setup
   ```
