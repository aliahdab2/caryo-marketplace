# Folder Structure

This document provides an overview of the folder structure for the **Car Marketplace** project. The project is organized into several key folders for better maintainability and scalability.

```
car-marketplace/
├── backend/                # Spring Boot microservices and MCP gateway
│   ├── src/               # Java source code for microservices
│   ├── application.properties # Configuration files
│   └── pom.xml            # Maven dependencies and build configuration
├── deployments/           # Docker Compose & Kubernetes manifests
│   ├── docker-compose.yml # Development environment orchestration
│   ├── k8s/               # Kubernetes manifests (if applicable)
│   └── README.md          # Deployment instructions
├── docs/                  # Project documentation (system design, testing, roadmap)
│   └── folder_structure.md
├── frontend/              # React frontend
│   ├── public/            # Static files like index.html, images, etc.
│   ├── src/               # React source code
│   └── package.json       # Frontend dependencies and scripts
├── scripts/               # Database setup, admin tools, and utilities
│   ├── db/                # Database scripts (migrations, seed data)
│   └── utils/             # Helper scripts for automation tasks
├── docker-compose.yml     # Main file to set up the Docker environment
└── README.md              # Main project overview
```