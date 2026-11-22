// Service worker de "Incidencias de obra": guarda la app en el móvil para que abra al instante.
// Al subir un index.html nuevo, cambia VERSION para que todos los móviles lo cojan antes.
var VERSION = 'inc-v5';
var APP = ['./', 'index.html', 'manifest.json', 'icono.svg', 'icono-180.png', 'icono-192.png', 'icono-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){ return c.addAll(APP); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== VERSION && k !== 'inc-pdf'; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;                         // las peticiones a Google (POST) no se tocan
  var url = new URL(req.url);
  if(url.origin === location.origin){
    // la app: se abre la copia guardada al momento y se descarga la nueva para la próxima vez
    e.respondWith(caches.open(VERSION).then(function(c){
      return c.match(req, {ignoreSearch:true}).then(function(guardada){
        var red = fetch(req).then(function(r){ if(r.ok) c.put(req, r.clone()); return r; }).catch(function(){ return guardada; });
        return guardada || red;
      });
    }));
  } else if(url.hostname === 'cdn.jsdelivr.net'){
    // visor de PDF: no cambia nunca, se guarda para siempre
    e.respondWith(caches.open('inc-pdf').then(function(c){
      return c.match(req).then(function(g){ return g || fetch(req).then(function(r){ if(r.ok) c.put(req, r.clone()); return r; }); });
    }));
  }
});
