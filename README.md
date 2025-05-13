# Car Marketplace Application

A full-stack application for buying and selling cars, featuring authentication, car listings, and user management.

## Project Documentation

For detailed information about this project, refer to these documents:

- [Development Plan](DEVELOPMENT_PLAN.md) - Complete roadmap for the project
- [System Design](docs/system_design.md) - Architecture and technology choices
- [Testing Plan](docs/testing_plan.md) - Testing strategy and approach

## Developer Guidelines for Large Files

This repository uses Git LFS (Large File Storage) to handle large files. To work with this repository:

1. **Install Git LFS**:
   ```
   # macOS
   brew install git-lfs

   # Ubuntu/Debian
   sudo apt-get install git-lfs
   ```

2. **Initialize Git LFS**:
   ```
   git lfs install
   ```

3. **Large file types that are automatically tracked by Git LFS**:
   - Binary files: `.jar`, `.war`, `.zip`, `.tar.gz`
   - Node.js binaries: `.node`
   - Minified JavaScript: `.min.js`
   - Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`

4. **Do not commit**:
   - `node_modules` directories
   - Build directories (`build`, `target`, etc.)
   - Database files
   - Log files
   - Large data exports

5. **Utility scripts**:
   - `./find-large-git-objects.sh` - Find large objects that might cause issues
   - `./cleanup-large-files.sh` - Clean up tracked large files that should be ignored

## Project Structure

```
autotrader-marketplace/
├── backend/
│   └── autotrader-backend/   # Spring Boot Java backend
└── frontend/                 # Frontend (coming soon)
```

## Backend

The backend is built with Spring Boot and provides RESTful APIs for authentication and car listings.

See [backend/autotrader-backend/README.md](backend/autotrader-backend/README.md) for detailed backend documentation, including:

- Setup instructions
- API documentation
- Running tests
- Development notes

## API Documentation

Detailed API documentation is available in [backend/autotrader-backend/API_DOCUMENTATION.md](backend/autotrader-backend/API_DOCUMENTATION.md), which includes:

- Authentication endpoints
- Car listing endpoints
- Request/response formats
- Examples using cURL

## Getting Started

### Prerequisites

- Java 21
- Gradle
- Node.js (for frontend, coming soon)
- PostgreSQL (for production)

### Running the Application

#### Backend

```bash
cd backend/autotrader-backend
./gradlew bootRun
```

#### Frontend (coming soon)

```bash
cd frontend
npm start
```

## Contributing

1. Create feature branches from `develop`
2. Write tests for new features
3. Run ALL tests locally before submitting PRs
4. Submit PRs to the `develop` branch

## License

This project is licensed under the MIT License.
