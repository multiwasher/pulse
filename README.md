# Factory Pulse - Station Maintenance System

Uma aplicação React moderna para gestão e avaliação de estações de fábrica com suporte a PWA.

## Tecnologias

- **React 18** - Framework UI
- **Vite 5** - Bundler e dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **Firebase 11.6.1** - Autenticação e Firestore
- **PostCSS + Autoprefixer** - CSS processing

## Estrutura do Projeto

```
pulse/
├── src/
│   ├── App.jsx           # Componente principal
│   ├── index.css         # Estilos globais e animações
│   └── main.jsx          # Entry point
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service Worker
├── index.html           # Template HTML
├── vite.config.js       # Configuração Vite
├── tailwind.config.js   # Configuração Tailwind
├── postcss.config.js    # Configuração PostCSS
└── package.json
```

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar dev server (http://localhost:5173)
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Funcionalidades

### Para Operadores
- 📍 Mapa interativo de estações
- 😊 Avaliação com emoticons (Crítico/Aceitável/Excelente)
- 📤 Submissão em batch de avaliações
- ⏱️ Timeout de 30 segundos para retornar ao splash

### Para Administradores
- ⚙️ Modo de edição de mapa
- 📊 Dashboard com estatísticas
- 🎯 Desempenho por estação
- 📈 Histórico de avaliações

### PWA
- 📱 Instalável em mobile
- 🔄 Offline support via Service Worker
- 🔐 Autenticação anônima com Firebase

## Firebase Setup

A configuração do Firebase está em `src/App.jsx`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDX_fcMzzOXTaBh2VszUh-j_kmApR0fiv8",
    authDomain: "manutencao-fabrica.firebaseapp.com",
    projectId: "manutencao-fabrica",
    storageBucket: "manutencao-fabrica.firebasestorage.app",
    messagingSenderId: "322227932590",
    appId: "1:322227932590:web:2459b650fb9ca7c3b14c3f"
};
```

## Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build otimizado para produção
- `npm run preview` - Visualiza o build produção localmente

### Customização

- **Cores**: Edite o tema em `tailwind.config.js`
- **Animações**: Modifique `src/index.css`
- **Componentes**: Atualize `src/App.jsx`

## Login Administrador

- **Usuário**: `GESTÃO`
- **Senha**: `789`

## Deploy

O projeto está configurado para deploy automático via GitHub. Qualquer push para `main` será processado.

```bash
git add -A
git commit -m "Descrição das mudanças"
git push origin main
```

## Suporte

Para questões ou bugs, abra uma issue no repositório GitHub.