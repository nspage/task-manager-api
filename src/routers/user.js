const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account')
const router = new express.Router()
const upload = multer({
    limits: {
        fileSize:1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){  // match(__REGEX__) function to check if the file name fits the doctype required 
            return cb(new Error('please upload an image file'))
        }
        cb(undefined, true)
    }
})

// End point for creating a new user
router.post('/users', async (req, res)=> {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

// end point to login with an existing user account
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(400).send()
    }
})

// end point to logout of an existing account from one session
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// end point to logout of all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// End point for fetching all users -- REMOVED
// router.get('/users', auth, async (req, res) => {
//     try {
//       const users = await User.find({})
//       res.send(users)  
//     } catch (e) {
//         res.status(500).send()
//     }
// })

// End point for fetching signed-in user's profile info
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

// End point for fetching a user according to id -- REMOVED because we have 
// created the <:me route> which allows an authenticated user to see their own profile

// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id
//     try {
//         const user = await User.findById(_id)
//         if (!user) {
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

// End point for updating a user according to its id
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })
    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {        
        updates.forEach((update)=> req.user[update] = req.body[update])

        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// End point for deleting yourself as a user
router.delete('/users/me', auth, async (req, res)=> {
    try {
        await req.user.remove()
        sendCancelEmail(req.user.name, req.user.email)
        res.send(req.user)
    } catch(e) {
        res.status(500).send(e)
    }
})
//Endpoint for avatar-file upload
router.post('/users/me/avatar', auth, upload.single('avatars'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next)=> {                      //error handling 
    res.status(400).send({error: error.message})
})

//Endpoint to delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//Endpoint allowing the serving up of the avatar image
router.get('/users/:id/avatar', async (req, res)=> {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404)
    }
})

module.exports = router