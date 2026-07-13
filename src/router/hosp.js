const express = require('express')
const router = new express.Router()
const Hospital = require('../model/hosp')
const bcrypt = require('bcryptjs')
const auth = require('../middleware/auth')
const sendTelegram = require('../router/telegram');
const multer = require('multer')
const sharp = require('sharp')


// Signup
router.post('/signup', async (req, res) => {

    // Default role = Doctor
    req.body.role = 0;

    // Make Admin if correct admin key is entered
    if (
        req.body.adminKey &&
        req.body.adminKey === process.env.ADMIN_KEY
    ) {
        req.body.role = 1;
    }

    const hosp = new Hospital(req.body);

    try {

        await hosp.save();

        // Create activation link
        const activationLink = `http://localhost:3000/activate/${hosp._id}`;

        // Send Telegram notification to Admin
        await sendTelegram(`
🏥 NEW HOSPITAL REGISTRATION

Hospital: ${hosp.name}

Email: ${hosp.email}

Role: ${hosp.role === 1 ? "Admin" : "Doctor"}

Status: Pending Activation

✅ Activate Account:

${activationLink}
`);

        // Optional login token
        await hosp.generateToken();

        res.render('activate', {
            id: hosp._id
        });

    } catch (e) {

        console.log('Signup Error:', e);

        res.render('401');

    }

});


// Activate Account

router.get('/activate/:id', async (req, res) => {



    try {



        const hosp = await Hospital.findById(req.params.id);



        if (!hosp) {

            return res.status(404).render('401');

        }



        if (hosp.status === 'Active') {

            return res.render('activDone', {

                message: 'Account is already activated.'

            });

        }



        hosp.status = 'Active';



        await hosp.save();



        // Notify admin that activation succeeded

        await sendTelegram(`

✅ HOSPITAL ACTIVATED



Hospital: ${hosp.name}



Email: ${hosp.email}



Status: Active

`);



        res.render('activDone', {

            hospital: hosp

        });



    } catch (e) {



        console.log('Activation Error:', e);



        res.render('401');



    }



});

// Login
router.post('/login', async (req, res) => {

    try {

        const hosp = await Hospital.findByCredentials(
            req.body.email,
            req.body.password
        );

        // Check account activation
        if (hosp.status === 'Pending') {

            return res.render('index', {
                error: 'Your account is waiting for admin approval.'
            });

        }

        // Generate JWT token
        const token = await hosp.generateToken();

        // Store token in cookie
        res.cookie('auth', token, {
            httpOnly: true
        });

        // Everyone goes to the same dashboard
        return res.redirect('/home');

    } catch (e) {

        console.log("Login Error:", e.message);

        return res.render('401', {
            error: 'Invalid email or password.'
        });

    }

});

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

// Home
router.get('/home', auth, async (req, res) => {

    try {

        res.render('main', {
            name: req.hosp.name,
            email: req.hosp.email,
            role: req.hosp.role,              // 0 = Doctor, 1 = Admin
            isAdmin: req.hosp.role === 1      // true only for admin
        });

    } catch (e) {

        console.log("Home Error:", e);
        res.render('401');

    }

});

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