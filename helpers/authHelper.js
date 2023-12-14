const bcrypt = require("bcrypt")



const HashPassword = (plain) => {
    const salt = bcrypt.genSaltSync()
    const hash = bcrypt.hashSync(plain , salt)
    return hash
}


const ValidatePassword = (plainPassword , hashedPassword) => {
    return bcrypt.compareSync(plainPassword , hashedPassword)
}

const ValidateEmail = (email) => {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/
    return regex.test(String(email))
}


module.exports = {
    HashPassword,
    ValidateEmail,
    ValidatePassword
}