const fs = require("fs")
const path = require('path')
const multer  = require('multer')



const storage = multer.diskStorage({
    destination: (req , file , next) => {
        next(null , 'uploads')
    },
    filename: (req , file , next) =>{
        next(null , file.fieldname + '-' + Date.now())
    },
})

var upload = multer({storage: storage})


const toBinary = (req) => {
    // read file and save it as binary data
    const image = {
        data: fs.readFileSync(path.join("./uploads/" + req.file.filename)),
        contentType: "image/png"
    }
    // remove the actual file from upload folder after read it and save it thumbnail object
   fs.unlink(path.join("./uploads/" + req.file.filename) , (err) => {
    if(err) {
        return req.flash("error" , "something went wrong try again")
    }
   }) 
   return image
}


module.exports = {
    toBinary,
    upload
}