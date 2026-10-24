/**
 * Genera un valor único (nombre, username, etc.) para evitar colisiones
 * cuando las pruebas de creación se ejecutan varias veces contra el mismo entorno.
 * @param {string} prefix - Prefijo legible del dato (ej. 'AutoSkill', 'AutoLoc')
 * @returns {string}
 */
export function uniqueName(prefix = 'Auto') {
    const seed = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
    return `${prefix}_${seed}`;
}
