const express = require('express')
const crypto = require('crypto')
const router = new express.Router()
const Hospital = require('../model/hosp')
const bcrypt = require('bcryptjs')
const auth = require('../middleware/auth')
const sendTelegram = require('../router/telegram');
const multer = require('multer')
const sharp = require('sharp')

const buildApprovalToken = (hospitalId) => {
    const secret = process.env.APPROVAL_SECRET || process.env.JWT_SECRET || 'hospital-approval-secret';
    return crypto.createHash('sha256').update(`${hospitalId}:${secret}`).digest('hex');
};

const getBaseUrl = (req) => {
    const configuredBaseUrl = process.env.BASE_URL || 'https://hospital-management-system-sstx.onrender.com';

    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/$/, '');
    }

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(forwardedProto)
        ? forwardedProto[0]
        : forwardedProto || req.protocol;
    const host = req.get('host');
    return `${protocol || 'http'}://${host}`;
};

const shouldActivateOnPost = (hospital) => {
    return Boolean(hospital) && hospital.role !== 1;
};

const activateHospitalAccount = async (hospital) => {
    hospital.status = 'Active';
    hospital._explicitApproval = true;
    await hospital.save();
    return hospital;
};

const ensureAdmin = (req, res, next) => {
    if (!req.hosp || req.hosp.role !== 1) {
        return res.status(403).render('401', {
            error: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

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
    hosp.status = 'Pending';

    try {

        await hosp.save();

        const approvalToken = buildApprovalToken(hosp._id.toString());
        const activationLink = `${getBaseUrl(req)}/admin/telegram-approve/${hosp._id}?token=${approvalToken}`;

        await sendTelegram(`
🏥 NEW HOSPITAL REGISTRATION

Hospital: ${hosp.name}
Email: ${hosp.email}
Role: ${hosp.role === 1 ? 'Admin' : 'Doctor'}
Status: Pending Activation

✅ Activate Account:

${activationLink}
`);

        // Optional login token
        await hosp.generateToken();

        // Show confirmation page
        res.render('activate');

    } catch (e) {

        console.log('Signup Error:', e);

        res.render('401');

    }

});

router.get('/activate/:id', async (req, res) => {
    try {

        const hosp = await Hospital.findById(req.params.id);

        if (!hosp) {
            return res.status(404).render('401');
        }

        res.render('activateConfirm', {
            hospital: hosp
        });

    } catch (e) {
        console.log(e);
        res.render('401');
    }
});


// Activate Account (only explicit approval should change status)
router.post('/activate/:id', async (req, res) => {
    try {

        const hosp = await Hospital.findById(req.params.id);

        if (!hosp) {
            return res.status(404).render('401');
        }

        return res.render('activDone', {
            hospital: hosp,
            message: 'Approval must be confirmed through the admin action.'
        });

    } catch (e) {
        console.log(e);
        res.render('401');
    }
});


router.get('/admin/dashboard', auth, ensureAdmin, async (req, res) => {
    try {
        const hospitals = await Hospital.find({}).sort({ createdAt: -1 });
        const pending = hospitals.filter(hospital => hospital.status === 'Pending').length;
        const active = hospitals.filter(hospital => hospital.status === 'Active').length;
        const adminCount = hospitals.filter(hospital => hospital.role === 1).length;
        const doctorCount = hospitals.filter(hospital => hospital.role === 0).length;

        res.render('adminDashboard', {
            name: req.hosp.name,
            isAdmin: true,
            totalHospitals: hospitals.length,
            pendingHospitals: pending,
            activeHospitals: active,
            adminCount,
            doctorCount,
            latestHospitals: hospitals.slice(0, 5)
        });
    } catch (e) {
        console.log('Admin Dashboard Error:', e);
        res.render('401');
    }
});

router.get('/admin/hospitals', auth, ensureAdmin, async (req, res) => {
    try {
        const searchTerm = (req.query.q || '').trim();
        const statusFilter = req.query.status || '';

        const query = {};

        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (statusFilter) {
            query.status = statusFilter;
        }

        const hospitals = await Hospital.find(query).sort({ createdAt: -1 });

        res.render('adminHospitals', {
            name: req.hosp.name,
            isAdmin: true,
            hospitals,
            searchTerm,
            statusFilter,
            hasResults: hospitals.length > 0
        });
    } catch (e) {
        console.log('Admin Hospitals Error:', e);
        res.render('401');
    }
});


router.get('/admin/hospitals/:id/activate', auth, ensureAdmin, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).render('401', {
                error: 'Hospital account not found.'
            });
        }

        res.render('adminActivateHospital', {
            hospital
        });

    } catch (e) {
        console.log('Activate Page Error:', e);
        res.render('401');
    }
});


