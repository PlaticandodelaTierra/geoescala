// Errores que puede ver el usuario. Llevan un código y sus datos para que i18n.js escriba el
// mensaje en el idioma de la interfaz; el texto en español queda como `message` para quien
// lea el código o la consola.

export class ErrorGeoEscala extends Error {
  constructor(codigo, datos = {}, mensaje = codigo) {
    super(mensaje);
    this.name = 'ErrorGeoEscala';
    this.codigo = codigo;
    this.datos = datos;
  }
}
