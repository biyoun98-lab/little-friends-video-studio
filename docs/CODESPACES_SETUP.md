# GitHub Codespaces development

This repository can be developed from a browser using GitHub Codespaces, including from a phone.

## Start a free development machine

1. Open the repository on GitHub.
2. Select the `feature/codespaces-cloud-dev-environment` branch (or the merged default development branch).
3. Open **Code → Codespaces → Create codespace on this branch**.
4. Wait for the container to finish setup. It installs the Node.js dependencies automatically.
5. In the Codespaces terminal, run:

   ```bash
   npm test
   npm run build:cloudflare
   npm start
   ```

6. Open forwarded port 3000 from the **Ports** tab to use the studio in the browser.

## Free allowance and cost protection

GitHub personal Free accounts currently include 120 core-hours and 15 GB-month of Codespaces storage. A 2-core codespace uses two core-hours per active hour. Stop the codespace when finished; deleting it also removes its storage. Check the account's Codespaces usage and billing page before enabling any paid overage.

## Important: this is a development computer, not a video GPU server

Codespaces provides a cloud development environment for editing the project, running Node.js, tests, and the lightweight storyboard renderer. It does not provide a free NVIDIA GPU for LongCat or other large video models.

For GPU experiments, Kaggle Notebooks may offer a free NVIDIA GPU subject to availability and session/quota limits. Kaggle is an interactive notebook environment, not a persistent always-on API worker. Do not expose a public generation API from a free notebook or rely on it for unattended daily production.

Actual AI video generation still requires a compatible GPU worker or an external video-generation API. The Wan/fal.ai path may incur per-generation charges; LongCat requires a separate CUDA worker and model weights. No API key is needed to use Codespaces for code development and tests.
