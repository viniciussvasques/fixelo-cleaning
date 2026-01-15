const bcrypt = require('bcryptjs');
const hash = '$2a$10$F5GBUvvtHQytHGvekpYBEuEstIBO/ge01DkAQvSvsJ2DkCUx.QdG.';
const password = '123456';

bcrypt.compare(password, hash).then(result => {
    console.log('Password matches:', result);
    process.exit(result ? 0 : 1);
});
