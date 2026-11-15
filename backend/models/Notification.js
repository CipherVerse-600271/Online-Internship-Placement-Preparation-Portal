const mongoose=require("mongoose");
const notificationSchema=new mongoose.Schema({
 student:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
 application:{type:mongoose.Schema.Types.ObjectId,ref:"Application",default:null},
 internship:{type:mongoose.Schema.Types.ObjectId,ref:"Internship",default:null},
 category:{type:String,enum:["application_status","internship_match"],default:"application_status"},
 eventKey:{type:String,default:undefined},
 message:{type:String,required:true},
 status:{type:String,enum:["Pending","Shortlisted","Rejected","Accepted"],default:undefined},
 read:{type:Boolean,default:false}
},{timestamps:true});
notificationSchema.index({eventKey:1},{unique:true,sparse:true});
module.exports=mongoose.model("Notification",notificationSchema);
