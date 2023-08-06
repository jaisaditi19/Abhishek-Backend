const User = require("../models/userModel");
const asyncHandler=require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbid");
const { generateRefreshToken } = require("../config/refreshToken");
const { JsonWebTokenError } = require("jsonwebtoken");
const { decode } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const crypto= require("crypto");



//create a user
const createUser =asyncHandler(async(req,res)=>{
    const email=req.body.email;
    const findUser=await User.findOne({email:email});
    if(!findUser)
    {
        //create new user
        const newUser = await User.create(req.body);
        res.json(newUser);
    }else{
        throw new Error("User already exists");
    }
});

//login a user
const loginUserCtrl =asyncHandler(async(req,res)=>{
    const{email,password}=req.body;
    //check if user exists
    const findUser = await User.findOne({email:email});
    if(findUser && await findUser.isPasswordMatched(password)){
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateuser=await User.findByIdAndUpdate(findUser.id, {refreshToken:refreshToken},{new:true});
        res.cookie('refreshToken', refreshToken,{
            httpOnly:true,
            maxAge:72*60*60*1000,
        })
        res.json({
            _id:findUser?._id,
            firstname:findUser?.firstname,
            lastname:findUser?.lastname,
            email:findUser?.email,
            mobile:findUser?.mobile,
            token:generateToken(findUser?._id),
        });
    }else{
        throw new Error("Invalid Credentials");
    }
});

//handle refresh token

 const handleRefreshToken = asyncHandler(async(req,res)=>{
    const cookie=req.cookies;
    if(!cookie?.refreshToken) throw new Error("No Refresh Token in Cookie");
    const refreshToken = cookie.refreshToken;
    const user=await User.findOne({refreshToken});
    if(!user) throw new Error("No refresh token in database");
    jwt.verify(refreshToken,process.env.JWT_SECRET,(err,decode)=>{
        if(err || user.id !== decode.id){
            throw new Error("There is something wrong with the refresh token");
        }
        const accessToken = generateToken(user?._id);
        res.json({accessToken:accessToken});
    });
    // res.json(user);
 })

 //logout a user

 const logout=asyncHandler(async(req,res)=>{
    const cookie=req.cookies;
    if(!cookie?.refreshToken) throw new Error("No Refresh Token in cookies");
    const refreshToken=cookie.refreshToken;
    const user=await User.findOne({refreshToken});
    if(!user){
        res.clearCookie("refreshToken",{
            httpOnly:true,
            secure:true,
        });
        return res.sendStatus(204);
    }
    await User.findOneAndUpdate({refreshToken},{
        refreshToken: "",
    });
    res.clearCookie("refreshToken",{
        httpOnly:true,
        secure:true,
    });
    return res.sendStatus(204);
 });

//update a user

const updateaUser=asyncHandler(async(req,res)=>{
    const {_id}=req.user;
    validateMongoDbId(_id);
    try{
        const updatedUser=await User.findByIdAndUpdate(_id,{
            firstname:req?.body?.firstname,
            lastname:req?.body?.lastname,
            email:req?.body?.email,
            mobile:req?.body?.mobile
        },
        {
            new:true,
        });
        res.json(updatedUser);
    } catch(error){
        throw new Error(error); 
    }
})

//get all users

const getallUser=asyncHandler(async(req,res)=>{
    try{
        const getUsers = await User.find();
        res.json(getUsers);
    } catch(error){
        throw new Error(error);
    }
})

//get a single user

const getaUser=asyncHandler(async(req,res)=>{
    const {_id}=req.user;
    validateMongoDbId(id);

    try{
        const getaUser = await User.findById(_id);
        res.json(getaUser);
    } catch(error){
        throw new Error(error);
    }
})

//delete a user

const deleteaUser=asyncHandler(async(req,res)=>{
    const {_id}=req.user;
    validateMongoDbId(id);

    try{
        const deleteaUser = await User.findByIdAndDelete(_id);
        res.json(deleteaUser);
    } catch(error){
        throw new Error(error);
    }
});

//block a user

const blockUser=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    validateMongoDbId(id);

    try{
        const block=await User.findByIdAndUpdate(id,{
            isBlocked: true,
        },{
            new:true,
        });
        res.json(block)
    }catch(error){
        throw new Error(error);
    }
});

//unblock a user

const unblockUser=asyncHandler(async(req,res)=>{
    const {id}=req.params;
    validateMongoDbId(id);

    try{
        const unblock=await User.findByIdAndUpdate(id,{
            isBlocked: false,
        },{
            new:true,
        });
        res.json({
            message:"user unblocked",
        })
    }catch(error){
        throw new Error(error);
    }
});

const updatePassword=asyncHandler(async(req,res)=>{
    const { _id }= req.user;
    const {password}=req.body;
    validateMongoDbId(_id);
    const user=await User.findById(_id);
    if(password){
        user.password=password;
        const updatedPassword=await user.save();
        res.json(updatedPassword);
    } else{
        res.json(user);
    }
}) ;

const forgotPasswordToken=asyncHandler(async(req,res)=>{
    const {email}=req.body;
    const user = await User.findOne({email});
    if(!user) throw new Error("User not found with this email");
    try{
        const token=await user.createPasswordResetToken();
        await user.save();
        const resetURL=`Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:8000/api/user/reset-password/${token}'>Click Here</>`;
        const data={
            to:email,
            text:"Hey User",
            subject:"Forgot Password Link",
            htm: resetURL,
        };
        sendEmail(data);
        res.json(token);
    }catch(error){
        throw new Error(error);
    }
});

const resetPassword=asyncHandler(async(req,res)=>{
    const {password}=req.body;
    const {token}=req.params;
    const hashedToken =crypto.createHash("sha256").update(token).digest("hex");
    const user=await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpires:{$gt:Date.now()},
    });
    if(!user) throw new Error("Token expired, Please try again later");
    user.password=password;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save();
    res.json(user);
});



module.exports={createUser,loginUserCtrl,getallUser,getaUser,deleteaUser,updateaUser,blockUser,unblockUser,handleRefreshToken,logout,updatePassword,forgotPasswordToken,resetPassword}