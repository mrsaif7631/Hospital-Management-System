const express = require('express')
const router = new express.Router()
const Hospital = require('../model/hosp')
const bcrypt = require('bcryptjs')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')


//signup
router.post('/signup', async (req,res)=>{
    const hosp = new Hospital(req.body)
    try{
       
        await hosp.save()
        
        //confirm email
        //account.confMail(hosp.email,hosp.name, hosp._id)
        const token = await hosp.generateToken()
        //res.status(201).send({hosp, token})
        res.render('activate',{
            id:hosp._id
        })
    }catch(e){
        //res.status(401).send(e)
        console.log('Error',e)
       res.render('401')
    }
})

//activate account
router.get('/activate/:id' , async (req,res)=>{
    const _id = req.params.id
    try{
        const hosp = await Hospital.findById(_id)
        if(!hosp){
            return res.status(404).send()
        }
        hosp.status = 'Active'
        await hosp.save()
        // res.send(hosp)
        res.render('activDone')
    }
    catch(e){
        // res.status(500).send()
        res.render('401')
    }
})

//login
router.post('/login', async (req,res)=>{
    //console.log(req.body.email)
    try{
        const hosp = await Hospital.findByCredentials(req.body.email,req.body.password)
        if(hosp.status==='Pending'){
            return res.render('index')
        }
        const token = await hosp.generateToken()
        
        //res.header('Authorization', 'Bearer '+ token); 
        res.cookie('auth',token);
        //res.send({hosp,token})
        
        res.redirect('/home')
    }catch(e){
        // res.status(400).send(e)
        res.render('401')
    }
})

//profile
router.get('/me', auth, async (req,res)=>{
    
    res.render('profile',{
        name: req.hosp.name,
        email: req.hosp.email,
        address: req.hosp.address,
        createdAt: req.hosp.createdAt.toString().substr(0,10)
    })
    //res.send(req.hosp)
})


// logout
router.post('/logout', auth, async (req,res)=>{
    try{
        req.hosp.tokens = req.hosp.tokens.filter((token)=>{
            return token.token != req.token
        })

        await req.hosp.save()
        // res.send()
        res.redirect('/')
    }catch(e){
        // req.status(500).send('error')
        res.render('401')
    }
})

//logout all
router.post('/logoutAll', auth, async (req,res)=>{
    try{
        req.hosp.tokens=[]
        await req.hosp.save()
        res.send()
    }
    catch(e){
        // res.status(500).send()
        res.render('401')
    }
})

//home
router.get('/home', auth, async (req,res)=>{
    //console.log(req.hosp)
    res.render('main',{
        name: req.hosp.name
    })
})

//update
router.post('/updateme', auth, async (req,res)=>{
    const updates = Object.keys(req.body)
  //  console.log(updates)
    const allowed = ['name','password','address']
    const check = updates.every((update)=>{
        return allowed.includes(update)
    })

    if(!check){
        return res.status(404).send()
    }

    try{
        updates.forEach((element)=>{
            req.hosp[element] = req.body[element]
        })
        
        await req.hosp.save()

        //res.send(req.hosp)
        res.redirect('/me')
    }catch(e){
        // res.status(404).send(e)
        res.render('401')
    }
})

router.get('/adminMain', auth, (req, res) => {
    res.render('adminMain', {
        name: req.hosp.name
    });
});

module.exports = router