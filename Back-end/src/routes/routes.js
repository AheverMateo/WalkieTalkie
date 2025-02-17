const { Router } = require('express')
const {postUser, getUser} = require('../controllers/index')

const router = Router()

router.get("/user", getUser)
router.post("/user", postUser)


module.exports = router