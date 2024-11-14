# QuickPubMed Vue 2 Application

## Development Workflow

### Local Development
1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd [folder-name]
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
    
3. **Fill in values for .env file**
   
   check the .env.example file to see which are needed
           

4. **Start development server:**
   ```bash
   npm run dev
   ```
   This will start the Vite development server at `http://localhost:5173`

### Run Azure function Locally to avoid CORS issues
1. **Close the azure functions repository**
   ```bash
   git clone [repository-url]
   cd [folder-name]/[project-name]
   ```

2. **Start the API**
Make sure you have the azure function runtime installed locally
  ```bash
   func start
   ```

3. **Check the baseUrl in config/settings in frontend project** 

   (TODO introduce local.settings again) 

### Branch Strategy

```
main (production) ←← dev ←← feature branches
```

- **Feature Branches:** Create for new features/fixes
  ```bash
  git checkout -b feature/your-feature-name
  ```
- **Development Branch (`dev`):** Merge completed features here
- **Main Branch (`main`):** Production code only

## Pull Requests (PR)

### Creating a Pull Request
1. Push your feature branch to GitHub
2. Go to repository on GitHub
3. Click "Pull requests" → "New pull request"
4. Select:
   - Base: `dev` (for feature merges)
   - Compare: `feature/your-feature-name`
5. Fill in:
   - Title: Brief description of changes
   - Description: Detailed explanation of changes
   - Reviewers: Assign team members
   - Labels: Add relevant labels

### PR Best Practices
- Keep changes focused and atomic
- Include tests if applicable
- Reference related issues
- Update documentation if needed
- Ensure CI checks pass

## Deployment

### GitHub Actions Workflow
The project uses GitHub Actions for automated deployment. The workflow is defined in `.github/workflows/main.yml`.

The deployed app can be viewed at [qpm.videncenterfordiabetes.dk/dev/latest/](https://qpm.videncenterfordiabetes.dk/dev/latest/)

### GitHub Secrets
The workflow uses the following secrets for secure deployment:
- `FTP_SERVER`: FTP server address
- `FTP_USERNAME`: FTP account username
- `FTP_PASSWORD`: FTP account password

To add/update secrets:
1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add required secrets

### Deployment Process
1. Create PR from `dev` to `main`
2. Review and merge PR
3. GitHub Actions automatically:
   - Builds the application
   - Deploys to FTP server
   - Only the `dist` folder is deployed which contains the bundled code 

## Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run serve
```

## Notes
- The application is built using Vue 2 and Vite
- Deployment is configured for static hosting
- Build artifacts are optimized for production

[<img alt="Deployed with FTP Deploy Action" src="https://img.shields.io/badge/Deployed With-FTP DEPLOY ACTION-%3CCOLOR%3E?style=for-the-badge&color=0077b6">](https://github.com/SamKirkland/FTP-Deploy-Action)
