const express = require('express')
const auth = require('../middleware/auth')
const Hospital = require('../model/hosp')
const router = new express.Router()
const Patient = require('../model/patient')
//const sms = require('../sendsms/sms')


router.post('/patients/add', auth, async (req, res) => {

    try {
        const normalizedStatus = req.body.status === 'Admitted' ? 'Admit' : req.body.status;
        const patient = new Patient({
            ...req.body,
            status: normalizedStatus,
            owner: req.hosp._id
        })

        await patient.save()

        res.redirect('/patients?added=1')

    } catch (e) {
        console.error('Add patient failed:', e)

        res.status(400).render('addPatient', {
            error: 'Unable to add patient.'
        })

    }

})

//add patient
// Show Add Patient Page
router.get('/patients/add', auth, (req, res) => {
    res.render('addPatient', {
        title: 'Add Patient'
    })
})

router.get('/patients', auth, async (req, res) => {

    try {

        const owner = req.hosp._id;

        const [
            patients,
            totalPatients,
            admittedPatients,
            dischargedPatients
        ] = await Promise.all([

            Patient.find({ owner })
                .sort({ createdAt: -1 })
                .lean()
                .then(items => items.map(item => ({
                    ...item,
                    formattedDate: new Date(item.createdAt).toLocaleDateString()
                }))),

            Patient.countDocuments({ owner }),

            Patient.countDocuments({
                owner,
                status: "Admit"
            }),

            Patient.countDocuments({
                owner,
                status: "Discharged"
            })

        ]);

        res.render("patient", {
            patients,
            totalPatients,
            admittedPatients,
            dischargedPatients,
            message: req.query.added === '1' ? 'Patient added successfully.' : ''
        });

    } catch (err) {

        console.error(err);

        res.status(500).render("401");

    }

});

router.get('/patients/search', auth, async (req, res) => {
    try {
        const owner = req.hosp._id;
        const searchTerm = (req.query.q || '').trim();
        const statusFilter = req.query.status || '';

        const query = { owner };

        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm, $options: 'i' } },
                { _id: searchTerm }
            ];
        }

        if (statusFilter) {
            query.status = statusFilter;
        }

        const patients = await Patient.find(query)
            .sort({ createdAt: -1 })
            .lean()
            .then(items => items.map(item => ({
                ...item,
                formattedDate: new Date(item.createdAt).toLocaleDateString()
            })));

        res.render('searchPatient', {
            title: 'Search Patients',
            patients,
            searchTerm,
            statusFilter,
            hasResults: patients.length > 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('401');
    }
});

router.get('/findPatients', auth, async (req, res) => {

    const match = {}
    if (req.query.status) {
         match.status = req.query.status
        
    }
    const sort = {}
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        await req.hosp.populate({
            path: 'myPat',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        const patients = req.hosp.myPat
        res.send(patients)
    } catch (e) {
        // res.status(500).send()
        res.render('401')
    }
})

router.post('/add_Reports/:id', auth, async (req,res)=>{
    const rep = req.body
    try{
        const patient = await Patient.findOne({_id:req.params.id,owner:req.hosp._id})
        if(!patient){
            // return res.status(404).send()
            return res.render('401')
        }
        // sms(patient.name,rep,patient.phone)
        rep.date = new Date().toString().substr(4,11)
        console.log(rep)
        await patient.AddReport(rep)
        console.log(patient.phone)
        
        // res.send(patient)
        const urlf = await '/getPat/'+ patient._id
        res.redirect(urlf)
    }catch(e){
        // res.status(500).send()
        res.render('401')
    }
})

router.get('/getPat/:id', auth, async (req, res) => {

    try {

        const patient = await Patient.findOne({
            _id: req.params.id,
            owner: req.hosp._id
        }).lean();

        if (!patient) {
            return res.status(404).render("401");
        }

        res.render("PatDetails", {
            ...patient,
            id: patient._id,
            status: patient.status,
            createdAt: new Date(patient.createdAt)
                .toLocaleDateString()
        });

    } catch (error) {

        console.error(error);

        res.status(500).render("401");

    }

});

router.get('/getResult/:id', async (req,res)=>{
    const _id = req.params.id
    try {
       
        const pat = await Patient.findOne({_id})

        if (!pat) {
            // return res.status(404).send()
            return res.render('401')
        }
        //  res.send(pat)
        res.render('getResult',{
            name: pat.name,
            age:pat.age,
            id:pat._id,
            weight:pat.weight,
            phone:pat.phone,
            createdAt:pat.createdAt.toString().substr(0,10)
        })
    } catch (e) {
        // res.status(500).send()
        res.render('401')
    }
})

router.get('/showRep/:id', async (req,res)=>{
    const _id = req.params.id
    try {
       
        const pat = await Patient.findOne({_id})

        if (!pat) {
            // return res.status(404).send()
            return res.render('401')
        }
        res.send(pat.reports)
       
    } catch (e) {
        // res.status(500).send()
        res.render('401')
    }
})

module.exports = router