const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Patient = require('./patient')

const hospSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim:true
    },
    email:{
        type:String,
        unique:true,
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email invalid")
            }
        }
    },
    address:{
        type: String,
        required: true,
        trim: true
    },
    password:{
        type:String,
        required:true,
        trim:true,
        validate(value){
            let s = String(value)
            if(s.length<=6){
                throw new Error("Too short password")
            }
            if(s.toLowerCase().includes("password")){
                throw new Error("password is not allowed as "+s)
            }
        }
    },
    status: {
        type: String, 
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    tokens:[
        {
            token:{
                type : String,
                required: true
            }
        }
    ],
    avatar:{
        type: Buffer
    }
},{
    timestamps:true
})


//virtual patient add
hospSchema.virtual('myPat',{
    ref:'Patient',
    localField:'_id',
    foreignField:'owner'
})

//method for checking email and password
hospSchema.statics.findByCredentials = async (email,password)=>{
    const hosp = await Hospital.findOne({email:email})

    if(!hosp){
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password,hosp.password)
    if(!isMatch){
        throw new Error('unable to login')
    }

    return hosp
}

//generate token
hospSchema.methods.generateToken = async function(){
    const hosp = this
    const token = jwt.sign({_id:hosp.id.toString()},process.env.JWT_SECRET)
    hosp.tokens = hosp.tokens.concat({token})
    await hosp.save()
    return token
}

//hiding data
hospSchema.methods.toJSON = function(){
    const hosp = this
    const hospObject = hosp.toObject()

    delete hospObject.password
    delete hospObject.tokens
    delete hospObject.avatar
    return hospObject
}

//hashing plain text
hospSchema.pre('save', async function(next){
    const hosp =  this
    if(hosp.isModified('password')){
        hosp.password = await bcrypt.hash(hosp.password,8)
    }
    next()
})


const Hospital = mongoose.model('Hospital', hospSchema)
module.exports = Hospital