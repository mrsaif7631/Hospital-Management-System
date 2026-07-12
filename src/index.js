const express = require('express')
const cook = require('cookie-parser')
require('./db/mongoose.js')

const path = require('path')
const hbs = require('hbs')
const bodyParser = require('body-parser')

const hospRouter = require('./router/hosp')
const patRouter = require('./router/patient')

const app = express()
const port = process.env.PORT || 3000


app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cook())
app.use(hospRouter)
app.use(patRouter)


// app.use(function(req, res, next) {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
//     next();
// });

const public  = path.join(__dirname,'../public')
const viewpath = path.join(__dirname,'../templates/views')
const partialpath = path.join(__dirname,'../templates/partials')

app.set('view engine','hbs')
app.use(express.static(public))
app.set('views',viewpath)
hbs.registerPartials(partialpath)

app.get('/', (req,res)=>{
    res.render('index')
})

app.get('/log',(req,res)=>{
    res.render('index')
})

app.get('/patien', (req,res)=>{
    res.render('patient')
})

app.listen(port,()=>{
    console.log('server is up on port '+port)
}) 