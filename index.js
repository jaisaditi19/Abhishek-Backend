const express=require('express')
const dbConnect = require('./config/dbconnect')
const app = express()
const dotenv = require('dotenv').config()
const PORT = process.env.PORT || 3000
const authRouter=require("./routes/authRoutes");
const productRouter= require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const bodyParser=require("body-parser");
const { notFound, errorHandler } = require('./middlewares/errorHandler')
const cookieParser = require("cookie-parser");
const morgan=require("morgan");


dbConnect();
// app.use('/',(req,res)=>{
//     res.send('Hello user');
// });
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());

app.use("/api/user",authRouter);
app.use("/api/product",productRouter);
app.use("/api/blog",blogRouter);




app.use(notFound);
app.use(errorHandler);

app.listen(PORT,()=>{
    console.log(`Server listening on Port ${PORT}`);
})