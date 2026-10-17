# Brújula

Aplicación estática para organizar finanzas personales y del hogar. La autenticación, los datos y los documentos privados están en Supabase.

## Publicar en GitHub Pages

En Settings → Pages, seleccionar Deploy from a branch, la rama principal y /(root).

El sitio funciona desde un subdirectorio; todos los recursos usan rutas relativas. No necesita sesión de ChatGPT. El acceso a los datos requiere la cuenta de Brújula.

No subir estados de cuenta, respaldos JSON, contraseñas ni claves privadas a este repositorio. La clave publicable de Supabase solo identifica el proyecto; las políticas de acceso de la base de datos y Storage protegen los datos.

Los archivos PDF se almacenan de forma privada. La extracción y las recomendaciones de IA se realizan por ahora en el chat.
