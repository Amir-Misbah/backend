// require('dotenv').config({path:'./env'})

// import express from express

// const app = express()

// (async () =>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//        app.on("error",(error) =>{
//         console.log("ERR:",error)
//         throw error
//        })
//        app.listen(process.env.PORT,()=>{
//         console.log(`app is listing on the port${process.env.PORT}`)
//        })
//     }catch(error){
//         console.error("ERROR :" ,error)
//         throw err
//     }
// })()

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from './app.js';


dotenv.config({
  path: "./.env",
});
// database connection always returns a promise
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`App is listning to the port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("there is some problem in database connection", err);
  });
