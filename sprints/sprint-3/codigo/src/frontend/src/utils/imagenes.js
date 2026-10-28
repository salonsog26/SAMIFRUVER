// src/utils/imagenes.js
// Imagen que se muestra cuando un producto no tiene foto (o su URL falla).
export const IMAGEN_DEFECTO = '/images/producto-defecto.webp';

// Devuelve la imagen del producto, o la imagen por defecto si no hay una válida.
// También reemplaza las URLs de placehold.co que quedaron en datos antiguos.
export function resolverImagen(url) {
    if (!url || typeof url !== 'string' || url.includes('placehold.co')) {
        return IMAGEN_DEFECTO;
    }
    return url;
}

// Para usar en <img onError={...}>: si la imagen falla, cae a la imagen por defecto.
export function alFallarImagen(e) {
    if (e.currentTarget.src.endsWith(IMAGEN_DEFECTO)) return; // evita bucles
    e.currentTarget.src = IMAGEN_DEFECTO;
}
