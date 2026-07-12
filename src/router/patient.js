const express = require('express')
const auth = require('../middleware/auth')
const Hospital = require('../model/hosp')
const router = new express.Router()
const Patient = require('../model/patient')
//const sms = require('../sendsms/sms')

//add patient
router.post('/patients', auth, async (req, res) => {
    const patient = new Patient({
        ...req.body,
        owner: req.hosp._id
    })

    try {
        await patient.save()
        // res.status(201).send(patient)
        const urlf = '/getPat/'+ patient._id
        res.redirect(urlf)
    } catch (e) {
        // res.status(400).send(e)
        res.render('401')
    }
})

//sort the patient
///patients?status=Admit or Discharged
//limit & skip
// GET /tasks?limit=10&skip=0
//sort
//GET /tasks?sortBy=createdAt_asc or desc
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

router.get('/getPat/:id', auth, async (req,res)=>{
    const _id = req.params.id
    try {
       
        const pat = await Patient.findOne({ _id, owner: req.hosp._id })

        if (!pat) {
            // return res.status(404).send()
            return res.render('401')
        }
        // res.send(pat)
        res.render('PatDetails',{
            name: pat.name,
            age:pat.age,
            address:pat.address,
            gender:pat.gender,
            id:pat._id,
            weight:pat.weight,
            phone:pat.phone,
            createdAt:pat.createdAt.toString().substr(4,12)
        })
    } catch (e) {
        // res.status(500).send()
        res.render('401')
    }
})

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