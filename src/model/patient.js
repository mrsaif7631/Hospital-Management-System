const mongoose = require('mongoose')

const patientSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    age:{
        type:Number,
        required:true,
        trim:true
    },
    weight:{
        type:Number,
        required:true,
        trim:true
    },
    gender:{
        type:String,
        enum:['Female','Male', 'Other']
    },
    phone:{
        type:Number,
        required:true,
        trim :true
    },
    address:{
        type:String
    },
    status:{
        type: String,
        enum:['Discharged','Admit']
    },
    reports:[],
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'Hospital'
    }
},{
    timestamps:true
})

patientSchema.methods.AddReport = async function(report){
    const patient = this
    
    patient.reports = patient.reports.concat(report)
    await patient.save()
    return report
}

const Patient = mongoose.model('Patient',patientSchema)
module.exports = Patient