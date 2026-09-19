# 🔒 Permisos Progresivos — RunRadar (RR)

## 1. Principio de Solicitud Progresiva
La aplicación **nunca** exige todos los permisos de golpe al instalar. Solicita acceso únicamente cuando la funcionalidad lo requiere:

1. **Permiso de Ubicación (GPS):** Solicitado al iniciar una sesión de carrera.
2. **Permiso de Frecuencia Cardíaca:** Solicitado si el usuario vincula una banda cardíaca o autoriza el sistema de salud.
3. **Permiso de Actividad Física / Pasos:** Solicitado para cadencia y estimación de ritmo cuando no hay GPS disponible.

## 2. Tolerancia a Permisos Rechazados
Si el corredor rechaza un permiso:
* La aplicación **continúa funcionando** con los sensores disponibles.
* Por ejemplo, si rechaza FC, el entrenador verá el GPS, ritmo y distancia, mostrando `❤️ FC no disponible` de forma transparente y sin bloquear el uso.
