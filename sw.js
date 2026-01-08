//const CACHE_NAME = 'factory-pulse-v1'; // Muda para v2 quando atualizares o site

// Depois da atualização (muda para v2, v3, etc.)
//const CACHE_NAME = 'factory-pulse-v2';

// Depois da atualização (muda para v2, v3, etc.)
//const CACHE_NAME = 'factory-pulse-v3';

// Depois da atualização (muda para v2, v3, etc.)
const CACHE_NAME = 'factory-pulse-v6';


const assets = [
  './',
  './index.html',
  './manifest.json',
  // Adicionamos os links das imagens para que funcionem offline
  'https://static.wixstatic.com/media/a6967f_95db0dbb18554c0299efd61c7e081848~mv2.png',
  'https://static.wixstatic.com/media/a6967f_c9d5a191246b4dd3818f6ab57849dee9~mv2.png',
  'https://static.wixstatic.com/media/a6967f_1641eee7681c4afd8e45016286e81ef1~mv2.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('FactoryPulse: Ficheiros em cache!');
      return cache.addAll(assets);
    })
  );
});

// Limpeza de caches antigas (Ativação)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
});

// Intercetar pedidos
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Se tiver na cache, devolve. Se não, vai à rede.
      return response || fetch(event.request);
    })
  );
});