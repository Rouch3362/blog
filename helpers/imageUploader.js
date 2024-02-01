const fs = require("fs")
const multer  = require('multer')



const storage = multer.diskStorage({
    destination: (req , file , next) => {
        fs.mkdirSync(`./public/uploads/${req.user.id}` , {recursive: true})
        next(null , `public/uploads/${req.user.id}`)
    },
    filename: (req , file , next) =>{
        next(null , file.fieldname + '-' + Date.now())
    },
})

var upload = multer({
    storage: storage,
    fileFilter: (req , file , next) => {
        if (!file.originalname.match(/\.(jpg|JPG|webp|jpeg|JPEG|png|PNG|gif|GIF|jfif|JFIF)$/)) {
            req.fileValidationError = "only image files are allowed!"
            return next(null , false)
        }
        next(null , true)
    }
})



module.exports = {
    upload
}