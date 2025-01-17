const express=require('express')
const dbConnect = require('./config/dbconnect')
const app = express()
const dotenv = require('dotenv').config()
const PORT = process.env.PORT || 3000
const authRouter=require("./routes/authRoutes");
const productRouter= require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/prodcategoryRoute");
const blogcategoryRouter = require("./routes/blogcategoryRoute");
const brandRouter = require("./routes/brandRoute");
const couponRouter = require("./routes/couponRoute")



const bodyParser=require("body-parser");
const { notFound, errorHandler } = require('./middlewares/errorHandler')
const cookieParser = require("cookie-parser");
const morgan=require("morgan");
const cors = require("cors");



dbConnect();
// app.use('/',(req,res)=>{
//     res.send('Hello user');
// });
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());

app.use("/api/user",authRouter);
app.use("/api/product",productRouter);
app.use("/api/blog",blogRouter);
app.use("/api/category",categoryRouter);
app.use("/api/blogcategory",blogcategoryRouter);
app.use("/api/brand",brandRouter);
app.use("/api/coupon", couponRouter);





app.use(notFound);
app.use(errorHandler);

app.listen(PORT,()=>{
    console.log(`Server listening on Port ${PORT}`);
})