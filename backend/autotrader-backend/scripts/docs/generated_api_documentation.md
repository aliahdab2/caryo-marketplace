# AutoTrader Marketplace API Documentation

This documentation is automatically generated from the Postman collections.

Last updated: Fri May  9 10:14:48 CEST 2025

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Reference Data](#reference-data)
4. [Listings](#listings)
5. [User Management](#user-management)

## Overview

The AutoTrader Marketplace API provides endpoints for managing car listings, user accounts, and reference data.

## Authentication

Authentication is handled using JWT tokens. To authenticate:

1. Register a new user via POST /auth/signup
2. Login via POST /auth/signin to obtain a token
3. Include the token in subsequent requests in the Authorization header: `Bearer <token>`

