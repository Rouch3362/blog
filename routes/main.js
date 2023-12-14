const { Router } = require("express")
const router = Router()


router.get("/" ,(req , res) => {
    res.render("home" , {
        user: req.user , 
        message: req.flash("message") , 
        error: req.flash("error") , 
        isAuthenticated: req.isAuthenticated()
    })
})


module.exports = router