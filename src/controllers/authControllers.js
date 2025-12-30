const authModel = require("../models/authModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


exports.registerUser = async (req, res) => {
    try{  
        const { name, email, password, role } = req.body;
        // Check for Validation
        if(!name || !email || !password || !role){
            return res.status(400).json({success: false, data: null, message: "ALL FIELDS ARE REQUIRED!"});
        }
        if(name.trim().length <= 2){
            return res.status(400).json({success: false, data: null, message: "NAME LENGTH MUST BE > 2"});
        }
        if(!email.includes("@")){
            return res.status(400).json({success: false, data: null, message: "INVALID EMAIL ADRESS"});
        }
        if(password.length < 8){
            return res.status(400).json({success: false, data: null, message: "PASSWORD LENGTH SHOULD BE ATLEAST 8"});
        }
        if (!["ADMIN", "AGENT", "CUSTOMER"].includes(role)) {
            return res.status(400).json({success: false, data: null, message: "INVALID ROLE"});
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };

        // return router response
        authModel.registerUser(userData, (err) => {
            if(err){
                return res.status(500).json({success: false, message: "ERROR IN REGISTERING USER: "+err.message});
            }
            return res.status(201).json({success: true, message: "USER REGISTERED SUCESSFULLY"});
        });
    }
    catch(err){
        return res.status(500).json({success: false, message: "SERVER ERROR"});
    }
}

exports.loginUser = (req, res) => {
    const { email, password } = req.body;

    // Check Input Validation Clearly
    if(!email || !password){
        return res.status(400).json({success: false, message: "ALL FIELDS ARE REQUIRED"});
    }
    if(!email.includes('@')){
        return res.status(400).json({success: false, message: "INVALID EMAIL ADDRESS"});
    }
    
    authModel.loginUser({ email }, async (err, data) => {
        if(err){
            return res.status(500).json({success: false, message: err.message, data: null});
        }
        if(!data){
            return res.status(404).json({success: false, data: null, message: "NO USER FOUND"});
        }
        const isUserValid = await bcrypt.compare(password, data.password);
        if(!isUserValid){
            return res.status(401).json({success: false, data: null, message: "INVALID CREDENTIALS"})
        }
        
        const token = jwt.sign(
            { id: data.id, role: data.role, email: data.email},
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        return res.status(200).json({success: true, token, message: "USER LOGGED IN SUCESSFULLY"});          
    });
}

exports.getProfileDetails = (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    authModel.getUserById(userId, (err, data) => {
        if(err){
            return res.status(500).json({success: false, message: "ERROR IN GETTING PROFILE DETAILS", data: null});
        }
        if(!data){
            return res.status(404).json({success: false, message: "USER NOT FOUND", data: null});
        }
        const response = {
            success: true,
            data: {
                id: data.id,
                name: data.name,
                email: data.email,
                role: data.role
            },
            message: "USER DETAILS FOUND"
        }
        return res.status(200).json(response);
    });
}


exports.changeUserPassword = async (req, res) => {
    try{   
        const { oldPassword, newPassword } = req.body;
        const email = req.user.email;
        const userId = req.user.id;

        // Validate
        if(!oldPassword || !newPassword){
            return res.status(400).json({success: false, message: "BOTH OLD AND NEW PASSWORDS ARE REQUIRED"});
        }
        if(newPassword.length<8){
            return res.status(400).json({success: false, message: "THE NEW PASSWORD LENGTH MUST BE > 8"});
        }
        if(oldPassword===newPassword){
            return res.status(400).json({success: false, message: "NEW PASSWORD MUST BE DIFFERENT FROM OLD PASSWORD"});
        }

        authModel.getUserById(userId, async (err, data) => {
            if(err){
                return res.status(500).json({success: false, message: "ERROR IN DATA FETCHING"});
            }

            if(!data){
                return res.status(404).json({success: false, message: "NO USER FOUND TO CHANGE THE PASSWORD"});
            }

            const passwordMatch = await bcrypt.compare(oldPassword, data.password);

            if(passwordMatch){

                const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                authModel.changeUserPasswordById(hashedNewPassword, userId, (err) => {
                    if(err){
                        return res.status(500).json({success: false, message: "ERROR WITH UPDATING PASSWORD"})
                    }
                    return res.status(200).json({success: true, message: "PASSWORD UPDATED SUCESSFULLY"});
                });
            }
            else{
                return res.status(401).json({success: false, message: "INCORRECT OLD PASSWORD"});
            }

        })
    }
    catch(err){
        return res.status(500).json({success: false, message: "ERROR IN SERVER"});
    }
}

exports.logoutUser = (req, res) => {
    return res.status(200).json({success: true, message: "USER LOGGED OUT SUCESSFULLY"});
}