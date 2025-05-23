# Setting up app.env in the Database

To ensure proper loading of environment-specific data in PostgreSQL, we need to set the `app.env` parameter in the database.

## Automatic Setup

The database initialization now includes setting the `app.env` parameter automatically in the Docker Compose setup.

## Manual Setup (if needed)

If you need to manually set this parameter, you can run:

```bash
# Connect to the database container
docker exec -it autotrader_dev-postgres-1 psql -U postgres -d autotrader

# Inside the PostgreSQL shell
ALTER DATABASE autotrader SET app.env TO 'development';

# Exit the shell
\q
```

## How It Works

Sample data scripts (like `R__sample_car_listings.sql`) check for the development environment using:

1. PostgreSQL parameter `app.env = 'development'`
2. PostgreSQL parameter `spring.profiles.active` containing 'dev'
3. Fallback to load data anyway since these files are in the 'dev' directory

This ensures sample data is properly loaded in development environments.
