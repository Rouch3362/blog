const fs = require("fs")
const multer  = require('multer')



const storage = multer.diskStorage({
    destination: (req , file , next) => {
        fs.mkdirSync(`./uploads/${req.user.id}` , {recursive: true})
        next(null , `uploads/${req.user.id}`)
    },
    filename: (req , file , next) =>{
        next(null , file.fieldname + '-' + Date.now())
    },
})

var upload = multer({storage: storage})



module.exports = {
    upload
}