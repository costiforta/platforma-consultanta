# Platformă Consultanță Financiară — Deploy pe Vercel

Aplicație web profesională de consultanță financiară cu funcționalități AI (opțional).

## 🚀 Deploy Rapid (15 minute)

### PASUL 1 — Cont GitHub (5 min)
1. Mergi pe https://github.com și creează cont (gratuit)
2. Click "+" sus dreapta → "New repository"
3. Nume: `platforma-consultanta`
4. Public sau Private — ambele funcționează
5. Click "Create repository"

### PASUL 2 — Încarcă Codul pe GitHub (5 min)

**Variantă A — Drag & Drop (cea mai simplă):**
1. Pe pagina nouă a repository-ului, click "uploading an existing file"
2. **Dezarhivează** fișierul `platforma-consultanta.zip` pe calculatorul tău
3. **Selectează TOATE fișierele și folderele dezarhivate** (Ctrl+A) și trage-le în zona de upload
4. Scroll jos → click "Commit changes"

**Variantă B — Cu git (dacă știi):**
```bash
git clone https://github.com/USERNAME/platforma-consultanta.git
cd platforma-consultanta
# Copiază toate fișierele din arhivă aici
git add . && git commit -m "Initial" && git push
```

### PASUL 3 — Deploy pe Vercel (5 min)
1. Mergi pe https://vercel.com și click "Sign Up" → **alege "Continue with GitHub"**
2. După login, click "Add New..." → "Project"
3. Găsește `platforma-consultanta` în listă → click "Import"
4. **Lasă toate setările default** (Framework Preset: Vite — se detectează automat)
5. Click "Deploy"
6. Așteaptă ~2 minute. Vei primi un URL de tipul: `platforma-consultanta-xyz.vercel.app`

🎉 **GATA! Site-ul tău e LIVE și poate fi accesat de oriunde.**

---

## 🤖 Activare AI (opțional — pentru extragere automată din text + generare strategii)

Aplicația funcționează fără AI: formulare manuale, calculator PMT, comparator, scripts, raport — toate merg perfect.

Dacă vrei să activezi AI-ul (recomandat pentru flow rapid):

### PASUL A — Cheie API Claude (10 min)
1. Mergi pe https://console.anthropic.com și creează cont
2. Plan & Billing → adaugă $5-10 credit (acoperă ~100-300 generări de strategii)
3. API Keys → "Create Key" → copiază valoarea (începe cu `sk-ant-...`)

### PASUL B — Adaugă cheia în Vercel (2 min)
1. În Vercel Dashboard → click pe proiectul tău → "Settings" (sus)
2. Sidebar stânga: "Environment Variables"
3. Add New:
   - Name: `ANTHROPIC_API_KEY`
   - Value: cheia copiată (`sk-ant-...`)
   - Environment: bifează toate (Production, Preview, Development)
   - Click "Save"
4. Sus în meniu: "Deployments" → click "..." pe ultimul deploy → "Redeploy"

🎉 **AI ACTIV!** Acum funcționează extragerea din text și generarea de strategii.

---

## 📱 Folosire de pe Telefon

Site-ul este responsive — funcționează pe orice telefon. Adaugă-l la home screen:
- **iPhone**: deschide URL în Safari → Share → "Add to Home Screen"  
- **Android**: deschide URL în Chrome → Meniu (3 puncte) → "Add to Home screen"

---

## 🌐 Domeniu Propriu (opțional — costă ~10€/an)

Pentru aer profesionist, folosește un domeniu propriu (ex: `consultanta.numele-tau.ro`):
1. Cumpără domeniu de la rotld.ro, namecheap.com, sau godaddy.com (~10-50€/an)
2. În Vercel → proiect → Settings → Domains → Add → tastează domeniul tău
3. Vercel îți spune ce DNS records să setezi la registrar (instrucțiuni clare)

---

## 💾 Date Salvate

Toate datele clienților se salvează **pe browserul tău** (localStorage). Asta înseamnă:
- ✅ Privat — datele nu pleacă de pe device-ul tău
- ✅ Gratuit — nu ai nevoie de bază de date
- ⚠️ Dacă ștergi cache-ul browserului → date pierdute
- ⚠️ Datele NU se sincronizează între laptop și telefon (vezi update viitor pentru sync cloud)

Pentru a salva backup periodic: în Settings (rotativul) poți copia datele.

---

## 🔧 Troubleshooting

**"AI nu răspunde" / "AI not configured":**
- Verifică că ai setat `ANTHROPIC_API_KEY` în Vercel
- Verifică că ai redeployat după ce ai adăugat variabila
- Verifică că ai credit pe contul Anthropic

**"Site arată ciudat / nu se încarcă":**
- Hard refresh: Ctrl+Shift+R (Windows) sau Cmd+Shift+R (Mac)
- Verifică că deploy-ul în Vercel are status "Ready" (verde)

**"Vreau să modific ceva" (culori, randamente default, produse):**
- Editezi fișierul `src/App.jsx` pe GitHub → commit → Vercel face redeploy automat
- SAU pe local: clone repo, modifici, push pe GitHub

---

## 📞 Contact / Suport

Pentru ajutor cu deploy-ul sau modificări, întreabă-mă în Claude.
