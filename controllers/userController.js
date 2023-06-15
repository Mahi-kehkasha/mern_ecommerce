const User=require('../models/userModel');
const bcrypt = require('bcrypt')

const securePassword = async(password)=>{

    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister =async(req,res)=>{
    try{
        res.render('registration');


    }catch(error){
        console.log(error.message);
    }
}

const insertUser = async (req,res)=>{
    try {
        const spassword = await securePassword(req.body.password)
        const user = User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            password:spassword,
            is_admin:0
        });

      const userData = await user.save()

      if(userData)
{
    res.render('registration',{message:"Your registration is successful"})
}else{
    res.render('registration',{message:"Your registration is failed"})
}

    } catch (error) {
        console.log(error.message);
    }
}
module.exports={
    loadRegister,
    insertUser
}