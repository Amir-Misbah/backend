import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
  try{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken

    await user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500,"Something went wrong while generating refresh and acces token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // get details from frontend
  // validation not empty
  // check already exist :username ,email
  //check for image check for avatar
  // upload them to cloudinary,avataar
  // create user object create entry in db
  // remove password and refresg token field from response
  // chekc for user creation
  // return res

  const { fullName, email, username, password } = req.body
  // if(fullName ==""){
  //     throw new ApiError(400,"fullName is required")
  // }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existedUser) {
    throw new ApiError(409, "user with email or username exist");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files.coverImage[0]?.path;
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  
  
  
  
  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });


  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered succesfully"));
});

const loginUser = asyncHandler(async (req,res) =>{
  //todos me 
  //get details from the frontend email password or username password
  //validate them with the email or username and password in our database 
  //sir
  //req body data
  //username or email
  //find user 
  // validate
  //access and refresh token 
  //send cookies 
  const {email , username, password} = req.body;
  if(!username && !email){
    throw new ApiError(400,"username or email required")
  }
  const user = await User.findOne({
    $or:[{username},{email}]
  })
  if(!user){
    throw new ApiError(404,"user doesnt exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
 
  if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials");
  }
  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user : loggedInUser,accessToken,refreshToken
      },
      "User logged in Succesfully"
    )
  )

});

const logoutUser = asyncHandler(async (req,res) =>{
  console.log("this is the user ",req.user)
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken : undefined
      }
    },
    {
      new:true
    }
  )
  const options = {
    httpOnly:true,
    secure:true
  }
  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200,{},"user logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req,res) =>{
  const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken
   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized token")

   }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
     if(!user){
      throw new ApiError(401,"invalid refresg token")
  
     }
     if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"refresh token is expired or used")
     }
  
     const options = {
      httpOnly:true,
      secure:true
     }
     const {newRefreshToken ,  accessToken} =  await generateAccessAndRefreshTokens(user._id)
  
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newRefreshToken,options)
     .json(200,
      {accessToken,refreshToken:newRefreshToken},
      "Acess token refreshed "
     )
  } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
  }
})

export { 
  registerUser ,
  loginUser, 
  logoutUser,
  refreshAccessToken
  };
