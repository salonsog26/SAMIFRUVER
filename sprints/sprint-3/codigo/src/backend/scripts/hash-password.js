// Genera el hash de una contraseña para guardarlo en la BD (por ejemplo, para cambiar la del administrador):
//   npm run db:hash -- "MiClaveNueva123"
// Luego, en SQL:  UPDATE administradores SET password_hash = '<el hash>' WHERE correo = 'admin@samifruver.com';
const { hashSync } = require('../lib/passwords');
const clave = process.argv[2];
if (!clave) {
    console.error('Uso: npm run db:hash -- "tu contraseña"');
    process.exit(1);
}
console.log(hashSync(clave));