router.post('/admin/hospitals/:id/activate', auth, ensureAdmin, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).render('401', {
                error: 'Hospital account not found.'
            });
        }

        if (hospital.status === 'Active') {
            return res.redirect('/admin/hospitals');
        }

        await activateHospitalAccount(hospital);

        await sendTelegram(`
✅ HOSPITAL ACCESS APPROVED

Hospital: ${hospital.name}
Email: ${hospital.email}
Status: Active
`);

        return res.redirect('/admin/hospitals');

    } catch (e) {
        console.log('Activate Hospital Error:', e);
        res.render('401');
    }
});




router.post('/admin/hospitals/:id/deactivate', auth, ensureAdmin, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).render('401', {
                error: 'Hospital account not found.'
            });
        }

        hospital.status = 'Pending';
        await hospital.save();

        await sendTelegram(`
⚠️ HOSPITAL ACCESS SUSPENDED

Hospital: ${hospital.name}
Email: ${hospital.email}
Status: Pending
`);

        return res.redirect('/admin/hospitals');
    } catch (e) {
        console.log('Deactivate Hospital Error:', e);
        return res.render('401');
    }
});

router.get('/adminMain', auth, ensureAdmin, (req, res) => {
    res.redirect('/admin/dashboard');
});

router.get('/admin/reports', auth, ensureAdmin, async (req, res) => {
    try {
        const hospitals = await Hospital.find({}).sort({ createdAt: -1 });
        const pending = hospitals.filter(hospital => hospital.status === 'Pending').length;
        const active = hospitals.filter(hospital => hospital.status === 'Active').length;

        res.render('adminReports', {
            name: req.hosp.name,
            isAdmin: true,
            totalHospitals: hospitals.length,
            pendingHospitals: pending,
            activeHospitals: active
        });
    } catch (e) {
        console.log('Admin Reports Error:', e);
        res.render('401');
    }
});

router.get('/admin/telegram-approve/:id', async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).render('401', {
                error: 'Hospital account not found.'
            });
        }

        const expectedToken = buildApprovalToken(hospital._id.toString());
        const providedToken = req.query.token || '';
        const isAdmin = req.hosp && req.hosp.role === 1;
        const hasValidToken = providedToken && providedToken === expectedToken;

        if (!isAdmin && !hasValidToken) {
            return res.status(403).render('401', {
                error: 'Invalid or expired approval token.'
            });
        }

        const approvalUrl = `${getBaseUrl(req)}/admin/telegram-approve/${hospital._id}?token=${providedToken}`;

        return res.render('adminApproval', {
            hospital,
            approvalUrl,
            token: providedToken
        });
    } catch (e) {
        console.log('Telegram Approval Error:', e);
        return res.render('401');
    }
});

router.post('/admin/telegram-approve/:id', async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).render('401', {
                error: 'Hospital account not found.'
            });
        }

        const expectedToken = buildApprovalToken(hospital._id.toString());
        const providedToken = req.body.token || '';
        const isAdmin = req.hosp && req.hosp.role === 1;
        const hasValidToken = providedToken && providedToken === expectedToken;

        if (!isAdmin && !hasValidToken) {
            return res.status(403).render('401', {
                error: 'Invalid or expired approval token.'
            });
        }

        await activateHospitalAccount(hospital);

        await sendTelegram(`
✅ HOSPITAL ACCESS APPROVED

Hospital: ${hospital.name}
Email: ${hospital.email}
Status: Active
`);

        return res.render('activDone', {
            hospital,
            message: 'Hospital account approved successfully. You can now log in.'
        });
    } catch (e) {
        console.log('Telegram Approval Error:', e);
        return res.render('401');
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
