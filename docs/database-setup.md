# RescueBridge Database Setup

This project uses Supabase as the backend and database service for the RescueBridge Iteration Planning 1 prototype.

## Backend Service

Supabase is used for:

- Help request records
- Resource availability records
- Organization status records
- Volunteer verification records
- Volunteer approval status
- Volunteer task records

## Main Tables

The main Supabase tables are:

- help_requests
- resources
- organization_status
- volunteers
- tasks

## Environment Variables

Each developer must create a local .env file in the project root.

Example:

EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key

The real .env file must not be committed to GitHub.

## Security Notice

The current Supabase policies are for classroom prototype testing only. Before real-world use, the project should include Supabase Auth, stricter Row Level Security policies, and role-based access control.
