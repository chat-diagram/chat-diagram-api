# Chat Diagram API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Chat Diagram is a modern diagramming tool that leverages AI to help users create and manage diagrams efficiently. This repository contains the backend API built with NestJS.

## Features

- 🤖 AI-powered diagram generation
- 👥 User authentication and authorization
- 📊 Diagram management and versioning
- 🔗 Diagram sharing functionality
- 💳 Payment integration (Alipay)
- 🔄 Subscription management

## Tech Stack

- **Framework**: NestJS
- **Database**: MySQL
- **Authentication**: JWT
- **AI Integration**: OpenAI/Deepseek API
- **Payment**: Alipay

## Prerequisites

- Node.js (v16 or higher)
- pnpm
- MySQL
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chat-diagram-api.git
cd chat-diagram-api
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration

## Development

```bash
# Development
pnpm run start:dev

# Production
pnpm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
```
http://localhost:3000/api
```

## Environment Variables

See `.env.example` for all required environment variables.

## Project Structure

```
src/
├── auth/           # Authentication module
├── config/         # Configuration module
├── diagrams/       # Diagram management
├── openai/         # AI integration
├── payments/       # Payment processing
├── projects/       # Project management
├── tasks/          # Background tasks
└── users/          # User management
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
