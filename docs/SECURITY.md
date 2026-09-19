# 🔐 Seguridad y Aislamiento Multi-Tenant — RunRadar (RR)

## 1. Jerarquía de Aislamiento
```
ORGANIZACIÓN (Club / Running Team)
  └── ENTRENADORES (Profesores asignados)
        └── GRUPOS (Running Martes, 10K, Iniciales)
              └── CORREDORES (Atletas vinculados)
```

* **Aislamiento Organizacional:** Un entrenador de "Club Running Central" no puede ver corredores ni sesiones de "Club Mar del Plata".
* **Protección de Tokens:** Autenticación basada en sesiones seguras / tokens HTTP-Only evitando almacenar secretos en `localStorage`.
* **Sanitización de Datos:** Validación de esquemas en todos los endpoints REST y sockets.
