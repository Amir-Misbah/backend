import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const { fulName, email, username, password } = req.body;
  console.log("email", email);
  // if(fullName ==""){
  //     throw new ApiError(400,"fullName is required")
  // }
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "user with email or username exist");
  }
  const avatarLocalPath = req.files?.avatar[0].path;
  const coverImageLocalPath = req.files.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avataar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const converImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Avataar is required");
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
  return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered succesfully")
  )
});

export { registerUser };
