# Arbis 🏗️

A web editor for architectural floor plans with 2D and 3D visualization. It runs in the browser and comes with tools for drawing walls and placing doors, windows, furniture and other layout elements.

## ✨ Key features

- 🎨 **Clean interface**: minimalist, Figma-style design
- 📐 **Precise drawing**: snapping to the grid, nodes and orthogonal directions
- 🧱 **Wall drawing**: walls built from nodes with automatic snapping
- 🚪 **Openings**: doors and windows placed directly on walls
- 🪑 **Furniture library**: 3D furniture models placed on the plan
- 🏠 **3D view**: explore the plan in 3D, including a first-person mode
- 📊 **Layers**: organize objects and toggle their visibility
- 🖼️ **Background images**: trace over an existing plan
- ⌨️ **Keyboard shortcuts**: quick access to every tool
- 🔍 **Zoom & pan**: smooth navigation around the plan
- 💾 **Autosave**: changes are saved automatically
- 🤖 **AI assistant**: smart help with planning
- 📄 **Project management**: create and manage multiple projects

## 🚀 Installation

### Requirements

Make sure the following tools are installed before you start.

#### 1. Node.js and npm

The project requires **Node.js 20.17.9 or later** and **npm 10.0.0 or later**.

**Check versions:**

```bash
node --version  # should be >= 20.17.9
npm --version   # should be >= 10.0.0
```

**Install Node.js:**

