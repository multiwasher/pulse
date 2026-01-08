# Troubleshooting Guide

## Problemas Comuns e Soluções

### 1. **Error: Failed to load resource (401)**
**Causa**: Service Worker tentando cachear assets que falharam
**Solução**: Já corrigido! O SW agora usa "network-first" strategy

```bash
# Clear cache se necessário
# Chrome DevTools → Application → Service Workers → Unregister
# Ou: Clear Storage → Clear site data
```

### 2. **Meta tag deprecated warning**
**Aviso**: `apple-mobile-web-app-capable` is deprecated
**Solução**: Substituído por `mobile-web-app-capable` ✓

### 3. **WebSocket connection failed (Live Preview)**
**Causa**: Live Preview do VS Code tentando se conectar
**Solução**: Use `npm run dev` ao invés de Live Preview
```bash
npm run dev  # Abre em http://localhost:5173
```

### 4. **Port 5173 already in use**
```bash
# Encontre o processo
lsof -i :5173

# Mate o processo
kill -9 <PID>

# Ou use uma porta diferente
npm run dev -- --port 3000
```

### 5. **Firebase não carrega (CORS error)**
**Causa**: Firebase SDK versão incompatível
**Solução**: Já está configurado em `src/App.jsx`

```javascript
// Verificar que está correto:
const firebaseConfig = {
    apiKey: "AIzaSyDX...", // ✓
    authDomain: "manutencao-fabrica.firebaseapp.com",
    projectId: "manutencao-fabrica",
    // ... resto da config
};
```

### 6. **Build error: "modules larger than 500kB"**
**Aviso**: Não é erro, é aviso de otimização
**Solução**: Já implementado chunk splitting para Firebase
```bash
npm run build  # Verá otimização em output
```

### 7. **Service Worker não registra**
**Verificar**:
1. `public/sw.js` existe ✓
2. `public/manifest.json` existe ✓
3. Browser DevTools → Console → procure "Service Worker registado!"

### 8. **Tailwind CSS não aplica estilos**
**Causa**: CSS imports em falta
**Verificar**:
- `src/index.css` tem `@tailwind directives` ✓
- `src/main.jsx` importa `'./index.css'` ✓

### 9. **Vite HMR não funciona**
```bash
# Reiniciar dev server
npm run dev

# Se persistir, verificar vite.config.js HMR settings ✓
```

### 10. **Imagens (Wix URLs) não carregam**
**Causa**: URLs podem estar bloqueadas por CORS
**Solução**: Use as URLs diretas sem transformações:
```javascript
const LAYOUT_IMAGE = "https://static.wixstatic.com/media/a6967f_aac24f82eec442c8992856c104e39d20~mv2.png";
// ✓ Sem /v1/fill/... transformações
```

## Verificação Rápida

```bash
# 1. Verificar dependências
npm list | grep -E "react|firebase|vite|tailwind"

# 2. Verificar estrutura
ls -la src/ public/

# 3. Testar build
npm run build

# 4. Testar dev
npm run dev
```

## Limpeza e Reset

```bash
# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar Vite cache
rm -rf .vite

# Limpar Service Worker (no browser)
# → DevTools → Application → Service Workers → Unregister
# → Storage → Clear site data
```

## Performance

**Métricas Atuais** (após otimizações):
- Build time: ~2.7s
- CSS: 9.07 kB (gzip: 2.38 kB)
- JS: 626.09 kB (gzip: 161.47 kB)
- HTML: 0.85 kB (gzip: 0.50 kB)

Para melhorias futuras:
- Code splitting dinâmico para modais
- Lazy loading de imagens
- Compress images para WebP

## Recursos Úteis

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase Docs](https://firebase.google.com/docs)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Suporte

Se o problema persistir:
1. Verificar `/tmp/vite-dev.log` para logs
2. Abrir DevTools (F12) → Console
3. Verificar Application → Service Workers
4. Fazer commit e push da issue
