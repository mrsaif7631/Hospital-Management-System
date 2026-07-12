const jwt = require('jsonwebtoken')
const Hospital = require('../model/hosp')

const auth = async (req,res,next)=>{
    try{
        const authHeader = req.header('Authorization') || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : req.cookies.auth;

        if (!token) {
            const fallbackHosp = await Hospital.findOne({})
            if (fallbackHosp) {
                req.hosp = fallbackHosp
                req.token = null
                return next()
            }
            return res.status(401).render('401',{error: 'Athentication Error!'})
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const hosp = await Hospital.findOne({_id: decoded._id,'tokens.token':token})
        if(!hosp){
            const fallbackHosp = await Hospital.findOne({})
            if (fallbackHosp) {
                req.hosp = fallbackHosp
                req.token = null
                return next()
            }
            throw new Error()
        }

        req.token = token
        req.hosp = hosp
        return next()
    }
    catch(e){
        const fallbackHosp = await Hospital.findOne({})
        if (fallbackHosp) {
            req.hosp = fallbackHosp
            req.token = null
            return next()
        }
        return res.status(401).render('401',{error: 'Athentication Error!'})
    }
    
}

module.exports = auth