- **Windows/Mac**: download from the [official website](https://nodejs.org/)
- **Linux**: use nvm (Node Version Manager):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  nvm install 20.17.9
  nvm use 20.17.9
  ```

**Alternative: nvm (recommended)**

The project includes `.nvmrc` and `.node-version` files, so the Node.js version is picked automatically:

```bash
# With nvm
nvm install
nvm use

# With fnm (Fast Node Manager)
fnm install
fnm use
```

#### 2. Package manager

The project uses **pnpm** (recommended) or **npm**.

**Install pnpm:**

```bash
npm install -g pnpm
```

**Check the installation:**

```bash
pnpm --version
```

#### 3. PostgreSQL

**PostgreSQL 12 or later** is required.

**Install PostgreSQL:**

- **Windows**: download the installer from the [official website](https://www.postgresql.org/download/windows/)
- **macOS**:
  ```bash
  brew install postgresql@14
  brew services start postgresql@14
  ```
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  sudo systemctl start postgresql
  sudo systemctl enable postgresql
  ```

**Create the database:**

After installing PostgreSQL, create a database for the project:

```bash
# Open PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE buildplanner;

# Create a user (optional)
CREATE USER buildplanner_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE buildplanner TO buildplanner_user;

# Exit psql
\q
```

#### 4. Git (optional)

To clone the repository:

```bash
git --version
```

### Step-by-step setup

#### Step 1: Clone the repository

```bash
git clone <repository-url>
cd buildplanner
```

#### Step 2: Install dependencies

**With pnpm (recommended):**

```bash
pnpm install
```

**With npm:**

```bash
npm install
```

This may take a few minutes, since it installs all required dependencies, including:

- Next.js and React
- Prisma ORM
- Three.js for 3D visualization
- NextAuth for authentication
- Other project dependencies

#### Step 3: Configure environment variables

Create a `.env` file in the project root from the example:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

Open `.env` and set the following variables:

```env
# Database
# Replace with your actual PostgreSQL connection details
DATABASE_URL="postgresql://postgres:password@localhost:5432/buildplanner?schema=public"

# NextAuth
# Generate a secret key (at least 32 characters)
# Windows (PowerShell):
# [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
# Linux/Mac:
# openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"

# App URL
NEXTAUTH_URL="http://localhost:3000"

# Yandex Cloud API (optional, for the AI assistant)
# Get a key here: https://yandex.cloud/en/docs/iam/concepts/authorization/api-key
YANDEX_CLOUD_API_KEY="your-api-key-here"
YANDEX_CLOUD_PROJECT_ID="your-project-id"
YANDEX_CLOUD_AGENT_ID="your-agent-id"
```

**Important:**

- Replace `postgres:password` with your real PostgreSQL credentials
- Generate a unique `NEXTAUTH_SECRET`
- If you don't use the AI assistant, you can leave the Yandex Cloud variables empty

#### Step 4: Set up the database

**Generate the Prisma Client:**

```bash
pnpm run db:generate
# or
npm run db:generate
```

**Apply the schema:**

```bash
pnpm run db:push
# or
npm run db:push
```

This creates all tables defined in the Prisma schema.

**Alternative (with migrations):**

```bash
pnpm run db:migrate
# or
npm run db:migrate
```

#### Step 5: Run the project

**Development mode:**

```bash
pnpm dev
# or
npm run dev
```

The server starts at `http://localhost:3000`.

**Check that it works:**

- Open http://localhost:3000 in your browser
- You should see the app's home page

### More commands

#### Production mode

```bash
# Build
pnpm build
# or
npm run build

# Start the production server
pnpm start
# or
npm run start
```

#### Database

```bash
# Open Prisma Studio (database GUI)
pnpm db:studio
# or
npm run db:studio

# Apply schema changes without migrations
pnpm db:push

# Create a new migration
pnpm db:migrate
```

#### Linting

```bash
pnpm lint
# or
npm run lint
```

### Troubleshooting

#### "Cannot find module" or import errors

**Fix:**

```bash
# Remove node_modules and the lock file
rm -rf node_modules pnpm-lock.yaml
# or on Windows
Remove-Item -Recurse -Force node_modules, pnpm-lock.yaml

# Reinstall dependencies
pnpm install
```

#### Database connection error

**Check that:**

1. PostgreSQL is running
2. `DATABASE_URL` in `.env` is correct
3. The `buildplanner` database exists
4. The user has access to the database

**Test the connection:**

```bash
psql -U postgres -d buildplanner
```

#### "Prisma Client not generated"

**Fix:**

```bash
pnpm db:generate
```

#### Port 3000 is already in use

**Fix:**
Change the port in the start command:

```bash
pnpm dev -- -p 3001
```

Or set an environment variable:

```bash
PORT=3001 pnpm dev
```

#### TypeScript errors during build

**Fix:**

```bash
# Clear the Next.js cache
rm -rf .next
# or on Windows
Remove-Item -Recurse -Force .next

# Rebuild
pnpm build
```

## 📚 Usage

### Main pages

- **Home**: http://localhost:3000
- **Sign up**: http://localhost:3000/signup
- **Sign in**: http://localhost:3000/signin
- **Dashboard**: http://localhost:3000/dashboard
- **Project editor**: http://localhost:3000/projects/[projectId]

### Keyboard shortcuts

- `V` - Select tool
- `W` - Draw walls
- `D` - Add doors
- `Shift+W` - Add windows
- `R` - Room tool
- `F` - Furniture tool
- `Ctrl+Z` / `Ctrl+Y` - Undo / Redo
- `Delete` - Delete the selected object
- `Esc` - Clear selection / finish drawing
- `Space` - Toggle 2D/3D view

### Editor navigation

- **Mouse wheel** - Zoom
- **Middle mouse button** or **Shift + left click** - Pan the plan
- **Left click** - Select and interact with objects
- **Right click** - Context menu

## 🛠️ Tech stack

- **Next.js 15.5.0** - React framework with the App Router
- **React 18.3.1** - UI library
- **TypeScript 5.7.2** - Type safety
- **Tailwind CSS 3.4.17** - Styling
- **Prisma 6.1.0** - Database ORM
- **PostgreSQL** - Relational database
- **NextAuth 5.0.0-beta.25** - Authentication and authorization
- **Three.js 0.181.2** - 3D graphics and visualization
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for Three.js
- **Zustand 5.0.8** - State management
- **Radix UI** - Accessible UI components
- **Lucide React** - Icons

## 📁 Project structure

```
buildplanner/
├── .github/
│   └── workflows/          # CI/CD configuration
├── prisma/
│   ├── migrations/         # Database migrations
│   └── schema.prisma       # Database schema
├── public/
│   ├── furniture/          # 3D furniture models (GLB)
│   ├── plans/              # Plan templates
│   └── textures/           # Wall and floor textures
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth pages
│   │   ├── (dashboard)/    # Protected pages
│   │   ├── api/            # API routes
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── editor2d/       # 2D editor components
│   │   ├── editor3d/       # 3D view components
│   │   ├── layout/         # Layout components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # React hooks
│   ├── lib/
│   │   ├── editor/         # Editor logic
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── store/              # State management (Zustand)
│   └── types/              # TypeScript types
├── .env.example            # Example environment file
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🐳 Docker (optional)

The project can run in Docker. See [DOCKER.md](./DOCKER.md) for details.

## 🧪 Development

### Adding dependencies

```bash
# Production dependencies
pnpm add <package-name>

# Development dependencies
pnpm add -D <package-name>
```

### Database

```bash
# Open Prisma Studio
pnpm db:studio

# Create a new migration after changing schema.prisma
pnpm db:migrate

# Apply changes without creating a migration
pnpm db:push
```

### Data model

Main models:

- `User` - App users
- `Project` - Floor plan projects
- `PlanVersion` - Plan versions
- `ChatMessage` - AI assistant messages
- `Document` - Project documents

See `prisma/schema.prisma` for the full schema.

## 🎯 Roadmap

- [x] Basic wall drawing
- [x] Doors and windows
- [x] Layers
- [x] Background images
- [x] Keyboard shortcuts
- [x] 3D view
- [x] Furniture library
- [x] Autosave
- [x] AI assistant
- [ ] Dimension tool
- [ ] Export to PNG/SVG/DXF/PDF
- [ ] Real-time collaboration
- [ ] Mobile version

## 🤝 Contributing

Suggestions and improvements are welcome!

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT

## 🔗 Useful links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Three.js Documentation](https://threejs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)

## 📞 Support

If you run into problems installing or running the project, please open an issue in this repository.

---

**Enjoy working with BuildPlanner! 🚀**
