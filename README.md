# QuickPubMed Web application

This project contains the source code for the product QuickPubMed hosted on 
[videncenterfordiabetes.dk](https://videncenterfordiabetes.dk/)

![Latest deployment status](https://github.com/danishdiabetesknowledgecenter/QuickPubMed/actions/workflows/main.yml/badge.svg)

## Prerequisites

**SSH key for cloning**
   - [Generate SSH key locally and add it to your github profile](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)

**Backend**
- .NET SDK and the runtime for azure functions installed locally 

**Frontend**
- Node.Js and NPM installed locally


## Setup for local development

### Frontend project
   
The **frontend** project can be cloned as such using ssh 

```bash
git clone git@github.com:danishdiabetesknowledgecenter/QuickPubMed.git
cd QuickPubMed
```

**Install dependencies**
   ```bash
npm install
```

**Create and fill in values for .env**
- check the .env.example file to see which are needed

**Start development server:**
```bash
npm run dev
```
This will start the Vite development server at `http://localhost:5173`

### Backend project
   
The **backend** project can be cloned as such using ssh 

```bash
git clone git@github.com:danishdiabetesknowledgecenter/QuickPubMed-AzureFunctions.git
cd QuickPubMed-AzureFunctions/qpm_api
```

**Create and fill in values for local.settings.json**
- check the .local.settings.example.json file to see which are needed

**Start development server:**
```bash
func start
```
This will start the azure function server at `http://localhost:7071`

### Start developing
- You're ready to start creating features👌
  
## Branching Strategy

Follow the feature branch strategy for adding new features.
```
main (deployment branch) ←← dev(consolidate features) ←← feature/<name-of-feature>
```
*Notice: Avoid pushing directly to the main branch, this is currently not enforced by rules since the repository is private*


### Naming conventions for shortlived branches 

- *Bug fixes*
  - bug/name-of-bug (or github issue id)
- *Features*
  - feature/name-of-feature


### Creating a Pull Request (PR)
When multiple people are working on a project it is common practice to consolidate features on the dev branch before a deployment is triggered.

1. Push your feature branch to GitHub
2. Go to repository on GitHub
3. Click "Pull requests" → "New pull request"
4. Select:
   - Base: `dev` (for feature merges)
   - Compare: `feature/your-feature-name`
5. Fill in:
   - Title: Brief description of changes
   - Description: Detailed explanation of changes
   - (*optional*) Reviewers: Assign team members for review
   

#### PR Best Practices
- Keep changes focused and atomic
- Include tests if applicable
- Reference related issues
- Update documentation if needed


## Deployment and release of new version

### GitHub Actions Workflow
The project uses GitHub Actions for automated deployment. The workflow is defined in `.github/workflows/main.yml`.

When a feature (or multiple consolidated features) should be deployed:

1. Create PR from `dev` to `main`
2. Review and merge PR (include relevant info in title and description)
3. [Create a new release, with a new tag](https://github.com/danishdiabetesknowledgecenter/QuickPubMed/releases)
4. The new release will trigger the GitHub Actions automatically which will:
   - Build the application
   - Deploy to the FTP server
   - Only the `dist` folder is deployed which contains the bundled code 

[The deployed app can be viewed here](https://qpm.videncenterfordiabetes.dk/dev/latest/)

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

Furthermore make sure that the enviroment varibels defined in the main.yml are created as [Secrets in GitHub](https://github.com/danishdiabetesknowledgecenter/QuickPubMed/settings/secrets/actions)


## Notes
- The application is built using Vue 2 and Vite 5
- Deployment is configured for static hosting
- Build artifacts are optimized for production

  [<img alt="Deployed with FTP Deploy Action" src="https://img.shields.io/badge/Deployed With-FTP DEPLOY ACTION-%3CCOLOR%3E?style=for-the-badge&color=0077b6">](https://github.com/SamKirkland/FTP-Deploy-Action)

### Managing tasks for open-source or internal work 
All GitHub repositories have a tab for creating and managing [issues](https://github.com/danishdiabetesknowledgecenter/QuickPubMed/issues)

Use this to report bugs or request new feature. These issues can be directly linked to a branch and resolved when a branch is merged into dev. 
